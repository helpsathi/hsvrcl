import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] });
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 100);
    const skip = (Math.max(page, 1) - 1) * limit;

    const whereClause = {
      OR: [
        { targetRole: { not: null } },
        { type: "ANNOUNCEMENT" },
      ],
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    const formatted = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      targetRole: n.targetRole || "CUSTOM",
      createdAt: n.createdAt,
      readCount: n.readBy?.length || (n.isRead ? 1 : 0),
      link: n.link,
    }));

    return NextResponse.json({ 
      success: true, 
      notifications: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("GET /api/admin/notifications error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] });
    if (!auth.authorized) return auth.response!;

    const { title, message, targetRole, userId, type, link } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const cleanTitle = String(title).trim();
    const cleanMessage = String(message).trim();
    const cleanLink = link || null;
    const notifType = type || "ANNOUNCEMENT";

    let createdCount = 1;

    if (targetRole === "ACTIVE_SUBSCRIBERS") {
      const activeSubs = await prisma.subscription.findMany({
        where: { isActive: true, endDate: { gt: new Date() } },
        select: { studentId: true },
        distinct: ["studentId"],
      });
      const studentIds = activeSubs.map((s) => s.studentId);
      if (studentIds.length > 0) {
        await prisma.notification.createMany({
          data: studentIds.map((id) => ({
            userId: id,
            title: cleanTitle,
            message: cleanMessage,
            type: notifType,
            link: cleanLink,
            targetRole: "ACTIVE_SUBSCRIBERS",
          })),
        });
      }
      createdCount = studentIds.length;
    } else if (targetRole === "VERIFIED_MENTORS") {
      const approvedMentors = await prisma.mentorProfile.findMany({
        where: { status: "APPROVED" },
        select: { userId: true },
      });
      const mentorUserIds = approvedMentors.map((m) => m.userId);
      if (mentorUserIds.length > 0) {
        await prisma.notification.createMany({
          data: mentorUserIds.map((id) => ({
            userId: id,
            title: cleanTitle,
            message: cleanMessage,
            type: notifType,
            link: cleanLink,
            targetRole: "VERIFIED_MENTORS",
          })),
        });
      }
      createdCount = mentorUserIds.length;
    } else {
      await prisma.notification.create({
        data: {
          title: cleanTitle,
          message: cleanMessage,
          targetRole: targetRole || null,
          userId: userId || null,
          type: notifType,
          link: cleanLink,
        },
      });
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: "BROADCAST_NOTIFICATION",
          targetId: targetRole || userId || "ALL",
          details: `Sent notification "${cleanTitle}" to ${targetRole || userId || "broadcast"} (${createdCount} recipients)`,
        },
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    return NextResponse.json({ success: true, count: createdCount, target: targetRole || "CUSTOM" });
  } catch (error: any) {
    console.error("POST /api/admin/notifications error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const targetGroup = url.searchParams.get("targetRole");
    const title = url.searchParams.get("title");

    if (id) {
      await prisma.notification.delete({ where: { id } });
    } else if (targetGroup && title) {
      await prisma.notification.deleteMany({
        where: { targetRole: targetGroup, title },
      });
    } else {
      return NextResponse.json({ error: "id or target group required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/notifications error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
