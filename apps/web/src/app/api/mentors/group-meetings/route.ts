import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, scheduledAt, durationMinutes = 60, meetLink } = await req.json();

    if (!title || !scheduledAt || !meetLink) {
      return NextResponse.json({ error: "Missing required fields (title, date, and meeting link)" }, { status: 400 });
    }

    if (!/^https?:\/\//i.test(meetLink)) {
      return NextResponse.json({ error: "Invalid meeting link. Must start with http:// or https://" }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todaysMeetings = await prisma.groupMeeting.count({
      where: {
        mentorId: session.userId,
        createdAt: { gte: startOfDay }
      }
    });

    if (todaysMeetings >= 3) {
      return NextResponse.json({ error: "Daily limit of 3 group meetings reached. Please try again tomorrow." }, { status: 429 });
    }

    const mentor = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true }
    });

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true }
    });

    // Query active subscribers so they are invited directly to Google Meet and notified
    const activeSubscriptions = mentorProfile ? await prisma.subscription.findMany({
      where: {
        mentorId: mentorProfile.id,
        isActive: true,
        endDate: { gt: new Date() } // Subscription must still be valid
      },
      include: {
        student: { select: { id: true, email: true } }
      }
    }) : [];

    // Save the meeting
    const groupMeeting = await prisma.groupMeeting.create({
      data: {
        mentorId: session.userId,
        title,
        description,
        meetLink,
        scheduledAt: scheduledDate,
        durationMinutes: Number(durationMinutes) || 60,
      } as any
    });

    // Notify all active subscribers
    if (activeSubscriptions.length > 0) {
      await prisma.notification.createMany({
        data: activeSubscriptions.map(sub => ({
          userId: sub.student.id,
          type: "GROUP_MEETING",
          title: "New Group Meeting Scheduled",
          message: `Your mentor ${mentor?.name} scheduled a new group meeting: ${title}`,
          link: `/group-meetings/${groupMeeting.id}`
        }))
      });
    }

    return NextResponse.json({ success: true, groupMeeting });
  } catch (error: any) {
    console.error("Create Group Meeting Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "upcoming"; // "upcoming" or "past"
    
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    let whereCondition: any = {};
    const now = new Date();

    if (session.role === "MENTOR") {
      whereCondition = { mentorId: session.userId };
    } else {
      // For students, find meetings created by their active mentors
      const activeSubscriptions = await prisma.subscription.findMany({
        where: {
          studentId: session.userId,
          isActive: true,
          endDate: { gt: now }
        },
        include: {
          mentor: { select: { userId: true } }
        }
      });
      
      const mentorUserIds = activeSubscriptions.map(sub => sub.mentor.userId).filter(Boolean);
      whereCondition = { mentorId: { in: mentorUserIds } };
    }

    if (filter === "upcoming") {
      whereCondition.scheduledAt = { gte: now };
    } else if (filter === "past") {
      whereCondition.scheduledAt = { lt: now };
    }

    const [meetings, total] = await Promise.all([
      prisma.groupMeeting.findMany({
        where: whereCondition,
        include: {
          mentor: { select: { name: true, avatar: true } },
          _count: { select: { attendees: true } }
        },
        orderBy: { scheduledAt: filter === "upcoming" ? "asc" : "desc" },
        skip,
        take: limit,
      }),
      prisma.groupMeeting.count({ where: whereCondition })
    ]);

    return NextResponse.json({ 
      success: true, 
      meetings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Get Group Meetings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
