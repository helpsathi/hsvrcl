import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: chatSession.mentorId },
      select: { personalMeetingLink: true }
    });

    // Generate real Google Meet video session
    try {
      const meetLink = mentorProfile?.personalMeetingLink;

      if (!meetLink) {
        return NextResponse.json({ error: "Mentor has not provided a personal meeting link." }, { status: 400 });
      }

      return NextResponse.json({ success: true, meetLink, eventId: null });
    } catch (meetError: any) {
      return NextResponse.json({ error: meetError.message || "Video unavailable" }, { status: 503 });
    }
  } catch (error: any) {
    console.error("Instant Video Call Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

