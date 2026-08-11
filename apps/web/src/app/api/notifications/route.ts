import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get notifications directly for this user OR role broadcasts
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: session.userId },
          { targetRole: "ALL" },
          { targetRole: session.role },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = notifications.map((n) => ({
      ...n,
      isRead: n.userId ? n.isRead : n.readBy.includes(session.userId),
    }));

    return NextResponse.json({ notifications: formatted });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Support bulk "Mark All as Read"
    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      const broadcastNotifs = await prisma.notification.findMany({
        where: {
          userId: null,
          OR: [{ targetRole: "ALL" }, { targetRole: session.role }],
        },
      });

      for (const notif of broadcastNotifs) {
        if (!notif.readBy.includes(session.userId)) {
          await prisma.notification.update({
            where: { id: notif.id },
            data: { readBy: { push: session.userId } },
          });
        }
      }

      return NextResponse.json({ success: true, markAllRead: true });
    }

    if (!body.notificationId) {
      return NextResponse.json({ error: "notificationId or markAllRead required" }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: body.notificationId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (notification.userId && notification.userId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (notification.userId) {
      await prisma.notification.update({
        where: { id: body.notificationId },
        data: { isRead: true },
      });
    } else {
      if (!notification.readBy.includes(session.userId)) {
        await prisma.notification.update({
          where: { id: body.notificationId },
          data: { readBy: { push: session.userId } },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Support bulk clearing of already-read user notifications
    await prisma.notification.deleteMany({
      where: {
        userId: session.userId,
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
