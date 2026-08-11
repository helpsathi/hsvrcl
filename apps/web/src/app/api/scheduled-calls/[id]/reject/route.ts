import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteGoogleMeetEvent } from "@/lib/googleCalendar";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized. Only mentors can reject calls." }, { status: 401 });
    }

    const { id } = await params;

    const scheduledCall = await prisma.scheduledChat.findUnique({
      where: { id: id },
      include: { student: { include: { wallet: true } } },
    });

    if (!scheduledCall) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (scheduledCall.mentorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (scheduledCall.status !== "PENDING" && scheduledCall.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Call cannot be rejected at this stage" }, { status: 400 });
    }

    // Refund logic
    const updatedCall = await prisma.$transaction(async (tx) => {
      // 1. Refund the student
      if (scheduledCall.student.wallet) {
        await tx.wallet.update({
          where: { id: scheduledCall.student.wallet.id },
          data: { balance: { increment: scheduledCall.estimatedCost } },
        });

        await tx.transaction.create({
          data: {
            walletId: scheduledCall.student.wallet.id,
            type: "CREDIT",
            amount: scheduledCall.estimatedCost,
            description: "Refund: Scheduled Call Rejected by Mentor",
          },
        });
      }

      // 2. Update status to REJECTED
      return await tx.scheduledChat.update({
        where: { id: id },
        data: { status: "REJECTED" as any },
      });
    });

    if (scheduledCall.eventId) {
      await deleteGoogleMeetEvent(scheduledCall.eventId).catch((err) =>
        console.error("Failed to cancel Google Calendar event:", err)
      );
    }

    return NextResponse.json({ success: true, scheduledCall: updatedCall });
  } catch (error: any) {
    console.error("Reject Call Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
