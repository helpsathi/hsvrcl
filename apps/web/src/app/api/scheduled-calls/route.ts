import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { getOrSyncMentorAvailability } from "@/lib/mentor-availability";

async function checkTimeSlotConflict(db: any, mentorId: string, start: Date, end: Date): Promise<boolean> {
  const windowStart = new Date(start.getTime() - 12 * 60 * 60 * 1000);
  const windowEnd = new Date(end.getTime() + 12 * 60 * 60 * 1000);
  const candidates = await db.scheduledChat.findMany({
    where: {
      mentorId,
      status: { in: ["PENDING", "CONFIRMED"] },
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
    select: { scheduledAt: true, durationMinutes: true },
  });
  return candidates.some((c: any) => {
    const cStart = new Date(c.scheduledAt).getTime();
    const cEnd = cStart + c.durationMinutes * 60 * 1000;
    return cStart < end.getTime() && cEnd > start.getTime();
  });
}

async function checkMentorAvailability(db: any, mentorProfile: any, start: Date, end: Date): Promise<boolean> {
  // Convert UTC Date to IST before extracting components
  const istOffset = 5.5 * 60 * 60 * 1000;
  const startIST = new Date(start.getTime() + istOffset);
  const endIST = new Date(end.getTime() + istOffset);

  const dayOfWeek = startIST.getUTCDay(); // 0-6 (Sun-Sat)
  const startHour = startIST.getUTCHours();
  const startMin = startIST.getUTCMinutes();
  const endHour = endIST.getUTCHours();
  const endMin = endIST.getUTCMinutes();

  const allSlots = await getOrSyncMentorAvailability(db, mentorProfile);
  const slots = allSlots.filter((s: any) => s.dayOfWeek === dayOfWeek && s.isActive !== false);

  if (slots.length === 0) return false;

  const reqStart = startHour * 60 + startMin;
  const reqEnd = endHour * 60 + endMin;

  return slots.some((slot: any) => {
    const slotStart = slot.startHour * 60 + slot.startMin;
    const slotEnd = slot.endHour * 60 + slot.endMin;
    if (slotEnd > slotStart) {
      // Normal slot (e.g., 09:00 – 17:00)
      return reqStart >= slotStart && reqEnd <= slotEnd;
    } else {
      // Midnight-spanning slot (e.g., 22:00 – 02:00)
      return reqStart >= slotStart || reqEnd <= slotEnd;
    }
  });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mentorProfileId, scheduledAt, durationMinutes, notes } = await req.json();

    if (!mentorProfileId || !scheduledAt || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
    }

    // Get mentor profile by either profile ID or user ID
    const mentorProfile = await prisma.mentorProfile.findFirst({
      where: {
        OR: [
          { id: mentorProfileId },
          { userId: mentorProfileId },
        ],
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!mentorProfile || mentorProfile.status !== "APPROVED") {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    if (mentorProfile.holidayMode) {
      if (!mentorProfile.holidayUntil || new Date(mentorProfile.holidayUntil) > scheduledDate) {
        const returnDate = mentorProfile.holidayUntil ? ` until ${new Date(mentorProfile.holidayUntil).toLocaleDateString()}` : "";
        return NextResponse.json({ 
          error: `This mentor is currently on holiday${returnDate} and is not accepting call bookings.` 
        }, { status: 400 });
      }
    }

    if (mentorProfile.userId === session.userId) {
      return NextResponse.json({ error: "You cannot book a call with your own mentor account." }, { status: 400 });
    }

    // @ts-ignore: field was just added to schema
    const bookingNoticeHours = mentorProfile.bookingNoticeHours ?? 2;
    const minBookingTime = new Date(Date.now() + bookingNoticeHours * 60 * 60 * 1000);
    if (scheduledDate < minBookingTime) {
      return NextResponse.json({ 
        error: `This mentor requires at least ${bookingNoticeHours} ${bookingNoticeHours === 1 ? 'hour' : 'hours'} notice. Please choose a later time slot.` 
      }, { status: 400 });
    }

    // Get student user info for invitations
    const studentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });

    // Check if student is an active subscriber of this mentor (FREE booking)
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        studentId: session.userId,
        mentorId: mentorProfile.id,
        isActive: true,
        endDate: { gt: new Date() },
      },
    });
    const isSubscriberFreeBooking = Boolean(activeSubscription) && Boolean(mentorProfile.subscribedBookingFree);

    // Cost and conflict boundaries
    const baseEstimatedCost = Math.ceil(durationMinutes) * (mentorProfile.callPricePerMinute ?? mentorProfile.perMinutePrice ?? 15);
    const estimatedCost = isSubscriberFreeBooking ? 0 : baseEstimatedCost;
    const conflictEnd = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000);

    // PRE-CHECK: Quick validation outside transaction
    if (!isSubscriberFreeBooking) {
      const preCheckWallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
      if (!preCheckWallet || preCheckWallet.balance < estimatedCost) {
        return NextResponse.json(
          { error: `Insufficient balance. Estimated cost: ₹${estimatedCost}. Your balance: ₹${preCheckWallet?.balance ?? 0}`, requireRecharge: true },
          { status: 400 }
        );
      }
    }
    const preCheckConflict = await checkTimeSlotConflict(prisma, mentorProfile.user.id, scheduledDate, conflictEnd);
    if (preCheckConflict) {
      return NextResponse.json({ error: "The mentor is already booked for this time slot." }, { status: 409 });
    }

    const isAvailable = await checkMentorAvailability(prisma, mentorProfile, scheduledDate, conflictEnd);
    if (!isAvailable) {
      return NextResponse.json({ error: "The mentor is not available during this time slot." }, { status: 400 });
    }

    // Create the scheduled call and deduct wallet balance
    const scheduledCall = await prisma.$transaction(async (tx) => {
      // 1. Check for conflicting bookings inside transaction
      const conflict = await checkTimeSlotConflict(tx, mentorProfile.user.id, scheduledDate, conflictEnd);
      if (conflict) {
        throw new Error("CONFLICT");
      }

      // 2. Check wallet balance inside transaction (only for non-subscribers)
      if (!isSubscriberFreeBooking) {
        const wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
        if (!wallet || wallet.balance < estimatedCost) {
          throw new Error(`INSUFFICIENT_FUNDS:${estimatedCost}:${wallet?.balance ?? 0}`);
        }

        const updatedWallet = await tx.wallet.update({
          where: { userId: session.userId },
          data: { balance: { decrement: estimatedCost } },
        });

        await tx.transaction.create({
          data: {
            walletId: updatedWallet.id,
            type: "DEBIT",
            amount: estimatedCost,
            description: `Booking: Scheduled Call with ${mentorProfile.user.name}`,
          },
        });
      }

      return await tx.scheduledChat.create({
        data: {
          studentId: session.userId,
          mentorId: mentorProfile.user.id,
          scheduledAt: scheduledDate,
          durationMinutes: Number(durationMinutes),
          notes: notes || null,
          status: "PENDING",
          estimatedCost,
          meetLink: mentorProfile.personalMeetingLink || null,
        },
      });
    });

    // Dispatch instant real-time & push alerts to Mentor and Student
    await dispatchNotification({
      userId: mentorProfile.user.id,
      title: "📅 New Call Booked!",
      message: `${studentUser?.name || "A student"} scheduled a ${durationMinutes}-min consultation for ${scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      type: "BOOKING",
      link: "/mentor-dashboard",
    });

    await dispatchNotification({
      userId: session.userId,
      title: "📅 Booking Confirmed!",
      message: `Your ${durationMinutes}-min call with ${mentorProfile.user.name} is booked for ${scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      type: "BOOKING",
      link: "/dashboard",
    });

    return NextResponse.json({ success: true, call: scheduledCall });
  } catch (error: any) {
    console.error("Book Call Error:", error);
    if (error.message.startsWith("INSUFFICIENT_FUNDS")) {
      const [, cost, bal] = error.message.split(":");
      return NextResponse.json(
        { error: `Insufficient balance. Estimated cost: ₹${cost}. Your balance: ₹${bal}`, requireRecharge: true },
        { status: 400 }
      );
    }
    if (error.message === "CONFLICT") {
      return NextResponse.json({ error: "This time slot is already booked. Please choose another time." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const statusFilter = url.searchParams.get("status") || "all";
    
    const skip = (page - 1) * limit;
    
    const baseWhere: any = session.role === "STUDENT"
      ? { studentId: session.userId }
      : { mentorId: session.userId };
      
    if (statusFilter === "upcoming") {
      baseWhere.status = { in: ["PENDING", "CONFIRMED", "ACCEPTED"] };
      baseWhere.scheduledAt = { gte: new Date() };
    } else if (statusFilter === "past") {
      baseWhere.OR = [
        { status: { in: ["COMPLETED", "CANCELLED", "MISSED", "REJECTED"] } },
        { 
          status: { in: ["PENDING", "CONFIRMED", "ACCEPTED"] },
          scheduledAt: { lt: new Date() }
        }
      ];
    }

    const [calls, total] = await Promise.all([
      prisma.scheduledChat.findMany({
        where: baseWhere,
        include: {
          student: { select: { name: true, avatar: true, email: true } },
          mentor: { select: { name: true, avatar: true, email: true } },
        },
        orderBy: { scheduledAt: statusFilter === "upcoming" ? "asc" : "desc" },
        skip,
        take: limit,
      }),
      prisma.scheduledChat.count({ where: baseWhere })
    ]);

    return NextResponse.json({ 
      success: true, 
      calls,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
