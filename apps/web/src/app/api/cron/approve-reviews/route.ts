import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = !!process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET;
  const isCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron && !isInternal && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Find all reviews pending for >= 15 minutes that haven't had a dispute removal requested
    const pendingReviews = await prisma.review.findMany({
      where: {
        status: "PENDING",
        removalRequested: false,
        publishedAt: { lte: now },
      },
      select: { id: true, mentorId: true },
    });

    if (pendingReviews.length === 0) {
      return NextResponse.json({ success: true, approvedCount: 0 });
    }

    const reviewIds = pendingReviews.map((r) => r.id);
    await prisma.review.updateMany({
      where: { id: { in: reviewIds } },
      data: { status: "APPROVED" },
    });

    // Recalculate avgRating and reviewCount for affected mentors (completes C2 & B1)
    const uniqueMentorIds = Array.from(new Set(pendingReviews.map((r) => r.mentorId)));
    for (const mentorId of uniqueMentorIds) {
      const stats = await prisma.review.aggregate({
        where: { mentorId, status: "APPROVED" },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await prisma.mentorProfile.update({
        where: { id: mentorId },
        data: {
          avgRating: Math.round((stats._avg.rating || 0) * 10) / 10,
          reviewCount: stats._count.rating || 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      approvedCount: reviewIds.length,
      updatedMentors: uniqueMentorIds.length,
    });
  } catch (error: any) {
    console.error("Cron review approval error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export const POST = GET;
