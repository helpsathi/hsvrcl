import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Student fetches pending proposals from all their subscribed mentors
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active subscriptions for this student
    const subscriptions = await prisma.subscription.findMany({
      where: {
        studentId: session.userId,
        isActive: true,
        endDate: { gt: new Date() },
      },
      select: { mentorId: true },
    });

    const subscribedMentorProfileIds = subscriptions.map((s) => s.mentorId);
    if (subscribedMentorProfileIds.length === 0) {
      return NextResponse.json({ success: true, proposals: [] });
    }

    // Get OPEN, non-expired proposals from those mentors that target this student
    const now = new Date();
    const allProposals = await prisma.sessionProposal.findMany({
      where: {
        mentorProfileId: { in: subscribedMentorProfileIds },
        status: "OPEN",
        expiresAt: { gt: now },
      },
      include: {
        mentor: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        acceptances: {
          where: { studentId: session.userId },
          select: { id: true, acceptedAt: true, scheduledChatId: true },
        },
      },
      orderBy: { proposedAt: "asc" },
    });

    // Filter: if targetType is "SELECTED", only show if student is in targetStudentIds
    const visibleProposals = allProposals.filter((p: any) => {
      if (p.targetType === "ALL") return true;
      return p.targetStudentIds.includes(session.userId);
    });

    return NextResponse.json({ success: true, proposals: visibleProposals });
  } catch (error: any) {
    console.error("GET Student Proposals Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
