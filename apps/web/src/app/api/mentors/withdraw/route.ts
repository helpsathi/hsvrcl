import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, DEFAULT_TRANSACTION_OPTIONS } from "@/lib/prisma";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";
import { dispatchNotification } from "@/lib/notifications";
import { formatDatabaseError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, upiId } = await req.json();
    const reqAmount = Number(amount);

    if (isNaN(reqAmount) || reqAmount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 });
    }

    const [minWithdrawalAmount, maxWithdrawalRequests] = await Promise.all([
      getPlatformConfigNumber(CONFIG_KEYS.MIN_WITHDRAWAL_AMOUNT),
      getPlatformConfigNumber(CONFIG_KEYS.MAX_WITHDRAWAL_REQUESTS)
    ]);

    if (reqAmount < minWithdrawalAmount) {
      return NextResponse.json({ error: `Minimum withdrawal amount is ₹${minWithdrawalAmount}` }, { status: 400 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true, upiId: true, bankDetails: true }
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    const targetUpi = upiId || mentorProfile.upiId || (mentorProfile.bankDetails ? "BANK_TRANSFER" : null);
    if (!targetUpi) {
      return NextResponse.json({ error: "Please add a UPI ID or Bank Details in your profile before withdrawing" }, { status: 400 });
    }

    const pendingWithdrawalsCount = await prisma.withdrawalRequest.count({
      where: { mentorId: mentorProfile.id, status: "PENDING" }
    });

    if (pendingWithdrawalsCount >= maxWithdrawalRequests) {
      return NextResponse.json({ 
        error: `You already have ${pendingWithdrawalsCount} pending withdrawal requests. Please wait until they are processed.` 
      }, { status: 429 });
    }

    const withdrawal = await prisma.$transaction(async (tx) => {
      // Check exact wallet balance inside transaction
      const wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
      if (!wallet || wallet.balance < reqAmount) {
        throw new Error("Insufficient wallet balance");
      }

      // Move balance to lockedBalance immediately
      const updatedWallet = await tx.wallet.update({
        where: { userId: session.userId },
        data: { 
          balance: { decrement: reqAmount },
          lockedBalance: { increment: reqAmount } 
        },
      });

      // Create withdrawal request
      const request = await tx.withdrawalRequest.create({
        data: {
          mentorId: mentorProfile.id,
          amount: reqAmount,
          status: "PENDING",
          upiId: targetUpi,
        },
      });

      // Create transaction record linking to withdrawal request
      await tx.transaction.create({
        data: {
          walletId: updatedWallet.id,
          type: "DEBIT",
          amount: reqAmount,
          description: `Withdrawal Request (${targetUpi})`,
          referenceId: request.id,
        },
      });

      return request;
    }, DEFAULT_TRANSACTION_OPTIONS);

    await dispatchNotification({
      userId: session.userId,
      title: "📤 Withdrawal Request Submitted",
      message: `Your withdrawal request for ₹${reqAmount} has been received and is pending administrative processing.`,
      type: "PAYOUT",
      link: "/mentor-dashboard",
    });

    return NextResponse.json({ success: true, withdrawal, request: withdrawal });
  } catch (error: any) {
    console.error("Withdrawal Error:", error);
    if (error.message === "Insufficient wallet balance") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const friendlyMsg = formatDatabaseError(error, "Failed to submit withdrawal request. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!mentorProfile) {
      return NextResponse.json({ success: true, withdrawals: [], requests: [] });
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { mentorId: mentorProfile.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, withdrawals, requests: withdrawals });
  } catch (error: any) {
    console.error("Fetch Withdrawals Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
