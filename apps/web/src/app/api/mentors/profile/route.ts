import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncMentorAvailability } from "@/lib/mentor-availability";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, name: true, email: true, adminSubRole: true }
    });

    if (!user || (user.role !== "MENTOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Mentor or Admin access required" }, { status: 403 });
    }

    let mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!mentorProfile && (user.role === "ADMIN" || user.adminSubRole)) {
      mentorProfile = await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          bio: "Platform Administrator & Senior Consultant",
          categories: ["Technology", "Career Guidance"],
          skills: ["Platform Administration", "Strategy"],
          languages: ["English", "Hindi"],
          experience: 5,
          perMinutePrice: 15,
          callPricePerMinute: 15,
          monthlyPrice: 999,
          status: "APPROVED",
          isOnline: true,
          commissionRate: 15,
        }
      });
    }

    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    // Fetch stats
    const totalSessions = await prisma.chatSession.count({
      where: { mentorId: session.userId, status: "COMPLETED" },
    });

    const activeSubscribers = await prisma.subscription.count({
      where: { mentorId: mentorProfile.id, isActive: true },
    });

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
      include: {
        transactions: true,
      },
    });

    const creditTxs = wallet?.transactions.filter(tx => tx.type === "CREDIT") || [];
    const totalEarnings = creditTxs.reduce((sum, tx) => sum + tx.amount, 0);

    const chatEarnings = creditTxs
      .filter(tx => {
        const desc = (tx.description || "").toLowerCase();
        return desc.includes("chat") || desc.includes("call") || desc.includes("session");
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const subscriptionEarnings = creditTxs
      .filter(tx => {
        const desc = (tx.description || "").toLowerCase();
        return desc.includes("sub") || desc.includes("plan");
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const otherEarnings = Math.max(0, totalEarnings - chatEarnings - subscriptionEarnings);

    // Fetch withdrawals
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { mentorId: mentorProfile.id },
    });

    const totalWithdrawn = withdrawals
      .filter(w => w.status === "COMPLETED" || w.status === "APPROVED")
      .reduce((sum, w) => sum + w.amount, 0);

    const pendingWithdrawalAmount = withdrawals
      .filter(w => w.status === "PENDING")
      .reduce((sum, w) => sum + w.amount, 0);

    const recentSessionsRaw = await prisma.chatSession.findMany({
      where: { mentorId: session.userId, status: "COMPLETED" },
      orderBy: { endTime: "desc" },
      take: 5,
      include: { student: { select: { name: true } } },
    });

    const recentSessions = recentSessionsRaw.map((s) => ({
      id: s.id,
      student: s.student.name,
      type: "Chat",
      duration: s.durationMinutes,
      earned: s.totalCharge,
      date: s.endTime?.toLocaleString(),
    }));

    const stats = {
      totalEarnings,
      totalSessions,
      rating: mentorProfile.avgRating,
      activeSubscribers,
      availableBalance: wallet?.balance || 0,
      lockedBalance: wallet?.lockedBalance || 0,
      commissionRate: mentorProfile.commissionRate || 15,
      breakdown: {
        chatEarnings: chatEarnings > 0 ? chatEarnings : (totalEarnings > 0 ? totalEarnings : 0),
        subscriptionEarnings,
        otherEarnings,
        totalWithdrawn,
        pendingWithdrawalAmount,
      }
    };

    const subscribersRaw = await prisma.subscription.findMany({
      where: { mentorId: mentorProfile.id, isActive: true },
      include: { student: { select: { id: true, name: true, avatar: true } } },
    });

    const subscribers = subscribersRaw.map((s) => ({
      id: s.id,
      studentId: s.student.id,
      name: s.student.name,
      avatar: s.student.avatar,
      startDate: s.startDate.toLocaleDateString(),
    }));

    return NextResponse.json({ profile: mentorProfile, stats, recentSessions, subscribers });
  } catch (error: any) {
    console.error("Fetch Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, adminSubRole: true }
    });

    if (!user || (user.role !== "MENTOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bio, perMinutePrice, callPricePerMinute, monthlyPrice, isOnline, upiId, bankDetails, availability, username, holidayMode, holidayUntil, resumeUrl, linkedinUrl, categories, skills, languages, freeTrial, subscribedBookingFree, bookingNoticeHours, personalMeetingLink } = body;

    let mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!mentorProfile && (user.role === "ADMIN" || user.adminSubRole)) {
      mentorProfile = await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          bio: bio || "Platform Administrator",
          categories: ["General"],
          status: "APPROVED",
        }
      });
    }

    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (categories !== undefined) dataToUpdate.categories = categories;
    if (skills !== undefined) dataToUpdate.skills = skills;
    if (languages !== undefined) dataToUpdate.languages = languages;
    if (holidayMode !== undefined) dataToUpdate.holidayMode = Boolean(holidayMode);
    if (holidayUntil !== undefined) dataToUpdate.holidayUntil = holidayUntil ? new Date(holidayUntil) : null;
    if (perMinutePrice !== undefined) {
      const price = Number(perMinutePrice);
      if (price < 0) return NextResponse.json({ error: "Price cannot be negative" }, { status: 400 });
      dataToUpdate.perMinutePrice = price;
    }
    if (callPricePerMinute !== undefined) {
      const price = Number(callPricePerMinute);
      if (price < 0) return NextResponse.json({ error: "Price cannot be negative" }, { status: 400 });
      dataToUpdate.callPricePerMinute = price;
    }
    if (monthlyPrice !== undefined) {
      const price = Number(monthlyPrice);
      if (price < 0) return NextResponse.json({ error: "Price cannot be negative" }, { status: 400 });
      dataToUpdate.monthlyPrice = price;
    }
    if (resumeUrl !== undefined) dataToUpdate.resumeUrl = resumeUrl;
    if (linkedinUrl !== undefined) dataToUpdate.linkedinUrl = linkedinUrl;
    if (isOnline !== undefined) dataToUpdate.isOnline = Boolean(isOnline);
    if (availability !== undefined) dataToUpdate.availability = availability;
    if (freeTrial !== undefined) dataToUpdate.freeTrial = Boolean(freeTrial);
    if (subscribedBookingFree !== undefined) dataToUpdate.subscribedBookingFree = Boolean(subscribedBookingFree);
    if (bookingNoticeHours !== undefined) dataToUpdate.bookingNoticeHours = Number(bookingNoticeHours);
    if (personalMeetingLink !== undefined) {
      let formattedLink = personalMeetingLink;
      if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
        formattedLink = `https://${formattedLink}`;
      }
      dataToUpdate.personalMeetingLink = formattedLink;
    }

    if (username !== undefined) {
      if (typeof username === "string" && username.trim() !== "") {
        const cleanUsername = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
          return NextResponse.json({ error: "Username must be 3-20 characters, lowercase letters, numbers, and underscores only." }, { status: 400 });
        }
        const taken = await prisma.mentorProfile.findUnique({ where: { username: cleanUsername } });
        if (taken && taken.userId !== session.userId) {
          return NextResponse.json({ error: "Username is already taken by another mentor." }, { status: 400 });
        }
        dataToUpdate.username = cleanUsername;
      } else if (username === null || username === "") {
        dataToUpdate.username = null;
      }
    }

    // Only allow updating payment info if approved
    if (mentorProfile.status === "APPROVED") {
      if (upiId !== undefined) dataToUpdate.upiId = upiId;
      if (bankDetails !== undefined) dataToUpdate.bankDetails = bankDetails;
    } else if (upiId !== undefined || bankDetails !== undefined) {
      return NextResponse.json({ error: "Cannot update payment details until profile is approved." }, { status: 403 });
    }

    const updatedProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.mentorProfile.update({
        where: { userId: session.userId },
        data: dataToUpdate,
      });
      if (availability !== undefined) {
        await syncMentorAvailability(tx, profile.id, availability);
      }
      return profile;
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
