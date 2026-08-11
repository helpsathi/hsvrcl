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

    const call = await prisma.scheduledChat.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true } },
        mentor: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Scheduled call not found" }, { status: 404 });
    }

    // Access control: allow ONLY the student or mentor of this call (or ADMIN) to generate/refresh the calendar link
    if (session.userId !== call.studentId && session.userId !== call.mentorId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Only the participating mentor or student can generate the meeting link." }, { status: 403 });
    }

    // If an old event existed on Google Calendar, clear it before creating a fresh sync
    if (call.eventId) {
      await deleteGoogleMeetEvent(call.eventId);
    }

    // Create a fresh Google Meet link and send Calendar invites to both mentor and student
    const { meetLink, eventId } = await createGoogleMeetEvent({
      title: `HelpSathi Session: ${call.student.name} & ${call.mentor.name}`,
      description: `Mentorship consultation via HelpSathi.\n\nNotes from Student:\n${call.notes || "None"}`,
      startTime: new Date(call.scheduledAt),
      durationMinutes: call.durationMinutes,
      attendeeEmails: [call.student.email, call.mentor.email],
    });

    const updatedCall = await prisma.scheduledChat.update({
      where: { id },
      data: {
        meetLink,
        eventId: eventId || null,
      },
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true } },
        mentor: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, call: updatedCall, meetLink });
  } catch (error: any) {
    console.error("Generate Meet Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
