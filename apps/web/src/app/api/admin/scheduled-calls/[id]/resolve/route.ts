import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resolution } = await req.json(); // "MENTOR" or "STUDENT"
    if (resolution !== "MENTOR" && resolution !== "STUDENT") {
      return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
    }

    const call = await prisma.scheduledChat.findUnique({
      where: { id },
      include: { 
        student: { include: { wallet: true } }, 
        mentor: { include: { wallet: true } } 
      }
    });

    if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
    if (call.status !== "DISPUTED") {
      return NextResponse.json({ error: "Call is not currently disputed" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Find the DEBIT transaction on the mentor's wallet that froze the funds
      const frozenTransaction = await tx.transaction.findFirst({
        where: {
          walletId: call.mentor.wallet?.id,
          type: "DEBIT",
          description: { startsWith: "Dispute Hold" }
        },
        orderBy: { createdAt: "desc" }
      });

      const disputedAmount = frozenTransaction?.amount || 0;

      if (resolution === "MENTOR") {
        // Mentor wins the dispute. Return the funds to the mentor's wallet.
        if (call.mentor.wallet && disputedAmount > 0) {
          await tx.wallet.update({
            where: { id: call.mentor.wallet.id },
            data: { balance: { increment: disputedAmount } }
          });
          await tx.transaction.create({
            data: {
              walletId: call.mentor.wallet.id,
              type: "CREDIT",
              amount: disputedAmount,
              description: `Dispute Resolved: Funds restored`,
            }
          });
        }
        return await tx.scheduledChat.update({
          where: { id },
          data: { status: "COMPLETED" },
        });

      } else {
        // Student wins the dispute. Refund the full cost to the student's wallet.
        if (call.student.wallet) {
          await tx.wallet.update({
            where: { id: call.student.wallet.id },
            data: { balance: { increment: call.estimatedCost } }
          });
          await tx.transaction.create({
            data: {
              walletId: call.student.wallet.id,
              type: "CREDIT",
              amount: call.estimatedCost,
              description: `Dispute Resolved: Full Refund`,
            }
          });
        }
        // Mentor doesn't get the frozen money back.
        return await tx.scheduledChat.update({
          where: { id },
          data: { status: "REJECTED" }, // or CANCELLED, but REJECTED signals it didn't count
        });
      }
    });

    // Notify users
    if (resolution === "MENTOR") {
      await dispatchNotification({
        userId: call.mentorId,
        title: "✅ Dispute Resolved",
        message: `Admin ruled in your favor. Your earnings have been restored.`,
        type: "PAYMENT",
        link: "/wallet",
      });
      await dispatchNotification({
        userId: call.studentId,
        title: "❌ Dispute Resolved",
        message: `Admin ruled in the mentor's favor regarding your scheduled call. No refund will be issued.`,
        type: "SYSTEM",
      });
    } else {
      await dispatchNotification({
        userId: call.studentId,
        title: "💰 Dispute Resolved: Refund Issued",
        message: `Admin ruled in your favor. ₹${call.estimatedCost} has been refunded to your wallet.`,
        type: "PAYMENT",
        link: "/wallet",
      });
      await dispatchNotification({
        userId: call.mentorId,
        title: "❌ Dispute Resolved",
        message: `Admin ruled in the student's favor. Your frozen earnings have been revoked.`,
        type: "SYSTEM",
      });
    }

    return NextResponse.json({ success: true, call: updated });
  } catch (error: any) {
    console.error("Resolve Dispute Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
