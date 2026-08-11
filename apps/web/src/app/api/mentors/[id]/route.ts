import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;
    const cleanId = id.trim().toLowerCase();
    const mentorProfile = await prisma.mentorProfile.findFirst({
      where: {
        OR: [
          { id },
          { userId: id },
          { username: cleanId }
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            role: true,
            adminSubRole: true,
          }
        },
        reviews: {
          where: { status: "APPROVED" },
          include: {
            student: { select: { name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!mentorProfile || mentorProfile.status !== "APPROVED") {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Count total completed sessions
    const totalSessions = await prisma.chatSession.count({
      where: { mentorId: mentorProfile.user.id, status: "COMPLETED" },
    });

    // Check if current user is subscribed or was previously subscribed
    let isSubscribed = false;
    let subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "NONE" = "NONE";

    if (session && session.role === "STUDENT") {
      const allSubs = await prisma.subscription.findMany({
        where: {
          studentId: session.userId,
          mentorId: mentorProfile.id,
        },
        orderBy: { endDate: "desc" }
      });

      if (allSubs.length > 0) {
        const latestSub = allSubs[0];
        const now = new Date();
        if (latestSub.isActive && latestSub.endDate > now) {
          isSubscribed = true;
          subscriptionStatus = "ACTIVE";
        } else if (!latestSub.isActive && latestSub.endDate > now) {
          subscriptionStatus = "CANCELLED";
        } else {
          subscriptionStatus = "EXPIRED";
        }
      }
    }

    return NextResponse.json({
      mentor: {
        id: mentorProfile.id,
        userId: mentorProfile.user.id,
        username: mentorProfile.username,
        name: mentorProfile.user.name,
        avatar: mentorProfile.user.avatar,
        role: mentorProfile.user.role,
        adminSubRole: mentorProfile.user.adminSubRole,
        bio: mentorProfile.bio,
        categories: mentorProfile.categories,
        skills: mentorProfile.skills,
        languages: mentorProfile.languages,
        experience: mentorProfile.experience,
        perMinutePrice: mentorProfile.perMinutePrice,
        callPricePerMinute: mentorProfile.callPricePerMinute ?? mentorProfile.perMinutePrice,
        monthlyPrice: mentorProfile.monthlyPrice,
        isOnline: mentorProfile.isOnline,
        avgRating: mentorProfile.avgRating,
        reviewCount: mentorProfile.reviewCount,
        freeTrial: mentorProfile.freeTrial,
        bookingNoticeHours: mentorProfile.bookingNoticeHours,
        isSubscribed,
        subscriptionStatus,
        totalSessions,
        reviews: mentorProfile.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          studentName: r.student.name,
          studentAvatar: r.student.avatar,
          date: r.createdAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error("Mentor Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
