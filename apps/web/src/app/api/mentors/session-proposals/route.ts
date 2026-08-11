import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleMeetEvent } from "@/lib/googleCalendar";

// POST — Mentor creates a session proposal for subscribers
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, proposedAt, durationMinutes = 30, targetType = "ALL", targetStudentIds = [], expiresInHours = 48 } = await req.json();

    if (!title || !proposedAt || !durationMinutes) {
      return NextResponse.json({ error: "title, proposedAt, and durationMinutes are required" }, { status: 400 });
    }

    const proposedDate = new Date(proposedAt);
    if (proposedDate <= new Date()) {
      return NextResponse.json({ error: "Proposed time must be in the future" }, { status: 400 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // If targeting selected students, validate they are all active subscribers
    let resolvedTargetIds: string[] = [];
    if (targetType === "SELECTED" && targetStudentIds.length > 0) {
      const activeSubs = await prisma.subscription.findMany({
        where: {
          mentorId: mentorProfile.id,
          isActive: true,
          studentId: { in: targetStudentIds },
        },
        select: { studentId: true },
      });
      resolvedTargetIds = activeSubs.map((s) => s.studentId);
    }

    const proposal = await prisma.sessionProposal.create({
      data: {
        mentorProfileId: mentorProfile.id,
        title: title.trim(),
        description: description?.trim() || null,
        proposedAt: proposedDate,
        durationMinutes: Number(durationMinutes),
        targetType,
        targetStudentIds: resolvedTargetIds,
        expiresAt,
        status: "OPEN",
      },
    });

    // Notify targeted or all subscribers
    const subscribers = await prisma.subscription.findMany({
      where: {
        mentorId: mentorProfile.id,
        isActive: true,
        ...(targetType === "SELECTED" && resolvedTargetIds.length > 0
          ? { studentId: { in: resolvedTargetIds } }
          : {}),
      },
      include: { student: { select: { id: true, name: true } } },
    });

    if (subscribers.length > 0) {
      await prisma.notification.createMany({
        data: subscribers.map((s) => ({
          userId: s.studentId,
          title: `📅 New Session from ${mentorProfile.user.name}`,
          message: `Your mentor ${mentorProfile.user.name} has proposed a session: "${title}" on ${proposedDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST. Accept it now — it's free for you as a subscriber!`,
          type: "SESSION_PROPOSAL",
          link: `/my-mentors`,
        })),
      });
    }

    return NextResponse.json({ success: true, proposal, notifiedCount: subscribers.length });
  } catch (error: any) {
    console.error("Create Session Proposal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET — Mentor sees their own proposals
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!mentorProfile) {
      return NextResponse.json({ success: true, proposals: [] });
    }

    const proposals = await prisma.sessionProposal.findMany({
      where: { mentorProfileId: mentorProfile.id },
      include: {
        acceptances: {
          include: {
            student: { select: { id: true, name: true, avatar: true, email: true } },
          },
        },
      },
      orderBy: { proposedAt: "desc" },
    });

    return NextResponse.json({ success: true, proposals });
  } catch (error: any) {
    console.error("GET Session Proposals Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
