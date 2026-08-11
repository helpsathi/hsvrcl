import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId, mentorId, autoRenew } = await req.json();

    if (!subscriptionId && !mentorId) {
      return NextResponse.json({ error: "Subscription ID or Mentor ID is required" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        ...(subscriptionId ? { id: subscriptionId } : { mentorId }),
        studentId: session.userId,
        isActive: true,
      },
      include: {
        mentor: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Active subscription not found" }, { status: 404 });
    }

    const newAutoRenew = Boolean(autoRenew);

    // If disabling AutoPay and we have an active Razorpay recurring mandate, pause or cancel the mandate at cycle end
    if (!newAutoRenew && subscription.razorpaySubId && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        await razorpay.subscriptions.cancel(subscription.razorpaySubId, true);
      } catch (err) {
        console.error("Failed to cancel Razorpay mandate on toggle OFF:", err);
      }
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { autoRenew: newAutoRenew },
    });

    await dispatchNotification({
      userId: session.userId,
      title: newAutoRenew ? "🔄 AutoPay Enabled" : "⏸️ AutoPay Disabled",
      message: newAutoRenew 
        ? `AutoPay has been enabled for your mentorship with ${subscription.mentor.user.name}.`
        : `AutoPay has been turned OFF for your mentorship with ${subscription.mentor.user.name}. You retain free calls until ${new Date(subscription.endDate).toLocaleDateString("en-IN")}.`,
      type: "SUBSCRIPTION",
      link: "/my-mentors",
    });

    return NextResponse.json({ success: true, autoRenew: updated.autoRenew });
  } catch (error: any) {
    console.error("Toggle AutoPay error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
