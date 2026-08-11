import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, DEFAULT_TRANSACTION_OPTIONS } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { requireAdminPermission } from "@/lib/rbac";
import { formatDatabaseError } from "@/lib/errors";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const { id } = await context.params;
    const { status, adminNotes } = await req.json();

    if (!["COMPLETED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const payout = await prisma.withdrawalRequest.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    if (payout.status !== "PENDING") {
      return NextResponse.json({ error: `Payout is already ${payout.status}` }, { status: 400 });
    }

    // Find the mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: payout.mentorId },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const noteText = adminNotes ? String(adminNotes).trim() : null;

    if (status === "COMPLETED") {
      // Execute in a transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Mark withdrawal as completed with optional note
        await tx.withdrawalRequest.update({
          where: { id: payout.id },
          data: { 
            status: "COMPLETED",
            adminNotes: noteText,
          },
        });

        // Update existing transaction description instead of creating a phantom DEBIT
        const existingTx = await tx.transaction.findFirst({
          where: { referenceId: payout.id },
        });
        if (existingTx) {
          await tx.transaction.update({
            where: { id: existingTx.id },
            data: {
              description: `Withdrawal Processed to UPI${noteText ? ` (${noteText})` : ""}`,
            },
          });
        }

        const wallet = await tx.wallet.findUnique({
          where: { userId: mentorProfile.userId }
        });
        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { lockedBalance: { decrement: payout.amount } }
          });
        }
      }, DEFAULT_TRANSACTION_OPTIONS);
    } else {
      // Refund wallet and mark as rejected with reason
      await prisma.$transaction(async (tx) => {
        await tx.withdrawalRequest.update({
          where: { id: payout.id },
          data: { 
            status: "REJECTED",
            adminNotes: noteText,
          },
        });
        
        const wallet = await tx.wallet.findUnique({
          where: { userId: mentorProfile.userId }
        });
        
        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { 
              balance: { increment: payout.amount },
              lockedBalance: { decrement: payout.amount } 
            }
          });
          
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: "CREDIT",
              amount: payout.amount,
              description: `Refund: Withdrawal Rejected${noteText ? ` (${noteText})` : ""}`,
              referenceId: payout.id
            }
          });
        }
      }, DEFAULT_TRANSACTION_OPTIONS);
    }

    // Dispatch real-time notification to the mentor
    await dispatchNotification({
      userId: mentorProfile.userId,
      title: status === "COMPLETED" ? "✅ Payout Approved & Processed" : "❌ Withdrawal Request Rejected",
      message: status === "COMPLETED" 
        ? `Your withdrawal of ₹${payout.amount} has been completed.${noteText ? ` Note: ${noteText}` : ""}`
        : `Your withdrawal of ₹${payout.amount} was rejected and ₹${payout.amount} refunded to your wallet.${noteText ? ` Reason: ${noteText}` : ""}`,
      type: "PAYOUT",
      link: "/mentor-dashboard",
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: `PAYOUT_${status}`,
          targetId: payout.id,
          details: `Processed payout ₹${payout.amount} for mentor ${payout.mentorId}`,
        },
      });
    } catch (e) {
      console.error("Failed to write audit log:", e);
    }

    return NextResponse.json({ success: true, message: `Payout ${status.toLowerCase()}` });
  } catch (error: any) {
    console.error("Update Payout Error:", error);
    const friendlyMsg = formatDatabaseError(error, "Failed to update payout. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}

