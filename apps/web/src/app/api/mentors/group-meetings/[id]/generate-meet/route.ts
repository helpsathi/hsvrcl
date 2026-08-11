import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleMeetEvent, deleteGoogleMeetEvent } from "@/lib/googleCalendar";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await prisma.groupMeeting.findUnique({
      where: { id },
      include: {
        mentor: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: "Group meeting not found" }, { status: 404 });
    }

    // Check permissions: mentor who hosts it or subscribed student can sync/generate
    let authorized = session.userId === meeting.mentorId || session.role === "ADMIN" || session.adminSubRole;
    if (!authorized && session.role === "STUDENT") {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: meeting.mentorId },
        select: { id: true }
      });
      if (mentorProfile) {
        const sub = await prisma.subscription.findFirst({
          where: {
            studentId: session.userId,
            mentorId: mentorProfile.id,
            isActive: true,
            endDate: { gt: new Date() }
          }
        });
        if (sub) authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden. You are not authorized for this group meeting." }, { status: 403 });
    }

    if (meeting.eventId) {
      await deleteGoogleMeetEvent(meeting.eventId);
    }

    // Get subscriber emails so they get invited to the group calendar event too
    const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: meeting.mentorId }, select: { id: true } });
    const activeSubscribers = mentorProfile ? await prisma.subscription.findMany({
      where: {
        mentorId: mentorProfile.id,
        isActive: true,
        endDate: { gt: new Date() }
      },
      include: { student: { select: { email: true } } }
    }) : [];

    const attendeeEmails = [meeting.mentor.email, ...activeSubscribers.map(s => s.student.email)].filter(Boolean);

    const { meetLink, eventId } = await createGoogleMeetEvent({
      title: `Group Session: ${meeting.title} (by ${meeting.mentor.name})`,
      description: meeting.description || "Exclusive group session for subscribed students.",
      startTime: new Date(meeting.scheduledAt),
      durationMinutes: 60,
      attendeeEmails,
    });

    const updatedMeeting = await prisma.groupMeeting.update({
      where: { id },
      data: { meetLink, eventId: eventId || null },
      include: { mentor: { select: { id: true, name: true, avatar: true } } }
    });

    return NextResponse.json({ success: true, meeting: updatedMeeting, meetLink });
  } catch (error: any) {
    console.error("Generate Group Meet Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
