import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mentorUserId = searchParams.get("mentorUserId");
    if (!mentorUserId) {
      return NextResponse.json({ error: "Missing mentorUserId" }, { status: 400 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
      select: { id: true, monthlyPrice: true, perMinutePrice: true },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    const allSubs = await prisma.subscription.findMany({
      where: {
        studentId: session.userId,
        mentorId: mentorProfile.id,
      },
      orderBy: { endDate: "desc" },
      take: 1,
    });

    let isSubscribed = false;
    let subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "NONE" = "NONE";
    let subscriptionExpiresAt: string | null = null;

    if (allSubs.length > 0) {
      const latestSub = allSubs[0];
      const now = new Date();
      subscriptionExpiresAt = latestSub.endDate.toISOString();
      if (latestSub.isActive && latestSub.endDate > now) {
        isSubscribed = true;
        subscriptionStatus = "ACTIVE";
      } else if (!latestSub.isActive && latestSub.endDate > now) {
        subscriptionStatus = "CANCELLED";
      } else {
        subscriptionStatus = "EXPIRED";
      }
    }

    return NextResponse.json({
      success: true,
      isSubscribed,
      subscriptionStatus,
      subscriptionExpiresAt,
      mentorProfileId: mentorProfile.id,
      mentorMonthlyPrice: mentorProfile.monthlyPrice,
      mentorPerMinutePrice: mentorProfile.perMinutePrice,
    });
  } catch (error: any) {
    console.error("Subscription status check error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
