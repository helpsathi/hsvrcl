import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch Offers with attractive default fallbacks
    const offersConfig = await prisma.platformConfig.findUnique({
      where: { key: "DASHBOARD_OFFERS" }
    });
    let offers = [];
    if (offersConfig) {
      try { offers = JSON.parse(offersConfig.value); } catch (e) {}
    }
    if (!Array.isArray(offers) || offers.length === 0) {
      offers = [
        {
          id: "default-free-chats",
          title: "First 3 Chats are Free!",
          subtitle: "Talk to any expert mentor for up to 5 mins without paying.",
          gradientFrom: "from-amber-500",
          gradientTo: "to-orange-600",
          iconName: "Gift",
          newUsersOnly: true
        },
        {
          id: "default-first-month",
          title: "Seamless Monthly Mentorship",
          subtitle: "Subscribe via AutoPay for continuous unlimited support & strategy.",
          gradientFrom: "from-indigo-600",
          gradientTo: "to-purple-600",
          iconName: "Tag",
          newUsersOnly: false
        },
        {
          id: "default-resume-review",
          title: "1-on-1 Strategy & Mentorship",
          subtitle: "Book audio or video calls with toppers in your targeted field.",
          gradientFrom: "from-emerald-500",
          gradientTo: "to-teal-600",
          iconName: "FileText",
          newUsersOnly: false
        }
      ];
    }

    // Fetch Categories with default fallbacks
    const categoriesConfig = await prisma.platformConfig.findUnique({
      where: { key: "DASHBOARD_CATEGORIES" }
    });
    let categories = [];
    if (categoriesConfig) {
      try { categories = JSON.parse(categoriesConfig.value); } catch (e) {}
    }
    if (!Array.isArray(categories) || categories.length === 0) {
      categories = [
        { id: "default-upsc-bpsc", name: "UPSC / BPSC", iconName: "BookOpenText" },
        { id: "default-jee-neet", name: "JEE / NEET", iconName: "Atom" },
        { id: "default-software-engg", name: "Software Engg", iconName: "Code" },
        { id: "default-startup-founder", name: "Startup Founder", iconName: "RocketLaunch" },
        { id: "default-mba", name: "CAT / MBA", iconName: "ChartLineUp" },
        { id: "default-medical", name: "Medical / AIIMS", iconName: "FirstAid" }
      ];
    }

    // Fetch Featured Coupons
    const coupons = await prisma.coupon.findMany({
      where: { 
        isActive: true,
        showOnDashboard: true
      },
      orderBy: { createdAt: "desc" }
    });

    // I5: Fetch student widget summary metrics (free trial tracker and wallet balance warning)
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        freeTrialChatsUsed: true,
        wallet: { select: { balance: true, lockedBalance: true } },
      },
    });

    const maxFreeTrials = await getPlatformConfigNumber(CONFIG_KEYS.FREE_TRIAL_MAX_CHATS);
    const freeTrialsRemaining = Math.max(0, maxFreeTrials - (user?.freeTrialChatsUsed || 0));
    const walletBalance = user?.wallet?.balance || 0;
    const isWalletLow = walletBalance < 50; // threshold warning for quick consultations

    return NextResponse.json({
      offers,
      categories,
      coupons,
      studentStats: {
        freeTrialsRemaining,
        maxFreeTrials,
        freeTrialChatsUsed: user?.freeTrialChatsUsed || 0,
        walletBalance,
        lockedBalance: user?.wallet?.lockedBalance || 0,
        isWalletLow,
      },
    });
  } catch (error: any) {
    console.error("GET /api/dashboard-content error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
