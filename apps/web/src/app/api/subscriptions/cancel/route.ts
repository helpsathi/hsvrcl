import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN" && session.role !== "MENTOR")) {
      return NextResponse.json({ error: "Unauthorized. Only students, mentors, or administrators can cancel subscriptions." }, { status: 403 });
    }

    const { subscriptionId, mentorId } = await req.json();

    if (!subscriptionId && !mentorId && session.role !== "MENTOR") {
      return NextResponse.json({ error: "Subscription ID or Mentor ID is required" }, { status: 400 });
    }

    // Find active subscription
    const whereClause: any = { isActive: true };
    if (session.role === "STUDENT") {
      whereClause.studentId = session.userId;
      if (subscriptionId) whereClause.id = subscriptionId;
      else if (mentorId) whereClause.mentorId = mentorId;
    } else if (session.role === "MENTOR") {
      const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: session.userId } });
      if (!mentorProfile) return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
      whereClause.mentorId = mentorProfile.id;
      if (subscriptionId) whereClause.id = subscriptionId;
    } else {
      if (subscriptionId) whereClause.id = subscriptionId;
    }

    const subscription = await prisma.subscription.findFirst({
      where: whereClause,
      include: {
        mentor: {
          include: { user: { select: { id: true, name: true } } },
        },
        student: { select: { id: true, name: true } }
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Active subscription not found" }, { status: 404 });
    }

    if (subscription.razorpaySubId && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        await razorpay.subscriptions.cancel(subscription.razorpaySubId, false);
      } catch (err) {
        console.error("Failed to cancel Razorpay subscription mandate:", err);
      }
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { isActive: false, autoRenew: false },
    });

    // Notify student and mentor
    await dispatchNotification({
      userId: session.userId,
      title: "❌ Subscription Cancelled",
      message: `Your mentorship subscription with ${subscription.mentor.user.name} has been cancelled.`,
      type: "SUBSCRIPTION",
      link: "/my-mentors",
    });

    await dispatchNotification({
      userId: subscription.mentor.user.id,
      title: "⚠️ Subscriber Cancellation",
      message: `A subscriber has cancelled their ongoing mentorship subscription.`,
      type: "SUBSCRIPTION",
      link: "/mentor-dashboard",
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "CANCEL_SUBSCRIPTION",
          targetId: subscription.id,
          details: `Cancelled active mentorship subscription for mentor ${subscription.mentorId}`,
        },
      });
    } catch (e) {
      console.error("Failed to write audit log:", e);
    }

    return NextResponse.json({ success: true, subscription: updatedSubscription });
  } catch (error: any) {
    console.error("Cancel Subscription Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const DELETE = POST;
