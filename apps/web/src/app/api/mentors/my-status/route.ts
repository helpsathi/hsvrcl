import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        status: true,
        commissionRate: true,
        rejectionReason: true,
        username: true,
        bio: true,
        linkedinUrl: true,
        resumeUrl: true,
        categories: true,
        skills: true,
        languages: true,
        experience: true,
        perMinutePrice: true,
        callPricePerMinute: true,
        monthlyPrice: true,
        availability: true,
        freeTrial: true,
        createdAt: true,
      },
    });

    if (!mentorProfile) {
      return NextResponse.json({ 
        hasApplied: false, 
        status: null, 
        commissionRate: null, 
        rejectionReason: null, 
        profile: null 
      });
    }

    return NextResponse.json({
      hasApplied: true,
      status: mentorProfile.status,
      commissionRate: mentorProfile.commissionRate,
      rejectionReason: mentorProfile.rejectionReason,
      profile: mentorProfile,
    });
  } catch (error: any) {
    console.error("Fetch My Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
