import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformConfigNumber, getPlatformConfigBoolean, CONFIG_KEYS } from "@/lib/config";
import { chatRateLimiter } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN" && session.role !== "MENTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitStatus = chatRateLimiter.check(`chat_init_${session.userId}`);
    if (!limitStatus.success) {
      return NextResponse.json({ error: "Too many chat initiation attempts. Please slow down." }, { status: 429 });
    }

    const body = await req.json();
    const { mentorId, studentId } = body;

    // Handle Mentor -> Student chat initiation
    if (session.role === "MENTOR") {
      const targetStudentId = studentId || mentorId;
      if (!targetStudentId) {
        return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
      }

      let chatSession = await prisma.chatSession.findFirst({
        where: {
          studentId: targetStudentId,
          mentorId: session.userId,
          status: "ACTIVE",
        },
      });

      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: {
            studentId: targetStudentId,
            mentorId: session.userId,
            status: "ACTIVE",
            perMinuteRate: 0,
            isFreeTrial: false,
          },
        });
      }

      return NextResponse.json({
        success: true,
        chatId: chatSession.id,
        session: chatSession,
      });
    }

    if (!mentorId) {
      return NextResponse.json({ error: "Missing mentorId" }, { status: 400 });
    }

    // Get mentor profile and associated user
    const mentorProfile = await prisma.mentorProfile.findFirst({
      where: {
        OR: [
          { id: mentorId },
          { userId: mentorId },
        ],
      },
      include: { user: true, availabilitySlots: true },
    });

    if (!mentorProfile || mentorProfile.status !== "APPROVED" || !mentorProfile.user || (mentorProfile.user as any).deletedAt || (mentorProfile.user as any).isSuspended) {
      return NextResponse.json({ error: "Mentor is no longer available or suspended" }, { status: 404 });
    }

    if (mentorProfile.userId === session.userId) {
      return NextResponse.json({ error: "You cannot initiate a chat session with your own mentor account." }, { status: 400 });
    }

    if (mentorProfile.holidayMode) {
      if (!mentorProfile.holidayUntil || new Date(mentorProfile.holidayUntil) > new Date()) {
        return NextResponse.json({
          error: `Mentor is currently on holiday break${mentorProfile.holidayUntil ? ` until ${new Date(mentorProfile.holidayUntil).toLocaleDateString("en-IN")}` : ""}. New sessions cannot be initiated right now.`
        }, { status: 400 });
      }
    }

    if (mentorProfile.availabilitySlots && mentorProfile.availabilitySlots.length > 0) {
      const now = new Date();
      const currentDay = now.getDay(); // 0=Sun..6=Sat
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const activeSlotsToday = mentorProfile.availabilitySlots.filter(
        (s: any) => s.isActive && s.dayOfWeek === currentDay
      );

      if (session.role !== "ADMIN") {
        if (activeSlotsToday.length === 0) {
          return NextResponse.json({
            error: "The mentor is not available today. Please check back another day or book a 1:1 call!"
          }, { status: 400 });
        } else {
          const isWithinHours = activeSlotsToday.some((s: any) => {
            const start = s.startHour * 60 + s.startMin;
            const end = s.endHour * 60 + s.endMin;
            return currentTime >= start && currentTime <= end;
          });

          if (!isWithinHours) {
            const formatTime = (h: number, m: number) => {
              const ampm = h >= 12 ? 'PM' : 'AM';
              const hours = h % 12 || 12;
              const mins = m < 10 ? `0${m}` : m;
              return `${hours}:${mins} ${ampm}`;
            };
            const timeStrings = activeSlotsToday.map((s: any) => `${formatTime(s.startHour, s.startMin)} to ${formatTime(s.endHour, s.endMin)}`);
            const timeMsg = timeStrings.join(" and ");

            return NextResponse.json({
              error: `The mentor is only available today from ${timeMsg}. Please wait until then or book a 1:1 call instead!`
            }, { status: 400 });
          }
        }
      }
    }

    const resolvedMentorUserId = mentorProfile.userId;
    const mentorUser = mentorProfile.user;

    // Check if an active session already exists
    let chatSession = await prisma.chatSession.findFirst({
      where: {
        studentId: session.userId,
        mentorId: resolvedMentorUserId,
        status: "ACTIVE",
      },
    });

    if (chatSession) {
      return NextResponse.json({ success: true, chatId: chatSession.id, session: chatSession });
    }

    // Get student/admin record & wallet balance
    const student = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { wallet: true },
    });

    if (!student || (student as any).deletedAt || (student as any).isSuspended) {
      return NextResponse.json({ error: "Your account has been deactivated or suspended" }, { status: 403 });
    }

    const globalFreeTrialEnabled = await getPlatformConfigBoolean(CONFIG_KEYS.FREE_TRIAL_ENABLED);
    const maxFreeTrialChats = await getPlatformConfigNumber(CONFIG_KEYS.FREE_TRIAL_MAX_CHATS);

    // Determine if this session qualifies as a 5-minute Free Trial
    const isEligibleForFreeTrial =
      globalFreeTrialEnabled &&
      mentorProfile.freeTrial &&
      (student.freeTrialChatsUsed ?? 0) < maxFreeTrialChats;

    // Check for subscriptions using MentorProfile ID
    const allSubs = await prisma.subscription.findMany({
      where: {
        studentId: session.userId,
        mentorId: mentorProfile.id,
      },
      orderBy: { endDate: "desc" }
    });

    let isSubscribed = false;
    let subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "NONE" = "NONE";

    if (allSubs.length > 0) {
      const latestSub = allSubs[0];
      const now = new Date();
      if (latestSub.isActive && latestSub.endDate > now) {
        isSubscribed = true;
        subscriptionStatus = "ACTIVE";
      } else if (!latestSub.isActive && latestSub.endDate > now) {
        subscriptionStatus = "CANCELLED";
      } else {
        subscriptionStatus = "EXPIRED";
      }
    }

    let perMinuteRate = mentorProfile.perMinutePrice ?? 15;

    if (session.role === "ADMIN" || session.adminSubRole || (isSubscribed && mentorProfile.subscribedBookingFree !== false)) {
      perMinuteRate = 0; // Free chat for subscribers (when booking free enabled) and admins
    }

    if (!isEligibleForFreeTrial && !isSubscribed && session.role !== "ADMIN") {
      const balance = student.wallet?.balance ?? 0;
      if (balance < perMinuteRate) {
        const errorMsg = subscriptionStatus === "EXPIRED" || subscriptionStatus === "CANCELLED"
          ? `Your subscription to this mentor has ended (${subscriptionStatus.toLowerCase()}). You need at least ₹${perMinuteRate} in your wallet for pay-per-minute, or you can renew your subscription.`
          : `Insufficient wallet balance. You need at least ₹${perMinuteRate} in your wallet to start this chat.`;

        return NextResponse.json(
          {
            error: errorMsg,
            requireRecharge: true,
            minRequired: perMinuteRate,
            subscriptionStatus,
            mentorProfileId: mentorProfile.id,
            mentorMonthlyPrice: mentorProfile.monthlyPrice
          },
          { status: 400 }
        );
      }
    }

    // Create a new session
    chatSession = await prisma.chatSession.create({
      data: {
        studentId: session.userId,
        mentorId: resolvedMentorUserId,
        status: "ACTIVE",
        perMinuteRate,
        isFreeTrial: isEligibleForFreeTrial,
      },
    });

    return NextResponse.json({
      success: true,
      chatId: chatSession.id,
      session: chatSession,
      isFreeTrial: isEligibleForFreeTrial,
    });
  } catch (error: any) {
    console.error("Initiate Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
