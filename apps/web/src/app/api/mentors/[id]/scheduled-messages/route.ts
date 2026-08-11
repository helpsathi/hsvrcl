import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const session = await getSession();
    
    if (!session || session.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, scheduledAt, targetAudience, targetStudentIds, attachments } = await req.json();

    if (!content || !scheduledAt || !targetAudience) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const scheduleDate = new Date(scheduledAt);
    if (scheduleDate <= new Date()) {
      return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
    }

    if (targetAudience === "SPECIFIC" && (!targetStudentIds || targetStudentIds.length === 0)) {
      return NextResponse.json({ error: "Specific students must be selected" }, { status: 400 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!mentorProfile || mentorProfile.userId !== session.userId) {
      return NextResponse.json({ error: "Mentor profile not found or unauthorized" }, { status: 403 });
    }

    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        mentorId: mentorProfile.user.id,
        content,
        scheduledAt: scheduleDate,
        targetAudience,
        targetStudentIds: targetStudentIds || [],
        attachments: attachments || [],
        status: "PENDING",
      }
    });

    return NextResponse.json({ success: true, scheduledMessage });
  } catch (error: any) {
    console.error("Create Scheduled Message Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
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

    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: { mentorId: mentorProfile.userId },
      orderBy: { scheduledAt: "desc" }
    });

    return NextResponse.json({ success: true, scheduledMessages });
  } catch (error: any) {
    console.error("Fetch Scheduled Messages Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
