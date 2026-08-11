import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleMeetEvent } from "@/lib/googleCalendar";

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Ensure the user is part of the chat
    if (chatSession.studentId !== session.userId && chatSession.mentorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure chat is active
    if (chatSession.status !== "ACTIVE") {
      return NextResponse.json({ error: "Cannot start a video call on an inactive chat" }, { status: 400 });
    }

    const mentorUser = await prisma.user.findUnique({
      where: { id: chatSession.mentorId },
      select: { email: true, name: true }
    });
    const studentUser = await prisma.user.findUnique({
      where: { id: chatSession.studentId },
      select: { email: true, name: true }
    });

    // Generate real Google Meet video session
    try {
      const { meetLink, eventId } = await createGoogleMeetEvent({
        title: `HelpSathi Live Call: ${studentUser?.name || "Student"} & ${mentorUser?.name || "Mentor"}`,
        description: "Instant live mentorship consultation initiated from active chat session.",
        startTime: new Date(),
        durationMinutes: 45,
        attendeeEmails: [mentorUser?.email, studentUser?.email],
      });

      if (!meetLink) {
        return NextResponse.json({ error: "Could not generate Google Meet link. Please try again." }, { status: 503 });
      }

      return NextResponse.json({ success: true, meetLink, eventId });
    } catch (meetError: any) {
      return NextResponse.json({ error: meetError.message || "Google Meet unavailable" }, { status: 503 });
    }
  } catch (error: any) {
    console.error("Instant Video Call Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

