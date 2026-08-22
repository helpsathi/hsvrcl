import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { dispatchNotification } from "@/lib/notifications";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Reject processing if secret is not set or set to dummy placeholder value
    if (!webhookSecret || webhookSecret === "REPLACE_ME" || webhookSecret === "fallback_secret") {
      console.error("RAZORPAY_WEBHOOK_SECRET not set or is placeholder — rejecting unverified webhook");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    const isValid = verifyRazorpayWebhookSignature(bodyText, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const userId = notes.userId;
      const type = notes.type || "WALLET_RECHARGE";
      const amount = (paymentEntity?.amount || 0) / 100; // convert paise to INR

      if (false && userId && amount > 0 && type === "WALLET_RECHARGE") {
        // Prevent duplicate transaction processing using atomic database transaction
        const paymentRef = paymentEntity?.id || payload.event_id;
        const processed = await prisma.$transaction(async (tx) => {
          const existingTx = await tx.transaction.findFirst({
            where: { referenceId: paymentRef },
          });

          if (existingTx) {
            return false;
          }

          const userWallet = await tx.wallet.upsert({
            where: { userId },
            update: { balance: { increment: amount } },
            create: { userId, balance: amount },
          });

          await tx.transaction.create({
            data: {
              walletId: userWallet.id,
              type: "CREDIT",
              amount,
              description: `Razorpay Online Recharge`,
              referenceId: paymentRef,
            },
          });

          await tx.payment.upsert({
            where: { id: paymentRef || `webhook_${Date.now()}` },
            update: { status: "SUCCESS" },
            create: {
              userId,
              orderId: paymentEntity?.order_id || payload.event_id,
              paymentId: paymentRef || payload.event_id,
              signature: "WEBHOOK",
              amount,
              currency: "INR",
              status: "SUCCESS",
              purpose: "WALLET_RECHARGE"
            }
          });

          return true;
        });

        if (processed) {
          await dispatchNotification({
            userId,
            title: "💳 Wallet Recharged!",
            message: `+₹${amount} credited to your HelpSathi balance via online recharge.`,
            type: "PAYMENT",
            link: "/wallet",
          });
        }
      } else if (amount > 0 && type === "MONTHLY_SUBSCRIPTION") {
        const studentId = notes.studentId;
        const mentorId = notes.mentorId;
        const paymentRef = paymentEntity?.id || payload.event_id;

        if (studentId && mentorId) {
          const processedData = await prisma.$transaction(async (tx) => {
            const existingTx = await tx.transaction.findFirst({
              where: { referenceId: paymentRef },
            });
            if (existingTx) return null; // already processed by frontend

            const mentor = await tx.mentorProfile.findFirst({
              where: { OR: [{ id: mentorId }, { userId: mentorId }] }
            });
            if (!mentor) return null;

            const existingSub = await tx.subscription.findFirst({
              where: { studentId, mentorId: mentor.id },
              orderBy: { endDate: "desc" }
            });

            const now = new Date();
            const baseDate = (existingSub && existingSub.isActive && existingSub.endDate > now) ? new Date(existingSub.endDate) : new Date();
            const endDate = new Date(baseDate);
            endDate.setMonth(endDate.getMonth() + 1);

            if (existingSub) {
              await tx.subscription.update({
                where: { id: existingSub.id },
                data: { price: amount, endDate, isActive: true, paymentMethod: "RAZORPAY" }
              });
            } else {
              await tx.subscription.create({
                data: { studentId, mentorId: mentor.id, price: amount, startDate: new Date(), endDate, isActive: true, autoRenew: false, paymentMethod: "RAZORPAY" }
              });
            }

            const defaultCommission = await getPlatformConfigNumber(CONFIG_KEYS.PLATFORM_COMMISSION_RATE);
            const commissionRate = mentor.commissionRate ?? defaultCommission;
            const platformCommission = amount * (commissionRate / 100);
            const earnings = amount - platformCommission;

            const mentorWallet = await tx.wallet.upsert({
              where: { userId: mentor.userId },
              update: { balance: { increment: earnings } },
              create: { userId: mentor.userId, balance: earnings },
            });

            await tx.transaction.create({
              data: {
                walletId: mentorWallet.id,
                type: "CREDIT",
                amount: earnings,
                description: "Subscription Earning (Late Sync)",
                referenceId: paymentRef,
              },
            });
            return { earnings, mentorUserId: mentor.userId, studentId };
          });

          if (processedData) {
            await dispatchNotification({
              userId: processedData.mentorUserId,
              title: "🎉 New Subscription (Late Sync)!",
              message: `A student subscribed to your mentorship. +₹${processedData.earnings} added to your earnings.`,
              type: "PAYMENT",
              link: "/mentor-dashboard",
            });
            await dispatchNotification({
              userId: processedData.studentId,
              title: "✅ Subscription Activated",
              message: `Your pending payment was processed successfully. You can now chat with your mentor!`,
              type: "PAYMENT",
              link: "/my-mentors",
            });
          }
        }
      }
    } else if (event === "subscription.charged") {
      // Handle Autopay renewal only if subscription is currently active (not explicitly cancelled by student)
      const subEntity = payload.payload?.subscription?.entity;
      const paymentEntity = payload.payload?.payment?.entity;
      const paymentRef = paymentEntity?.id || payload.event_id;
      const notes = subEntity?.notes || {};
      const studentId = notes.studentId;
      const mentorId = notes.mentorId;
      const amount = (paymentEntity?.amount || subEntity?.amount_paid || 0) / 100;

      if (studentId && mentorId) {
        await prisma.$transaction(async (tx) => {
          // Prevent duplicate webhook execution
          if (paymentRef) {
            const existingTx = await tx.transaction.findFirst({
              where: { referenceId: paymentRef },
            });
            if (existingTx) return;
          }

          const existingSub = await tx.subscription.findFirst({
            where: { studentId, mentorId },
            orderBy: { endDate: "desc" }
          });

          if (existingSub && existingSub.isActive) {
            const newEndDate = new Date(existingSub.endDate);
            newEndDate.setMonth(newEndDate.getMonth() + 1);
            
            await tx.subscription.update({
              where: { id: existingSub.id },
              data: { endDate: newEndDate }
            });

            // Calculate commission and credit mentor wallet
            const mentorProfile = await tx.mentorProfile.findUnique({
              where: { id: existingSub.mentorId },
            });

            if (mentorProfile) {
              const defaultCommission = await getPlatformConfigNumber(CONFIG_KEYS.PLATFORM_COMMISSION_RATE);
              const commissionRate = mentorProfile.commissionRate ?? defaultCommission;
              const chargedAmount = amount > 0 ? amount : existingSub.price;
              const platformCommission = chargedAmount * (commissionRate / 100);
              const earnings = Math.round((chargedAmount - platformCommission) * 100) / 100;

              const mentorWallet = await tx.wallet.upsert({
                where: { userId: mentorProfile.userId },
                update: { balance: { increment: earnings } },
                create: { userId: mentorProfile.userId, balance: earnings },
              });

              await tx.transaction.create({
                data: {
                  walletId: mentorWallet.id,
                  type: "CREDIT",
                  amount: earnings,
                  description: `Subscription Autopay Renewal`,
                  referenceId: paymentRef || `SUB_${existingSub.id}_${Date.now()}`,
                },
              });

              await dispatchNotification({
                userId: mentorProfile.userId,
                title: "🔄 Subscription Renewed!",
                message: `A student renewed their subscription. +₹${earnings} added to your earnings after ${commissionRate}% platform fee.`,
                type: "PAYMENT",
                link: "/mentor-dashboard",
              });

              await dispatchNotification({
                userId: studentId,
                title: "🔄 Subscription Renewed!",
                message: `Your mentorship subscription with ${mentorProfile.username || "your mentor"} has been renewed for 1 month.`,
                type: "PAYMENT",
                link: "/my-mentors",
              });
            }
          }
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
