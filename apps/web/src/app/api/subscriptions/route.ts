import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, DEFAULT_TRANSACTION_OPTIONS } from "@/lib/prisma";
import { verifyRazorpaySignature, verifySubscriptionSignature } from "@/lib/razorpay";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";
import { formatDatabaseError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mentorId, price, paymentId, orderId, signature, subscriptionId, couponCode, discountApplied } = await req.json();

    if (!mentorId || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify Razorpay signature if direct payment was made
    const isDirectPayment = Boolean(paymentId && signature && (orderId || subscriptionId));
    if (isDirectPayment) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });
      }
      
      let isValid = false;
      if (subscriptionId) {
        isValid = verifySubscriptionSignature(subscriptionId, paymentId, signature, secret);
      } else if (orderId) {
        isValid = verifyRazorpaySignature(orderId, paymentId, signature, secret);
      }

      if (!isValid) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
      }
    }

    const defaultCommission = await getPlatformConfigNumber(CONFIG_KEYS.PLATFORM_COMMISSION_RATE);

    const result = await prisma.$transaction(async (tx) => {
      // Resolve mentor profile first by either profile ID or user ID
      const mentor = await tx.mentorProfile.findFirst({
        where: {
          OR: [
            { id: mentorId },
            { userId: mentorId }
          ]
        },
      });
      if (!mentor) {
        throw new Error("Mentor profile not found");
      }
      if (mentor.userId === session.userId) {
        throw new Error("You cannot subscribe to your own mentor profile.");
      }
      const actualMentorProfileId = mentor.id;

      // Check existing subscription status
      const existingSub = await tx.subscription.findFirst({
        where: {
          studentId: session.userId,
          mentorId: actualMentorProfileId,
        },
        orderBy: { endDate: "desc" }
      });

      const now = new Date();
      const nextPaymentMethod = isDirectPayment ? "RAZORPAY" : "WALLET";

      if (existingSub && existingSub.isActive && existingSub.endDate > now) {
        const daysLeft = Math.ceil((existingSub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        // Prevent duplicate purchase unless renewing within 15 days or switching AutoPay gateway method
        if (daysLeft > 15 && existingSub.paymentMethod === nextPaymentMethod) {
          throw new Error("You already have an active subscription with this mentor.");
        }
      }

      // 1. If not direct Razorpay payment, handle wallet deduction safely
      if (!isDirectPayment) {
        const wallet = await tx.wallet.findUnique({
          where: { userId: session.userId },
        });

        if (!wallet || wallet.balance < price) {
          throw new Error("Insufficient wallet balance for subscription purchase");
        }

        // Deduct Balance atomically with conditional check against TOCTOU race
        const updateResult = await tx.wallet.updateMany({
          where: { id: wallet.id, balance: { gte: Number(price) } },
          data: { balance: { decrement: Number(price) } },
        });

        if (updateResult.count === 0) {
          throw new Error("Insufficient wallet balance during processing");
        }

        // Create Transaction
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "DEBIT",
            amount: Number(price),
            description: "Mentor Subscription Purchase / Renewal",
          },
        });
      }

      // 2. Create or extend Subscription (1 month)
      const baseDate = (existingSub && existingSub.isActive && existingSub.endDate > now) ? new Date(existingSub.endDate) : new Date();
      const endDate = new Date(baseDate);
      endDate.setMonth(endDate.getMonth() + 1);

      let subscription;
      if (existingSub) {
        subscription = await tx.subscription.update({
          where: { id: existingSub.id },
          data: {
            price: Number(price),
            endDate,
            isActive: true,
            autoRenew: true,
            paymentMethod: nextPaymentMethod,
            razorpaySubId: subscriptionId || null,
          },
        });
      } else {
        subscription = await tx.subscription.create({
          data: {
            studentId: session.userId,
            mentorId: actualMentorProfileId,
            price: Number(price),
            startDate: new Date(),
            endDate,
            isActive: true,
            autoRenew: true,
            paymentMethod: nextPaymentMethod,
            razorpaySubId: subscriptionId || null,
          },
        });
      }

      // 3. Add earnings to Mentor Profile using dynamic platform commission rate
      const commissionRate = mentor.commissionRate ?? defaultCommission;
      const platformCommission = Number(price) * (commissionRate / 100);
      const earnings = Number(price) - platformCommission;

      // Note: In reality, we should add this to the Mentor's wallet.
      // But for now, we just have one unified wallet per User.
      // Let's add it to the mentor's user wallet.
      const mentorWallet = await tx.wallet.findUnique({
        where: { userId: mentor!.userId },
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
            description: "Subscription Earning",
            referenceId: paymentId || undefined,
          },
        });
      } else {
        // Create wallet for mentor if they don't have one
        await tx.wallet.create({
          data: {
            userId: mentor!.userId,
            balance: earnings,
            transactions: {
              create: {
                type: "CREDIT",
                amount: earnings,
                description: "Subscription Earning",
                referenceId: paymentId || undefined,
              }
            }
          }
        });
      }

      if (couponCode) {
        try {
          const coupon = await tx.coupon.findUnique({
            where: { code: String(couponCode).trim().toUpperCase() }
          });
          if (coupon) {
            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,
                userId: session.userId,
                discountApplied: Number(discountApplied || 0)
              }
            });
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } }
            });
          }
        } catch (e) {
          console.error("Failed to record coupon usage in subscription purchase:", e);
        }
      }

      return subscription;
    }, DEFAULT_TRANSACTION_OPTIONS);

    return NextResponse.json({ success: true, subscription: result });

  } catch (error: any) {
    console.error("Subscription Error:", error);
    const friendlyMsg = formatDatabaseError(error, "Failed to process subscription. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { studentId: session.userId },
      include: {
        mentor: {
          include: {
            user: {
              select: { name: true, avatar: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
