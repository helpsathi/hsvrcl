import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "MENTOR" && !session.adminSubRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (session.role === "ADMIN" || session.adminSubRole) {
      const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"] });
      if (!authCheck.authorized) return authCheck.response!;
    }

    let where = {};
    if (session.role === "MENTOR") {
      const mentor = await prisma.mentorProfile.findUnique({ where: { userId: session.userId } });
      where = mentor ? { mentorId: mentor.id } : { mentorId: "none" };
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 100);
    const skip = (Math.max(page, 1) - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          student: { select: { name: true, email: true, avatar: true } },
          mentor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({ 
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("GET /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const { reviewId, status, comment, removalRequested } = await req.json();

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId required" }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(status && {
          status,
          ...(status === "APPROVED" && { publishedAt: new Date() }),
        }),
        ...(comment !== undefined && { comment }),
        ...(removalRequested !== undefined && {
          removalRequested,
          ...(removalRequested === false && { removalReason: null }),
        }),
      },
    });

    // Recalculate mentor rating and review count whenever review status changes
    if (status) {
      const stats = await prisma.review.aggregate({
        where: { mentorId: updated.mentorId, status: "APPROVED" },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await prisma.mentorProfile.update({
        where: { id: updated.mentorId },
        data: {
          avgRating: Math.round((stats._avg.rating || 0) * 10) / 10,
          reviewCount: stats._count.rating || 0,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: "MODERATE_REVIEW",
        targetId: reviewId,
        details: JSON.stringify({ status, comment, removalRequested }),
      },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
