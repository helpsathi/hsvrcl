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
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: "insensitive" } } },
        { student: { email: { contains: search, mode: "insensitive" } } },
        { mentor: { name: { contains: search, mode: "insensitive" } } },
        { mentor: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, scheduledCalls, confirmedCount, pendingCount, completedCount] = await Promise.all([
      prisma.scheduledChat.count({ where }),
      prisma.scheduledChat.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true, avatar: true } },
          mentor: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { scheduledAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scheduledChat.count({ where: { status: "CONFIRMED" } }),
      prisma.scheduledChat.count({ where: { status: "PENDING" } }),
      prisma.scheduledChat.count({ where: { status: "COMPLETED" } }),
    ]);

    return NextResponse.json({
      success: true,
      calls: scheduledCalls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        confirmedCount,
        pendingCount,
        completedCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/scheduled-calls error:", error);
    return NextResponse.json({ error: "Failed to fetch scheduled calls" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] });
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const { callId, reason } = await req.json();
    if (!callId) {
      return NextResponse.json({ error: "Call ID is required" }, { status: 400 });
    }

    const updatedCall = await prisma.scheduledChat.update({
      where: { id: callId },
      data: { status: "CANCELLED" },
      include: {
        student: { select: { name: true, email: true } },
        mentor: { select: { name: true, email: true } },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: "CANCEL_SCHEDULED_CALL",
        targetId: callId,
        details: `Cancelled scheduled call between student ${updatedCall.student.name} and mentor ${updatedCall.mentor.name}. Reason: ${reason || "Admin intervention"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Scheduled call cancelled successfully",
      call: updatedCall,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/scheduled-calls error:", error);
    return NextResponse.json({ error: "Failed to cancel call" }, { status: 500 });
  }
}
