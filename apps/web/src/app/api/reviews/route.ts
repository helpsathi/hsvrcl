import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { reviewRateLimiter } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get("mentorId");
    const myReviews = searchParams.get("myReviews") === "true";
    const mySubmitted = searchParams.get("mySubmitted") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (Math.max(page, 1) - 1) * limit;

    if (mySubmitted) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { studentId: session.userId },
          orderBy: { createdAt: "desc" },
          include: {
            mentor: {
              include: {
                user: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
          skip,
          take: limit,
        }),
        prisma.review.count({ where: { studentId: session.userId } })
      ]);
      return NextResponse.json({ 
        reviews, 
        pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } 
      });
    }

    if (myReviews) {
      const session = await getSession();
      if (!session || session.role !== "MENTOR") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const mentor = await prisma.mentorProfile.findUnique({ where: { userId: session.userId } });
      if (!mentor) {
        return NextResponse.json({ reviews: [] });
      }
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { mentorId: mentor.id, student: { deletedAt: null } },
          orderBy: { createdAt: "desc" },
          include: {
            student: { select: { name: true, email: true, avatar: true } },
          },
          skip,
          take: limit,
        }),
        prisma.review.count({ where: { mentorId: mentor.id, student: { deletedAt: null } } })
      ]);
      return NextResponse.json({ 
        reviews, 
        pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } 
      });
    }

    if (!mentorId) {
      return NextResponse.json({ error: "mentorId required" }, { status: 400 });
    }

    const mentor = await prisma.mentorProfile.findFirst({
      where: { OR: [{ id: mentorId }, { userId: mentorId }] },
    });

    if (!mentor) {
      return NextResponse.json({ reviews: [], rating: 0, count: 0, pagination: { total: 0, page, limit, totalPages: 1 } });
    }

    const now = new Date();
    const whereClause = {
      mentorId: mentor.id,
      status: "APPROVED" as const,
      publishedAt: { lte: now },
      student: { deletedAt: null },
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        orderBy: { publishedAt: "desc" },
        include: {
          student: { select: { name: true, avatar: true } },
        },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: whereClause })
    ]);

    return NextResponse.json({ 
      reviews, 
      rating: mentor.avgRating, 
      count: mentor.reviewCount,
      pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
    });
  } catch (error: any) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitStatus = reviewRateLimiter.check(`review_${session.userId}`);
    if (!limitStatus.success) {
      return NextResponse.json({ error: "Too many review requests. Please slow down." }, { status: 429 });
    }

    const { mentorId, rating, comment } = await req.json();

    if (!mentorId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Valid mentorId and rating (1-5) required" }, { status: 400 });
    }

    const mentor = await prisma.mentorProfile.findFirst({
      where: { OR: [{ id: mentorId }, { userId: mentorId }] },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    if (mentor.userId === session.userId) {
      return NextResponse.json({ error: "You cannot review your own mentor profile." }, { status: 400 });
    }

    // Eligibility check: student must have at least one interaction or subscription with this mentor
    const [subscription, chat, call] = await Promise.all([
      prisma.subscription.findFirst({ where: { studentId: session.userId, mentorId: mentor.id } }),
      prisma.chatSession.findFirst({ where: { studentId: session.userId, mentorId: mentor.userId } }),
      prisma.scheduledChat.findFirst({ where: { studentId: session.userId, mentorId: mentor.userId } }),
    ]);

    if (!subscription && !chat && !call) {
      return NextResponse.json({ error: "You can only rate mentors you have actively consulted or subscribed to." }, { status: 403 });
    }

    // Rate-limiting check: prevent spamming reviews for the same mentor within 24 hours
    const existingRecent = await prisma.review.findFirst({
      where: {
        studentId: session.userId,
        mentorId: mentor.id,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (existingRecent) {
      return NextResponse.json({ error: "You have already submitted a feedback review for this mentor within the last 24 hours." }, { status: 429 });
    }

    // 15-minute moderation window before public display
    const publishedAt = new Date(Date.now() + 15 * 60 * 1000);

    const review = await prisma.review.create({
      data: {
        studentId: session.userId,
        mentorId: mentor.id,
        rating: parseInt(rating),
        comment: comment ? String(comment).trim() : null,
        status: "PENDING",
        publishedAt,
      },
    });

    // Note: Mentor avgRating and reviewCount will be updated upon review approval
    // (either via admin action or automated moderation cron job)

    await dispatchNotification({
      userId: mentor.userId,
      title: `⭐ New Mentor Review!`,
      message: `You just received a ${rating}★ review from a student!`,
      type: "REVIEW",
      link: `/mentor-dashboard`,
    });

    return NextResponse.json({
      success: true,
      review,
      message: "Thank you for your feedback! Your review will be published shortly.",
    });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, removalReason } = await req.json();

    if (!reviewId || !removalReason) {
      return NextResponse.json({ error: "reviewId and removalReason required" }, { status: 400 });
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.mentorId !== mentor.id) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        removalRequested: true,
        removalReason: String(removalReason).trim(),
      },
    });

    return NextResponse.json({ success: true, review: updated, message: "Dispute reported to system administrators." });
  } catch (error: any) {
    console.error("PATCH /api/reviews error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, rating, comment } = await req.json();

    if (!reviewId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Valid reviewId and rating required" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review || review.studentId !== session.userId) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: parseInt(rating),
        comment: comment ? String(comment).trim() : null,
      },
    });

    return NextResponse.json({ success: true, review: updated, message: "Review updated successfully." });
  } catch (error: any) {
    console.error("PUT /api/reviews error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId required" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review || review.studentId !== session.userId) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return NextResponse.json({ success: true, message: "Review deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/reviews error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

