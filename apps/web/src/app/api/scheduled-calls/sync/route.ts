import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const internalSecret = req.headers.get("x-internal-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!process.env.INTERNAL_API_SECRET || (internalSecret !== process.env.INTERNAL_API_SECRET && internalSecret !== process.env.CRON_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // 1. Mark PENDING calls as MISSED if more than an hour past scheduled time
    const missedCalls = await prisma.scheduledChat.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) }
      },
      include: { student: { include: { wallet: true } } }
    });

    const updatedMissed = [];
    for (const call of missedCalls) {
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
              description: `Refund: Scheduled Call Missed`,
            },
          });
        }

        return await tx.scheduledChat.update({
          where: { id: call.id },
          data: { status: "MISSED" },
        });
      });

      await dispatchNotification({
        userId: call.student.id,
        title: "💰 Missed Call Refunded",
        message: `Your consultation call was marked as missed. ₹${call.estimatedCost} has been automatically refunded to your wallet.`,
        type: "PAYMENT",
        link: "/wallet",
      }).catch(err => console.error("Refund notification failed:", err));

      updatedMissed.push(updated);
    }
    
    // 2. Auto-complete CONFIRMED/ACCEPTED calls past their end time + 30 min buffer
    // Since durationMinutes is variable, we pull all past calls and check individually
    const pastConfirmedCalls = await prisma.scheduledChat.findMany({
      where: {
        status: { in: ["CONFIRMED", "ACCEPTED"] },
        scheduledAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) } // At least 30 mins past start
      },
      include: {
        mentor: { include: { wallet: true } },
        student: { select: { id: true } }
      }
    });

    const updatedCompleted = [];
    for (const call of pastConfirmedCalls) {
      const callEndTime = new Date(call.scheduledAt.getTime() + (call.durationMinutes + 30) * 60000);
      if (now >= callEndTime) {
        const updated = await prisma.$transaction(async (tx) => {
          // Calculate mentor earnings (platform fee logic usually applies, but for simplicity here we assume 80% if not defined elsewhere)
          // Look up platform commission or just credit the mentor
          const platformFeePercent = 20; // Ideally from PlatformConfig
          const mentorShare = call.estimatedCost * (1 - (platformFeePercent / 100));

          if (call.mentor.wallet) {
            await tx.wallet.update({
              where: { id: call.mentor.wallet.id },
              data: { balance: { increment: mentorShare } },
            });

            await tx.transaction.create({
              data: {
                walletId: call.mentor.wallet.id,
                type: "CREDIT",
                amount: mentorShare,
                description: `Earnings: Completed Scheduled Call`,
              },
            });
          }

          return await tx.scheduledChat.update({
            where: { id: call.id },
            data: { status: "COMPLETED" },
          });
        });

        await dispatchNotification({
          userId: call.mentorId,
          title: "🎉 Call Auto-Completed",
          message: `The system auto-completed your consultation and credited your wallet.`,
          type: "PAYMENT",
          link: "/mentor-dashboard",
        }).catch(err => console.error("Completion notification failed:", err));
        
        await dispatchNotification({
          userId: call.studentId,
          title: "📝 Rate your session",
          message: `Your call was marked as completed. Please leave a review!`,
          type: "SYSTEM",
          link: "/scheduled-calls",
        }).catch(err => console.error("Review notification failed:", err));

        updatedCompleted.push(updated);
      }
    }

    // 3. Auto-close expired Session Proposals whose proposedAt time has passed
    const expiredProposals = await prisma.sessionProposal.updateMany({
      where: {
        status: "OPEN",
        proposedAt: { lt: now }
      },
      data: { status: "CLOSED" }
    });

    return NextResponse.json({ 
      success: true, 
      processedMissed: updatedMissed.length,
      processedCompleted: updatedCompleted.length,
      closedProposals: expiredProposals.count
    });
  } catch (error: any) {
    console.error("Sync Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
