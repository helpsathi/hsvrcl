import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allSubscriptions = await prisma.subscription.findMany({
      where: {
        studentId: session.userId,
      },
      include: {
        mentor: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        }
      },
      orderBy: { endDate: "desc" }
    });

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
      select: { balance: true }
    });

    const seenMentors = new Set<string>();
    const formattedMentors = [];
    const now = new Date();

    for (const s of allSubscriptions) {
      if (!s.mentor || !s.mentor.user) continue;
      if (seenMentors.has(s.mentor.id)) continue;
      seenMentors.add(s.mentor.id);

      const endDate = new Date(s.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = !s.isActive || endDate <= now;

      formattedMentors.push({
        id: s.mentor.userId,
        profileId: s.mentor.id,
        name: s.mentor.user.name,
        avatar: s.mentor.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.mentor.user.name)}&background=random`,
        verified: true,
        tagline: s.mentor.bio || "Expert Mentor",
        languages: s.mentor.languages.length ? s.mentor.languages : ["English"],
        experience: s.mentor.experience,
        rating: s.mentor.avgRating > 0 ? s.mentor.avgRating : 0,
        reviews: s.mentor.reviewCount,
        isOnline: s.mentor.isOnline,
        pricePerMinute: isExpired ? s.mentor.perMinutePrice : 0,
        callPricePerMinute: isExpired ? (s.mentor.callPricePerMinute ?? s.mentor.perMinutePrice) : 0,
        monthlyPrice: s.mentor.monthlyPrice > 0 ? s.mentor.monthlyPrice : undefined,
        subscription: {
          id: s.id,
          endDate: s.endDate.toISOString(),
          daysLeft: Math.max(0, daysLeft),
          isExpired,
          status: isExpired ? "EXPIRED" : "ACTIVE",
          autoRenew: s.autoRenew,
          paymentMethod: s.paymentMethod,
          razorpaySubId: s.razorpaySubId,
        }
      });
    }

    return NextResponse.json({ success: true, mentors: formattedMentors, walletBalance: wallet?.balance || 0 });
  } catch (error: any) {
    console.error("Fetch Subscribed Mentors Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
