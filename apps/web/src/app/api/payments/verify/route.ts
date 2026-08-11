import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, DEFAULT_TRANSACTION_OPTIONS } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { dispatchNotification } from "@/lib/notifications";
import { paymentRateLimiter } from "@/lib/rateLimit";
import { formatDatabaseError } from "@/lib/errors";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const limitStatus = paymentRateLimiter.check(`pay_${session.userId}`);
    if (!limitStatus.success) {
      return NextResponse.json({ error: "Too many payment verification requests. Please try again later." }, { status: 429 });
    }

    const { orderId, paymentId, signature, amount, couponCode, discountApplied } = await req.json();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(orderId, paymentId, signature, secret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature. Possible fraud attempt." }, { status: 400 });
    }

    // Verify order amount directly from Razorpay (Issue 6 fix)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: secret,
    });
    try {
      const razorpayOrder = await razorpay.orders.fetch(orderId);
      if (!razorpayOrder || Number(razorpayOrder.amount) !== Number(amount)) {
        return NextResponse.json({ error: "Payment amount mismatch. Possible fraud attempt." }, { status: 400 });
      }
    } catch (err) {
      console.error("Failed to fetch order from Razorpay during verification:", err);
      return NextResponse.json({ error: "Failed to verify payment order details." }, { status: 500 });
    }

    const amountInINR = Number(amount) / 100; // convert paise to INR

    // Idempotency & race condition defense via atomic transaction
    const { wallet, alreadyProcessed } = await prisma.$transaction(async (tx) => {
      const existingTx = await tx.transaction.findFirst({
        where: { referenceId: paymentId },
      });

      if (existingTx) {
        const existingWallet = await tx.wallet.findUnique({
          where: { userId: session.userId },
        });
        return { wallet: existingWallet, alreadyProcessed: true };
      }

      const discount = Number(discountApplied || 0);
      const totalCreditAmount = discount > 0 ? (amountInINR + discount) : amountInINR;

      const updatedWallet = await tx.wallet.upsert({
        where: { userId: session.userId },
        update: { balance: { increment: totalCreditAmount } },
        create: { userId: session.userId, balance: totalCreditAmount },
      });

      await tx.transaction.create({
        data: {
          walletId: updatedWallet.id,
          type: "CREDIT",
          amount: totalCreditAmount,
          description: discount > 0 
            ? `Wallet Recharge (Paid ₹${amountInINR} + Coupon Bonus ₹${discount})` 
            : `Wallet Recharge via Razorpay`,
          referenceId: paymentId,
        },
      });

      if (couponCode) {
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
      }

      await tx.payment.create({
        data: {
          userId: session.userId,
          orderId: orderId,
          paymentId: paymentId,
          signature: signature,
          amount: amountInINR,
          currency: "INR",
          status: "SUCCESS",
          purpose: "WALLET_RECHARGE"
        }
      });

      return { wallet: updatedWallet, alreadyProcessed: false };
    }, DEFAULT_TRANSACTION_OPTIONS);

    if (alreadyProcessed) {
      return NextResponse.json({ success: true, alreadyProcessed: true, balance: wallet?.balance ?? 0 });
    }



    await dispatchNotification({
      userId: session.userId,
      title: "💳 Wallet Recharged!",
      message: `+₹${amountInINR} successfully credited to your HelpSathi balance via Razorpay.`,
      type: "PAYMENT",
      link: "/wallet",
    });

    return NextResponse.json({ success: true, balance: wallet?.balance ?? 0 });
  } catch (error: any) {
    console.error("Payment Verify Error:", error);
    const friendlyMsg = formatDatabaseError(error, "Payment verification failed. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}
