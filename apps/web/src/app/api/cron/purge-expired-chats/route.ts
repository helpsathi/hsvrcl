import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = !!process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET;
  const isCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron && !isInternal && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 28 days retention window for top-up / pay-per-minute chats
    const cutoffDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

    // Find completed/expired/cancelled sessions older than 28 days with messages
    const expiredSessions = await prisma.chatSession.findMany({
      where: {
        status: { in: ["COMPLETED", "EXPIRED", "CANCELLED"] },
        createdAt: { lt: cutoffDate },
        messages: { some: {} },
      },
      include: {
        messages: { select: { id: true } },
      },
    });

    let purgedSessionsCount = 0;
    let purgedMessagesCount = 0;

    for (const session of expiredSessions) {
      // Check if this student had an active subscription to this mentor during the chat
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.mentorId },
        select: { id: true },
      });

      let isSubscriptionChat = false;
      if (mentorProfile) {
        const sub = await prisma.subscription.findFirst({
          where: {
            studentId: session.studentId,
            mentorId: mentorProfile.id,
            startDate: { lte: session.createdAt },
            endDate: { gte: session.createdAt },
          },
        });
        if (sub) {
          isSubscriptionChat = true;
        }
      }

      // If it was a top-up / pay-per-minute chat (not covered by subscription) OR if it was a private chat, purge raw messages
      if (!isSubscriptionChat || session.isPrivate) {
        const deleteRes = await prisma.message.deleteMany({
          where: { sessionId: session.id },
        });
        purgedMessagesCount += deleteRes.count;
        purgedSessionsCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      message: `28-day chat retention sweep completed. Purged ${purgedMessagesCount} messages across ${purgedSessionsCount} top-up sessions.`,
      purgedSessionsCount,
      purgedMessagesCount,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error: any) {
    console.error("Purge Expired Chats Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
