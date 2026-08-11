import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, msgId: string }> }) {
  try {
    const { id: userId, msgId } = await params;
    const session = await getSession();
    
    if (!session || session.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId }
    });

    if (!mentorProfile || mentorProfile.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const scheduledMessage = await prisma.scheduledMessage.findUnique({
      where: { id: msgId }
    });

    if (!scheduledMessage) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (scheduledMessage.mentorId !== mentorProfile.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (scheduledMessage.status !== "PENDING") {
      return NextResponse.json({ error: `Cannot cancel a message that is ${scheduledMessage.status}` }, { status: 400 });
    }

    await prisma.scheduledMessage.update({
      where: { id: msgId },
      data: { status: "CANCELLED" }
    });

    return NextResponse.json({ success: true, message: "Scheduled message cancelled" });
  } catch (error: any) {
    console.error("Cancel Scheduled Message Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
