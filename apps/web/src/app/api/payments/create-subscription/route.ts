import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { paymentRateLimiter } from "@/lib/rateLimit";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitCheck = paymentRateLimiter.check(`pay_sub_${session.userId}`);
    if (!limitCheck.success) {
      return NextResponse.json({ error: "Too many subscription attempts. Please wait before retrying." }, { status: 429 });
    }

    const { amount, mentorId, paymentMethod = "RAZORPAY", couponCode, discountApplied } = await req.json();

    if (!amount || amount <= 0 || !mentorId) {
      return NextResponse.json({ error: "Invalid amount or mentorId" }, { status: 400 });
    }

    const mentorProfile = await prisma.mentorProfile.findFirst({
      where: {
        OR: [
          { id: mentorId },
          { userId: mentorId }
        ]
      },
      include: { user: true }
    });

    if (!mentorProfile || !mentorProfile.user) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const actualMentorProfileId = mentorProfile.id;
    const mentorName = mentorProfile.user.name;

    // L5: Handle instant activation if student opts for direct WALLET payment method
    if (paymentMethod === "WALLET") {
      const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
      if (!wallet || wallet.balance < amount) {
        return NextResponse.json({ error: "Insufficient available wallet balance for subscription activation." }, { status: 400 });
      }

      const defaultCommission = await getPlatformConfigNumber(CONFIG_KEYS.PLATFORM_COMMISSION_RATE);

      const subscription = await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount } },
        });

        const sub = await tx.subscription.create({
          data: {
            studentId: session.userId,
            mentorId: actualMentorProfileId,
            price: amount,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days valid
            isActive: true,
            autoRenew: true,
            paymentMethod: "WALLET",
          },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "DEBIT",
            amount: amount,
            description: `Monthly Mentorship Subscription: ${mentorName || mentorId}`,
            referenceId: sub.id,
          },
        });

        // Credit mentor earnings
        const commissionRate = mentorProfile.commissionRate ?? defaultCommission;
        const platformCommission = Number(amount) * (commissionRate / 100);
        const earnings = Number(amount) - platformCommission;

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
            description: `Subscription Earning (${commissionRate}% platform commission deducted)`,
            referenceId: sub.id,
          },
        });

        // Handle coupon usage inside transaction
        if (couponCode) {
          const coupon = await tx.coupon.findUnique({
            where: { code: String(couponCode).trim().toUpperCase() },
          });
          if (coupon) {
            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,
                userId: session.userId,
                discountApplied: Number(discountApplied || 0),
              },
            });
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        }

        await tx.payment.create({
          data: {
            userId: session.userId,
            orderId: `sub_${sub.id}`,
            paymentId: `wallet_${Date.now()}`,
            signature: "WALLET",
            amount,
            currency: "INR",
            status: "SUCCESS",
            purpose: "SUBSCRIPTION"
          }
        });

        return sub;
      });

      return NextResponse.json({ success: true, paymentMethod: "WALLET", subscription });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay is not configured. Please add API keys." }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    let subscriptionId: string | undefined;
    let orderId: string | undefined;

    try {
      // 1. Try attempting to create a Recurring Plan & Subscription in Razorpay
      const plan = await razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: `Mentorship: ${mentorName || mentorId}`,
          amount: Math.round(amount * 100), // in paise
          currency: "INR",
          description: "Monthly Mentor Subscription on HelpSathi",
        },
      });

      const subscription = await razorpay.subscriptions.create({
        plan_id: plan.id,
        total_count: 12, // Default to 12 months (1 year), user can cancel anytime
        quantity: 1,
        customer_notify: 1,
        notes: {
          studentId: session.userId,
          mentorId: actualMentorProfileId,
          type: "MONTHLY_SUBSCRIPTION",
        },
      });
      subscriptionId = subscription.id;
    } catch (rzpSubError: any) {
      console.warn("Razorpay Subscriptions API failed (recurring billing disabled or KYC pending on Test Account). Falling back to standard Razorpay Orders API:", rzpSubError);
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `sub_${session.userId.slice(0, 8)}_${Date.now()}`,
        notes: {
          studentId: session.userId,
          mentorId: actualMentorProfileId,
          type: "MONTHLY_SUBSCRIPTION",
        },
      });
      orderId = order.id;
    }

    return NextResponse.json({
      subscriptionId,
      orderId,
      amount: amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Create Subscription Error:", error);
    if (error.statusCode === 401 || error.statusCode === 403 || error.error === "Unauthorized") {
      return NextResponse.json({ error: "Razorpay Gateway Authentication Failed (Test Keys Unauthorized). Please select HelpSathi Wallet to pay using your balance." }, { status: 400 });
    }
    const errObj = error.error || error.description || error;
    const errorMessage = typeof errObj === "string" ? errObj : errObj.description || error.message || JSON.stringify(errObj) || "Failed to create subscription";
    return NextResponse.json({ error: errorMessage }, { status: error.statusCode || 500 });
  }
}
