import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = !!process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET;
  const isCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const url = new URL(req.url);
  const isDevOverride = process.env.NODE_ENV !== "production" && url.searchParams.get("auth_override") === "true";

  if (!isCron && !isInternal && !isDevOverride && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find active subscriptions with AutoPay turned ON that are expiring within the next 24 hours or recently expired
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        isActive: true,
        autoRenew: true,
        endDate: { lte: next24Hours },
      },
      include: {
        student: { include: { wallet: true } },
        mentor: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });

    const defaultCommission = await getPlatformConfigNumber(CONFIG_KEYS.PLATFORM_COMMISSION_RATE);

    let renewedCount = 0;
    let fallbackPromptsCount = 0;
    let expiredDeactivatedCount = 0;

    for (const sub of expiringSubscriptions) {
      const isPastGracePeriod = (now.getTime() - sub.endDate.getTime()) > (48 * 60 * 60 * 1000); // 48-hour grace period

      if (sub.paymentMethod === "WALLET") {
        const studentWallet = sub.student.wallet;

        if (studentWallet && studentWallet.balance >= sub.price) {
          // Perform atomic deduction and renewal in a transaction
          try {
            await prisma.$transaction(async (tx) => {
              // Atomically deduct student balance
              const decRes = await tx.wallet.updateMany({
                where: { id: studentWallet.id, balance: { gte: sub.price } },
                data: { balance: { decrement: sub.price } },
              });

              if (decRes.count === 0) {
                throw new Error("Insufficient balance during atomic deduction");
              }

              await tx.transaction.create({
                data: {
                  walletId: studentWallet.id,
                  type: "DEBIT",
                  amount: sub.price,
                  description: `AutoPay Renewal: Mentorship with ${sub.mentor.user.name}`,
                }
              });

              // Extend subscription end date by 1 month
              const newEndDate = new Date(sub.endDate);
              newEndDate.setMonth(newEndDate.getMonth() + 1);

              await tx.subscription.update({
                where: { id: sub.id },
                data: { endDate: newEndDate, isActive: true },
              });

              // Calculate commission and credit mentor wallet
              const commissionRate = sub.mentor.commissionRate ?? defaultCommission;
              const earnings = sub.price * (1 - (commissionRate / 100));

              const mentorWallet = await tx.wallet.findUnique({
                where: { userId: sub.mentor.userId }
              });

              if (mentorWallet) {
                await tx.wallet.update({
                  where: { id: mentorWallet.id },
                  data: { balance: { increment: earnings } },
                });
                await tx.transaction.create({
                  data: {
                    walletId: mentorWallet.id,
                    type: "CREDIT",
                    amount: earnings,
                    description: "AutoPay Subscription Earning",
                  }
                });
              } else {
                await tx.wallet.create({
                  data: {
                    userId: sub.mentor.userId,
                    balance: earnings,
                    transactions: {
                      create: {
                        type: "CREDIT",
                        amount: earnings,
                        description: "AutoPay Subscription Earning",
                      }
                    }
                  }
                });
              }
            });

            await dispatchNotification({
              userId: sub.studentId,
              title: "✅ AutoPay Renewal Successful",
              message: `₹${sub.price} has been deducted from your wallet to renew mentorship with ${sub.mentor.user.name} for another month!`,
              type: "SUBSCRIPTION",
              link: "/my-mentors",
            });

            await dispatchNotification({
              userId: sub.mentor.userId,
              title: "🎉 Subscriber Auto-Renewed",
              message: `A subscriber auto-renewed their mentorship subscription!`,
              type: "SUBSCRIPTION",
              link: "/mentor-dashboard",
            });

            renewedCount++;
          } catch (e) {
            console.error(`AutoPay renewal error for subscription ${sub.id}:`, e);
          }
        } else {
          // Insufficient Wallet Balance -> Trigger Intelligent Gateway Fallback Prompt!
          if (!isPastGracePeriod) {
            await dispatchNotification({
              userId: sub.studentId,
              title: "⚠️ Action Required: Switch AutoPay to UPI / Razorpay",
              message: `Your HelpSathi Wallet balance (₹${studentWallet?.balance ?? 0}) is below ₹${sub.price}. Click here to instantly renew via UPI, Credit/Debit Cards (Razorpay) and maintain uninterrupted free call benefits!`,
              type: "SUBSCRIPTION",
              link: "/my-mentors",
            });
            fallbackPromptsCount++;
          } else {
            // Past 48-hour grace period without recharge or Gateway setup -> Deactivate
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { isActive: false, autoRenew: false },
            });
            await dispatchNotification({
              userId: sub.studentId,
              title: "❌ Subscription Expired (AutoPay Failed)",
              message: `Your mentorship with ${sub.mentor.user.name} has expired due to insufficient funds. Renew anytime via UPI / Razorpay or Wallet recharge!`,
              type: "SUBSCRIPTION",
              link: `/mentors/${sub.mentorId}`,
            });
            expiredDeactivatedCount++;
          }
        }
      } else if (sub.paymentMethod === "RAZORPAY") {
        // Razorpay handles auto-billing directly via bank mandates; if 3 days past expiration without recharge webhook, expire it
        if ((now.getTime() - sub.endDate.getTime()) > (72 * 60 * 60 * 1000)) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { isActive: false, autoRenew: false },
          });
          expiredDeactivatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: expiringSubscriptions.length,
      renewedCount,
      fallbackPromptsCount,
      expiredDeactivatedCount,
    });
  } catch (error: any) {
    console.error("AutoPay Cron Job Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
