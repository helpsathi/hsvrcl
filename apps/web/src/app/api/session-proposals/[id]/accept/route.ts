import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleMeetEvent } from "@/lib/googleCalendar";
import { dispatchNotification } from "@/lib/notifications";

// POST — Student accepts a session proposal from their mentor
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: proposalId } = await params;
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load proposal with mentor info
    const proposal = await prisma.sessionProposal.findUnique({
      where: { id: proposalId },
      include: {
        mentor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        acceptances: {
          where: { studentId: session.userId },
          select: { id: true },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    if (proposal.status !== "OPEN") {
      return NextResponse.json({ error: "This proposal is no longer open" }, { status: 400 });
    }
    if (new Date(proposal.expiresAt) <= new Date()) {
      return NextResponse.json({ error: "This proposal has expired" }, { status: 400 });
    }
    if (new Date(proposal.proposedAt) <= new Date()) {
      return NextResponse.json({ error: "This session time has already passed" }, { status: 400 });
    }
    if (proposal.acceptances.length > 0) {
      return NextResponse.json({ error: "You have already accepted this proposal" }, { status: 409 });
    }

    // Visibility check: if SELECTED, ensure student is in targetStudentIds
    if (proposal.targetType === "SELECTED" && !proposal.targetStudentIds.includes(session.userId)) {
      return NextResponse.json({ error: "This proposal is not available to you" }, { status: 403 });
    }

    // Check student is an active subscriber of this mentor
    const subscription = await prisma.subscription.findFirst({
      where: {
        studentId: session.userId,
        mentorId: proposal.mentorProfileId,
        isActive: true,
        endDate: { gt: new Date() },
      },
    });
    const isFree = Boolean(subscription) && Boolean(proposal.mentor.subscribedBookingFree);

    // Load student info for Google Meet invite
    const studentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });

    // Check for time conflict with mentor's existing calls
    const conflictEnd = new Date(new Date(proposal.proposedAt).getTime() + proposal.durationMinutes * 60 * 1000);
    const conflict = await prisma.scheduledChat.findFirst({
      where: {
        mentorId: proposal.mentor.user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        scheduledAt: { gte: new Date(proposal.proposedAt), lt: conflictEnd },
      },
    });
    if (conflict) {
      return NextResponse.json({ error: "The mentor already has another call at this time" }, { status: 409 });
    }

    // Generate Google Meet link immediately (Wrap in try-catch so acceptance succeeds even if meet generation fails)
    let meetLink: string | null = null;
    let eventId: string | null = null;
    try {
      const meetResult = await createGoogleMeetEvent({
        title: `HelpSathi Session: ${studentUser?.name || "Student"} & ${proposal.mentor.user.name}`,
        description: `Proposed session: "${proposal.title}"\n\n${proposal.description || ""}`,
        startTime: new Date(proposal.proposedAt),
        durationMinutes: proposal.durationMinutes,
        attendeeEmails: [studentUser?.email, proposal.mentor.user.email],
      });
      meetLink = meetResult.meetLink;
      eventId = meetResult.eventId || null;
    } catch (meetError: any) {
      console.error("Failed to generate Google Meet link during proposal acceptance:", meetError);
      // Proceed without the link; they can generate it manually later
    }

    // Transactionally create the acceptance, create the ScheduledChat, and optionally deduct wallet
    const result = await prisma.$transaction(async (tx) => {
      let estimatedCost = 0;

      if (!isFree) {
        // Non-subscriber: charge full rate
        estimatedCost = proposal.durationMinutes * (proposal.mentor.callPricePerMinute ?? proposal.mentor.perMinutePrice ?? 15);
        const wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
        if (!wallet || wallet.balance < estimatedCost) {
          throw new Error(`INSUFFICIENT_FUNDS:${estimatedCost}:${wallet?.balance ?? 0}`);
        }
        await tx.wallet.update({
          where: { userId: session.userId },
          data: { balance: { decrement: estimatedCost } },
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "DEBIT",
            amount: estimatedCost,
            description: `Session Booking: "${proposal.title}" with ${proposal.mentor.user.name}`,
          },
        });
      }

      // Create the ScheduledChat (status CONFIRMED since mentor already proposed)
      const scheduledCall = await tx.scheduledChat.create({
        data: {
          studentId: session.userId,
          mentorId: proposal.mentor.user.id,
          scheduledAt: new Date(proposal.proposedAt),
          durationMinutes: proposal.durationMinutes,
          notes: `Via session proposal: "${proposal.title}"`,
          status: "CONFIRMED", // Auto-confirmed since mentor proposed it
          estimatedCost,
          meetLink,
          eventId: eventId || null,
        },
      });

      // Record the acceptance
      const acceptance = await tx.sessionProposalAcceptance.create({
        data: {
          proposalId,
          studentId: session.userId,
          scheduledChatId: scheduledCall.id,
          isFree,
        },
      });

      return { scheduledCall, acceptance };
    });

    // Notify the mentor with real-time delivery and anti-flood batching protection
    await dispatchNotification({
      userId: proposal.mentor.user.id,
      title: `✅ Session Slot Claimed!`,
      message: `${studentUser?.name || "A student"} accepted your session proposal: "${proposal.title}" for ${new Date(proposal.proposedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST.`,
      type: "PROPOSAL_ACCEPTED",
      link: `/scheduled-calls`,
    });

    return NextResponse.json({
      success: true,
      scheduledCall: result.scheduledCall,
      isFree,
      meetLink,
    });
  } catch (error: any) {
    console.error("Accept Proposal Error:", error);
    if (error.message?.startsWith("INSUFFICIENT_FUNDS")) {
      const [, cost, bal] = error.message.split(":");
      return NextResponse.json(
        { error: `Insufficient balance. Cost: ₹${cost}. Your balance: ₹${bal}`, requireRecharge: true },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
