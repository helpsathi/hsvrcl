import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";
import { roundINR } from "@/lib/currency";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getSession();
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = !!process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET;

    if (!session && !isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
      include: {
        student: { include: { wallet: true } },
        mentor: { include: { mentorProfile: true, wallet: true } },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    // Only student or mentor in the session, admin, or internal system can end the chat
    if (
      !isInternal &&
      session &&
      session.userId !== chatSession.studentId &&
      session.userId !== chatSession.mentorId &&
      session.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (chatSession.status === "COMPLETED") {
      return NextResponse.json({ success: true, session: chatSession, message: "Chat already completed" });
    }

    const endTime = new Date();
    let durationMinutes = 0;
    let totalCharge = 0;
    let freeMinutesDiscounted = 0;

    // Timer rule: duration is calculated starting ONLY after mentor's first message
    if (chatSession.firstMessageTime) {
      const elapsedMs = endTime.getTime() - new Date(chatSession.firstMessageTime).getTime();
      durationMinutes = Math.max(1, Math.ceil(elapsedMs / 60000));
    }

    let billableMinutes = durationMinutes;

    if (chatSession.isFreeTrial) {
      const maxFreeMins = await getPlatformConfigNumber(CONFIG_KEYS.FREE_TRIAL_MAX_MINUTES);
      freeMinutesDiscounted = Math.min(durationMinutes, maxFreeMins);
      billableMinutes = Math.max(0, durationMinutes - maxFreeMins);
    }

    totalCharge = roundINR(billableMinutes * chatSession.perMinuteRate);

    // Execute atomic DB updates using transaction
    const updatedSession = await prisma.$transaction(async (tx) => {
      // 1. Update Free Trial usage on student if this was a free trial session
      if (chatSession.isFreeTrial) {
        await tx.user.update({
          where: { id: chatSession.studentId },
          data: {
            freeTrialChatsUsed: { increment: 1 },
          },
        });
      }

      // 2. Perform wallet deductions & credits if charge > 0
      if (totalCharge > 0) {
        // Ensure student wallet exists
        let studentWallet = await tx.wallet.findUnique({ where: { userId: chatSession.studentId } });
        if (!studentWallet) {
          studentWallet = await tx.wallet.create({ data: { userId: chatSession.studentId, balance: 0 } });
        }

        // L4 Fix: Cap totalCharge to student's available wallet balance to prevent negative balances and platform loss
        const actualCharge = roundINR(Math.min(totalCharge, studentWallet.balance));
        totalCharge = actualCharge; // Update to reflect actual collected amount

        if (actualCharge > 0) {
          const defaultCommission = await getPlatformConfigNumber(CONFIG_KEYS.PLATFORM_COMMISSION_RATE);
          const commissionRate = chatSession.mentor.mentorProfile?.commissionRate ?? defaultCommission;
          const platformCommission = roundINR(actualCharge * (commissionRate / 100));
          const mentorEarnings = roundINR(actualCharge - platformCommission);

          studentWallet = await tx.wallet.update({
            where: { id: studentWallet.id },
            data: { balance: { decrement: actualCharge } },
          });

          await tx.transaction.create({
            data: {
              walletId: studentWallet.id,
              type: "DEBIT",
              amount: actualCharge,
              description: `Payment for ${durationMinutes} min chat session (${billableMinutes} min billable)`,
              referenceId: chatId,
            },
          });

          // Ensure mentor wallet exists & update balance with net earnings
          const mentorWallet = await tx.wallet.upsert({
            where: { userId: chatSession.mentorId },
            update: { balance: { increment: mentorEarnings } },
            create: { userId: chatSession.mentorId, balance: mentorEarnings },
          });

          await tx.transaction.create({
            data: {
              walletId: mentorWallet.id,
              type: "CREDIT",
              amount: mentorEarnings,
              description: `Chat earnings (${durationMinutes} min chat, net after ${commissionRate}% commission)`,
              referenceId: chatId,
            },
          });
        }
      }

      // 3. Mark chat completed securely using updateMany to prevent race conditions
      const updateResult = await tx.chatSession.updateMany({
        where: { id: chatId, status: "ACTIVE" },
        data: {
          status: "COMPLETED",
          endTime,
          durationMinutes,
          totalCharge,
        },
      });

      if (updateResult.count === 0) {
        throw new Error("ALREADY_ENDED");
      }

      // 4. Auto-delete chat history if Private Chat mode is enabled
      // Only delete messages AFTER confirming this transition was valid
      if (chatSession.isPrivate) {
        await tx.message.deleteMany({
          where: { sessionId: chatId },
        });
      }

      return await tx.chatSession.findUnique({ where: { id: chatId } });
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
      summary: {
        durationMinutes,
        freeMinutesDiscounted,
        billableMinutes,
        perMinuteRate: chatSession.perMinuteRate,
        totalCharge,
      },
    });
  } catch (error: any) {
    console.error("End Chat Error:", error);
    if (error.message === "ALREADY_ENDED") {
      return NextResponse.json({ success: true, message: "Chat already completed" });
    }
    return NextResponse.json({ error: "Failed to process chat termination" }, { status: 500 });
  }
}
