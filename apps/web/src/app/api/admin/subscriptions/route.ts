import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] });
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const status = searchParams.get("status") || "ALL"; // ALL, ACTIVE, EXPIRED
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (status === "ACTIVE") {
      where.isActive = true;
      where.endDate = { gte: new Date() };
    } else if (status === "EXPIRED") {
      where.OR = [
        { isActive: false },
        { endDate: { lt: new Date() } }
      ];
    }

    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: "insensitive" } } },
        { student: { email: { contains: search, mode: "insensitive" } } },
        { mentor: { user: { name: { contains: search, mode: "insensitive" } } } },
        { mentor: { user: { email: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [total, subscriptions, totalActive, totalExpired, totalRevenueAgg] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        include: {
          student: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          mentor: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscription.count({
        where: { isActive: true, endDate: { gte: new Date() } },
      }),
      prisma.subscription.count({
        where: {
          OR: [{ isActive: false }, { endDate: { lt: new Date() } }],
        },
      }),
      prisma.subscription.aggregate({
        _sum: { price: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalActive,
        totalExpired,
        totalRevenue: totalRevenueAgg._sum.price || 0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/subscriptions error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] });
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const { subscriptionId, reason } = await req.json();
    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 });
    }

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        isActive: false,
        endDate: new Date(),
      },
      include: {
        student: { select: { name: true, email: true } },
        mentor: { include: { user: { select: { name: true } } } },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: "CANCEL_SUBSCRIPTION",
        targetId: subscriptionId,
        details: `Cancelled subscription for student ${subscription.student.name} with mentor ${subscription.mentor.user.name}. Reason: ${reason || "Admin intervention"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/subscriptions error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
