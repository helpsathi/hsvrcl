import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";
import { paymentRateLimiter } from "@/lib/rateLimit";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitCheck = paymentRateLimiter.check(`pay_order_${session.userId}`);
    if (!limitCheck.success) {
      return NextResponse.json({ error: "Too many order requests. Please try again after some time." }, { status: 429 });
    }

    const { amount, type = "WALLET_RECHARGE" } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (type === "WALLET_RECHARGE") {
      const minRecharge = await getPlatformConfigNumber(CONFIG_KEYS.MIN_WALLET_RECHARGE);
      if (Number(amount) < minRecharge) {
        return NextResponse.json({ error: `Minimum wallet recharge amount is ₹${minRecharge}` }, { status: 400 });
      }
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay is not configured. Please add API keys." }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert INR to paise
      currency: "INR",
      receipt: `rcpt_${session.userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: session.userId,
        type,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create payment order" }, { status: 500 });
  }
}
