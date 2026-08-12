import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await prisma.groupMeeting.findUnique({
      where: { id },
      include: {
        mentor: { select: { id: true, name: true, avatar: true } }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: "Group meeting not found" }, { status: 404 });
    }

    // Access control: Host mentor or active subscribed student or admin
    if (session.role === "MENTOR" && meeting.mentorId !== session.userId) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.role === "STUDENT") {
      // Get the mentor's MentorProfile ID (subscriptions are keyed by MentorProfile.id, not User.id)
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: meeting.mentorId },
        select: { id: true }
      });

      const activeSubscription = mentorProfile ? await prisma.subscription.findFirst({
        where: {
          studentId: session.userId,
          mentorId: mentorProfile.id,
          isActive: true,
          endDate: { gt: new Date() }
        }
      }) : null;

      if (!activeSubscription) {
        return NextResponse.json({ error: "Forbidden. You must be an active subscriber to join this group meeting." }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error: any) {
    console.error("Get Group Meeting Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const groupMeeting = await prisma.groupMeeting.findUnique({
      where: { id },
    });

    if (!groupMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (groupMeeting.mentorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // We no longer attempt to delete Google Meet events since we don't use Calendar API

    // Delete meeting from database
    await prisma.groupMeeting.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Group Meeting Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
