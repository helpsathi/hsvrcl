import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";

export async function GET(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
      include: {
        student: { select: { id: true, name: true, avatar: true } },
        mentor: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Ensure the user is part of the chat
    if (chatSession.studentId !== session.userId && chatSession.mentorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allSessions = await prisma.chatSession.findMany({
      where: {
        studentId: chatSession.studentId,
        mentorId: chatSession.mentorId
      },
      select: { 
        id: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        durationMinutes: true,
        totalCharge: true,
        status: true,
        isFreeTrial: true,
        messages: {
          select: { id: true },
          take: 1
        }
      },
      orderBy: { createdAt: "asc" }
    });
    
    const sessionIds = allSessions.map(s => s.id);

    const unifiedMessages = await prisma.message.findMany({
      where: { sessionId: { in: sessionIds } },
      orderBy: { createdAt: "asc" }
    });

    // Identify past completed top-up sessions whose raw messages were purged after 28 days
    const pastPurgedSessions = allSessions
      .filter(s => s.id !== chatId && s.messages.length === 0 && (s.durationMinutes > 0 || s.status === "COMPLETED" || s.status === "EXPIRED"))
      .map(s => ({
        sessionId: s.id,
        date: (s.endTime || s.createdAt).toISOString(),
        durationMinutes: s.durationMinutes || 0,
        totalCharge: s.totalCharge || 0,
        isFreeTrial: s.isFreeTrial,
      }));

    // Check if student has an active subscription or historical subscription to this mentor
    let isSubscribed = false;
    let subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "NONE" = "NONE";
    let subscriptionExpiresAt: string | null = null;
    let mentorProfileId: string | null = null;
    let mentorMonthlyPrice: number = 0;

    if (session.role === "STUDENT") {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: chatSession.mentorId },
        select: { id: true, monthlyPrice: true }
      });
      if (mentorProfile) {
        mentorProfileId = mentorProfile.id;
        mentorMonthlyPrice = mentorProfile.monthlyPrice;

        const allSubs = await prisma.subscription.findMany({
          where: {
            studentId: session.userId,
            mentorId: mentorProfile.id,
          },
          orderBy: { endDate: "desc" }
        });

        if (allSubs.length > 0) {
          const latestSub = allSubs[0];
          const now = new Date();
          if (latestSub.isActive && latestSub.endDate > now) {
            isSubscribed = true;
            subscriptionStatus = "ACTIVE";
            subscriptionExpiresAt = latestSub.endDate.toISOString();
          } else if (!latestSub.isActive && latestSub.endDate > now) {
            subscriptionStatus = "CANCELLED";
            subscriptionExpiresAt = latestSub.endDate.toISOString();
          } else {
            subscriptionStatus = "EXPIRED";
            subscriptionExpiresAt = latestSub.endDate.toISOString();
          }
        }
      }
    }

    const freeTrialMaxMinutes = await getPlatformConfigNumber(CONFIG_KEYS.FREE_TRIAL_MAX_MINUTES);

    const chatData = { 
      ...chatSession, 
      messages: unifiedMessages, 
      pastPurgedSessions,
      isSubscribed,
      subscriptionStatus,
      subscriptionExpiresAt,
      mentorProfileId,
      mentorMonthlyPrice,
      freeTrialMaxMinutes
    };

    return NextResponse.json({ success: true, chat: chatData });
  } catch (error: any) {
    console.error("Fetch Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
