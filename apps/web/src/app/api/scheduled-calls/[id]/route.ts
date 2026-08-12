import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleMeetEvent, deleteGoogleMeetEvent } from "@/lib/googleCalendar";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";
import { dispatchNotification } from "@/lib/notifications";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json(); // "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED", "DISPUTED"

    if (!["CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED", "DISPUTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const call = await prisma.scheduledChat.findUnique({ 
      where: { id },
      include: { 
        student: { include: { wallet: true } },
        mentor: { include: { mentorProfile: true, wallet: true } }
      }
    });
    
    if (!call) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Role checks
    if (session.role === "STUDENT" && call.studentId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.role === "MENTOR" && call.mentorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.role === "STUDENT" && status !== "CANCELLED" && status !== "DISPUTED") {
      return NextResponse.json({ error: "Students can only cancel or dispute calls" }, { status: 400 });
    }

    // Block last-minute student cancellations
    if (session.role === "STUDENT" && status === "CANCELLED" && (call.status === "CONFIRMED" || call.status === "ACCEPTED")) {
      const now = new Date();
      const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      if (call.scheduledAt < twelveHoursFromNow) {
        return NextResponse.json({ error: "Cannot cancel a confirmed call within 12 hours of start time. Please dispute the call after it starts if there is an issue." }, { status: 403 });
      }
    }

    // Validate COMPLETED transition (block hacking)
    if (status === "COMPLETED" && call.status !== "CONFIRMED" && call.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Only confirmed calls can be marked as completed" }, { status: 400 });
    }

    // If it's already cancelled or rejected, don't refund again
    if ((status === "REJECTED" || status === "CANCELLED") && (call.status === "PENDING" || call.status === "CONFIRMED")) {
      // Cancel Google Calendar event if it exists
      if (call.eventId) {
        await deleteGoogleMeetEvent(call.eventId);
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (call.student.wallet) {
          await tx.wallet.update({
            where: { id: call.student.wallet.id },
            data: { balance: { increment: call.estimatedCost } },
          });

          await tx.transaction.create({
            data: {
              walletId: call.student.wallet.id,
              type: "CREDIT",
              amount: call.estimatedCost,
              description: `Refund: Scheduled Call ${status === "REJECTED" ? "Rejected" : "Cancelled"}`,
            },
          });
        }

        return await tx.scheduledChat.update({
          where: { id },
          data: { status },
        });
      });

      await dispatchNotification({
        userId: call.mentorId,
        title: status === "CANCELLED" ? "📅 Call Cancelled by Student" : "📅 Call Update",
        message: `The scheduled consultation has been ${status.toLowerCase()}.`,
        type: "BOOKING",
        link: "/mentor-dashboard",
      });

      return NextResponse.json({ success: true, call: updated });
    }

    // Handle COMPLETED status (pay the mentor)
    if (status === "COMPLETED" && (call.status === "CONFIRMED" || call.status === "ACCEPTED")) {
      const updated = await prisma.$transaction(async (tx) => {
        // Calculate platform commission and mentor earnings
        const defaultCommission = await getPlatformConfigNumber(CONFIG_KEYS.PLATFORM_COMMISSION_RATE);
        const commissionRate = call.mentor.mentorProfile?.commissionRate ?? defaultCommission;
        const platformCommission = call.estimatedCost * (commissionRate / 100);
        const mentorEarnings = call.estimatedCost - platformCommission;

        if (call.mentor.wallet) {
          await tx.wallet.update({
            where: { id: call.mentor.wallet.id },
            data: { balance: { increment: mentorEarnings } },
          });

          await tx.transaction.create({
            data: {
              walletId: call.mentor.wallet.id,
              type: "CREDIT",
              amount: mentorEarnings,
              description: `Earnings: Scheduled Call (Net after ${commissionRate}% commission)`,
            },
          });
        } else {
          // Create wallet if it doesn't exist
          const newWallet = await tx.wallet.create({
            data: { userId: call.mentorId, balance: mentorEarnings }
          });
          await tx.transaction.create({
            data: {
              walletId: newWallet.id,
              type: "CREDIT",
              amount: mentorEarnings,
              description: `Earnings: Scheduled Call (Net after ${commissionRate}% commission)`,
            },
          });
        }

        return await tx.scheduledChat.update({
          where: { id },
          data: { status },
        });
      });
      return NextResponse.json({ success: true, call: updated });
    }

    // Handle DISPUTED when already COMPLETED (freeze the funds by reversing them)
    if (status === "DISPUTED" && call.status === "COMPLETED") {
      const updated = await prisma.$transaction(async (tx) => {
        const defaultCommission = await getPlatformConfigNumber(CONFIG_KEYS.PLATFORM_COMMISSION_RATE);
        const commissionRate = call.mentor.mentorProfile?.commissionRate ?? defaultCommission;
        const platformCommission = call.estimatedCost * (commissionRate / 100);
        const mentorEarnings = call.estimatedCost - platformCommission;

        if (call.mentor.wallet) {
          await tx.wallet.update({
            where: { id: call.mentor.wallet.id },
            data: { balance: { decrement: mentorEarnings } },
          });

          await tx.transaction.create({
            data: {
              walletId: call.mentor.wallet.id,
              type: "DEBIT",
              amount: mentorEarnings,
              description: `Dispute Hold: Earnings temporarily frozen for admin review`,
            },
          });
        }

        return await tx.scheduledChat.update({
          where: { id },
          data: { status: "DISPUTED" },
        });
      });

      await dispatchNotification({
        userId: call.mentorId,
        title: "⚠️ Call Disputed",
        message: `Your scheduled call with ${call.student.name} has been disputed. Your earnings have been temporarily frozen pending admin review.`,
        type: "BOOKING",
        link: "/mentor-dashboard",
      });

      return NextResponse.json({ success: true, call: updated });
    }

    const updatePayload: any = { status };
    if (status === "CONFIRMED" && (!call.meetLink || !call.meetLink.startsWith("http"))) {
      // Generate authentic Google Meet link upon confirmation if not yet present
      const { meetLink, eventId } = await createGoogleMeetEvent({
        title: `HelpSathi Confirmed Call: ${call.student.name} & ${call.mentor.name}`,
        description: `Confirmed Mentorship session on HelpSathi platform. Notes: ${call.notes || "None"}`,
        startTime: new Date(call.scheduledAt),
        durationMinutes: call.durationMinutes,
        attendeeEmails: [call.student.email, call.mentor.email],
      });
      updatePayload.meetLink = meetLink;
      if (eventId) updatePayload.eventId = eventId;
    }

    const updated = await prisma.scheduledChat.update({
      where: { id },
      data: updatePayload,
    });

    if (status === "DISPUTED") {
      await dispatchNotification({
        userId: call.mentorId,
        title: "⚠️ Call Disputed",
        message: `Your scheduled call with ${call.student.name} has been disputed. Admin will review.`,
        type: "BOOKING",
        link: "/mentor-dashboard",
      });
    }

    return NextResponse.json({ success: true, call: updated });
  } catch (error: any) {
    console.error("Update Call Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
      }
    });

    if (!call) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (session.userId !== call.studentId && session.userId !== call.mentorId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, call });
  } catch (error: any) {
    console.error("Get Call Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
