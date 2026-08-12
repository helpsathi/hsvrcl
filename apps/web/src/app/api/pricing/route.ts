import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformConfigNumber, getPlatformConfigBoolean, CONFIG_KEYS } from "@/lib/config";

export const revalidate = 3600; // Cache on Vercel Data Cache for 1 hour

export async function GET() {
  try {
    const [
      defaultMonthlyPrice,
      defaultPerMinutePrice,
      defaultCallPrice,
      freeTrialEnabled,
      freeTrialMaxChats,
      freeTrialMaxMinutes,
      minWalletRecharge,
      approvedMentors,
    ] = await Promise.all([
      getPlatformConfigNumber(CONFIG_KEYS.DEFAULT_MONTHLY_PRICE),
      getPlatformConfigNumber(CONFIG_KEYS.DEFAULT_PER_MINUTE_PRICE),
      getPlatformConfigNumber(CONFIG_KEYS.DEFAULT_CALL_PRICE),
      getPlatformConfigBoolean(CONFIG_KEYS.FREE_TRIAL_ENABLED),
      getPlatformConfigNumber(CONFIG_KEYS.FREE_TRIAL_MAX_CHATS),
      getPlatformConfigNumber(CONFIG_KEYS.FREE_TRIAL_MAX_MINUTES),
      getPlatformConfigNumber(CONFIG_KEYS.MIN_WALLET_RECHARGE),
      prisma.mentorProfile.findMany({
        where: {
          status: "APPROVED",
          user: {
            isBanned: false,
            isSuspended: false,
            deletedAt: null,
          },
        },
        select: {
          perMinutePrice: true,
          callPricePerMinute: true,
          monthlyPrice: true,
          categories: true,
          freeTrial: true,
        },
      }),
    ]);

    // Calculate aggregated mentor stats
    let minChatPrice = defaultPerMinutePrice || 10;
    let maxChatPrice = 50;
    let avgChatPrice = defaultPerMinutePrice || 15;

    let minCallPrice = defaultCallPrice || 10;
    let maxCallPrice = 50;
    let avgCallPrice = defaultCallPrice || 15;

    let minMonthlyPrice = defaultMonthlyPrice || 499;
    let maxMonthlyPrice = 4999;
    let avgMonthlyPrice = defaultMonthlyPrice || 1000;

    const categoryMap: Record<string, { minChat: number; minMonthly: number; mentorCount: number }> = {};

    if (approvedMentors.length > 0) {
      const chatPrices = approvedMentors.map(m => m.perMinutePrice || 15).filter(p => p > 0);
      const callPrices = approvedMentors.map(m => m.callPricePerMinute || 15).filter(p => p > 0);
      const monthlyPrices = approvedMentors.map(m => m.monthlyPrice || 1000).filter(p => p > 0);

      if (chatPrices.length > 0) {
        minChatPrice = Math.min(...chatPrices);
        maxChatPrice = Math.max(...chatPrices);
        avgChatPrice = Math.round(chatPrices.reduce((a, b) => a + b, 0) / chatPrices.length);
      }

      if (callPrices.length > 0) {
        minCallPrice = Math.min(...callPrices);
        maxCallPrice = Math.max(...callPrices);
        avgCallPrice = Math.round(callPrices.reduce((a, b) => a + b, 0) / callPrices.length);
      }

      if (monthlyPrices.length > 0) {
        minMonthlyPrice = Math.min(...monthlyPrices);
        maxMonthlyPrice = Math.max(...monthlyPrices);
        avgMonthlyPrice = Math.round(monthlyPrices.reduce((a, b) => a + b, 0) / monthlyPrices.length);
      }

      // Group by categories
      for (const mentor of approvedMentors) {
        const cats = mentor.categories || [];
        for (const cat of cats) {
          const trimmed = cat.trim();
          if (!trimmed) continue;
          if (!categoryMap[trimmed]) {
            categoryMap[trimmed] = {
              minChat: mentor.perMinutePrice || 10,
              minMonthly: mentor.monthlyPrice || 499,
              mentorCount: 0,
            };
          }
          categoryMap[trimmed].mentorCount += 1;
          if (mentor.perMinutePrice && mentor.perMinutePrice < categoryMap[trimmed].minChat) {
            categoryMap[trimmed].minChat = mentor.perMinutePrice;
          }
          if (mentor.monthlyPrice && mentor.monthlyPrice > 0 && mentor.monthlyPrice < categoryMap[trimmed].minMonthly) {
            categoryMap[trimmed].minMonthly = mentor.monthlyPrice;
          }
        }
      }
    }

    const categoryList = Object.entries(categoryMap).map(([name, stats]) => ({
      name,
      minChat: stats.minChat,
      minMonthly: stats.minMonthly,
      mentorCount: stats.mentorCount,
    }));

    return NextResponse.json({
      success: true,
      pricing: {
        minChatPrice,
        maxChatPrice,
        avgChatPrice,
        minCallPrice,
        maxCallPrice,
        avgCallPrice,
        minMonthlyPrice,
        maxMonthlyPrice,
        avgMonthlyPrice,
        totalMentors: approvedMentors.length,
        freeTrialEnabled: freeTrialEnabled !== false,
        freeTrialMaxChats: freeTrialMaxChats || 3,
        freeTrialMaxMinutes: freeTrialMaxMinutes || 5,
        minWalletRecharge: minWalletRecharge || 100,
        categories: categoryList,
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    console.error("GET /api/pricing error:", error);
    return NextResponse.json({
      success: true,
      pricing: {
        minChatPrice: 10,
        maxChatPrice: 40,
        avgChatPrice: 15,
        minCallPrice: 10,
        maxCallPrice: 40,
        avgCallPrice: 15,
        minMonthlyPrice: 499,
        maxMonthlyPrice: 3999,
        avgMonthlyPrice: 1000,
        totalMentors: 0,
        freeTrialEnabled: true,
        freeTrialMaxChats: 3,
        freeTrialMaxMinutes: 5,
        minWalletRecharge: 100,
        categories: [],
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  }
}
