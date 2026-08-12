import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active subscriptions for this student to include mentor announcements
    const activeSubs = await prisma.subscription.findMany({
      where: { studentId: session.userId, isActive: true },
      select: { mentorId: true },
    });

    const subscribedMentorIds = activeSubs.map((s) => s.mentorId);

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { mentorId: null }, // Platform-wide announcements
          { targetAudience: "ALL" },
          { mentorId: { in: subscribedMentorIds } },
        ],
      },
      include: {
        mentor: {
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (error: any) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Mentor or Admin access required." }, { status: 401 });
    }

    const { title, content, targetAudience, attachments, links } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }

    let mentorId: string | null = null;
    let authorName = "HelpSathi Platform";

    if (session.role === "MENTOR") {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.userId },
        include: { user: { select: { name: true } } },
      });
      if (!mentorProfile) {
        return NextResponse.json({ error: "Mentor profile not found." }, { status: 404 });
      }
      mentorId = mentorProfile.id;
      authorName = mentorProfile.user.name;
    }

    const audience = session.role === "MENTOR" ? "SUBSCRIBERS" : (targetAudience || "ALL");

    const announcement = await prisma.announcement.create({
      data: {
        mentorId,
        title: title.trim(),
        content: content.trim(),
        targetAudience: audience,
        attachments: attachments || [],
        links: links || [],
      },
      include: {
        mentor: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
      },
    });

    // Send notifications to target students
    if (mentorId) {
      const activeSubs = await prisma.subscription.findMany({
        where: { mentorId, isActive: true },
        select: { studentId: true },
      });

      for (const sub of activeSubs) {
        await dispatchNotification({
          userId: sub.studentId,
          title: `📢 New Announcement from ${authorName}`,
          message: title.trim(),
          type: "ANNOUNCEMENT",
          link: "/announcements",
        });
      }
    } else {
      // Platform announcement broadcast
      const allUsers = await prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true },
        take: 500,
      });

      for (const u of allUsers) {
        await dispatchNotification({
          userId: u.id,
          title: `📢 Announcement: ${title.trim()}`,
          message: content.trim().substring(0, 120),
          type: "ANNOUNCEMENT",
          link: "/announcements",
        });
      }
    }

    return NextResponse.json({
      success: true,
      announcement,
      message: "Announcement published successfully!",
    });
  } catch (error: any) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json({ error: "Failed to publish announcement" }, { status: 500 });
  }
}
