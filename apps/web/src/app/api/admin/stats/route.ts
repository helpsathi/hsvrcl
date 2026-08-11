import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR", "FINANCE"] });
    if (!auth.authorized) return auth.response!;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel aggregations for performance
    const [
      totalUsers,
      totalMentors,
      totalRevenueAggr,
      subRevenueAggr,
      chatRevenueAggr,
      mentorEarningsAggr,
      dailyRevenueAggr,
      monthlyRevenueAggr,
      activeChats,
      pendingMentors,
      recentUsers,
      recentApplications,
      commissionRate,
      activeSubscriptions,
      pendingWithdrawalsAggr,
      scheduledCallsCount,
      recentTransactions,
      recentSignups
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "MENTOR" } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "CREDIT", description: { contains: "Recharge", mode: "insensitive" } } // Accurate total deposit revenue calculation
      }),
      prisma.subscription.aggregate({
        _sum: { price: true }
      }),
      prisma.chatSession.aggregate({
        _sum: { totalCharge: true },
        where: { status: "COMPLETED" }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "CREDIT",
          OR: [
            { description: { contains: "Earning", mode: "insensitive" } },
            { description: { contains: "earnings", mode: "insensitive" } }
          ]
        }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "CREDIT",
          description: { contains: "Recharge", mode: "insensitive" },
          createdAt: { gte: startOfDay }
        }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "CREDIT",
          description: { contains: "Recharge", mode: "insensitive" },
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.chatSession.count({ where: { status: "ACTIVE" } }),
      prisma.mentorProfile.count({ where: { status: "PENDING" } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true }
      }),
      prisma.mentorProfile.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true, avatar: true } } }
      }),
      getPlatformConfigNumber(CONFIG_KEYS.PLATFORM_COMMISSION_RATE),
      prisma.subscription.count({ where: { isActive: true, endDate: { gt: now } } }),
      prisma.withdrawalRequest.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "PENDING" }
      }),
      prisma.scheduledChat.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
      // 7-day time series queries
      prisma.transaction.findMany({
        where: {
          type: "CREDIT",
          description: { contains: "Recharge", mode: "insensitive" },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: { amount: true, createdAt: true }
      }),
      prisma.user.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: { role: true, createdAt: true }
      })
    ]);

    const subRevenue = subRevenueAggr._sum.price || 0;
    const chatRevenue = chatRevenueAggr._sum.totalCharge || 0;
    const mentorEarnings = mentorEarningsAggr._sum.amount || 0;
    const commissionRevenue = Math.max(0, Math.round((subRevenue + chatRevenue - mentorEarnings) * 100) / 100);

    // Compute 7-day trend series
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      const dayRevenue = recentTransactions
        .filter((t) => t.createdAt.toISOString().split("T")[0] === dayStr)
        .reduce((sum, t) => sum + t.amount, 0);

      const daySignups = recentSignups
        .filter((u) => u.createdAt.toISOString().split("T")[0] === dayStr).length;

      trendData.push({
        date: dayStr,
        day: dayName,
        revenue: Math.round(dayRevenue),
        users: daySignups,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        adminName: session?.name || "Admin",
        totalUsers,
        totalMentors,
        totalRevenue: totalRevenueAggr._sum.amount || 0,
        subscriptionRevenue: subRevenue,
        chatRevenue,
        commissionRevenue,
        dailyRevenue: dailyRevenueAggr._sum.amount || 0,
        monthlyRevenue: monthlyRevenueAggr._sum.amount || 0,
        activeChats,
        pendingMentors,
        commissionRate,
        activeSubscriptions,
        pendingWithdrawalsCount: pendingWithdrawalsAggr._count || 0,
        pendingWithdrawalsAmount: pendingWithdrawalsAggr._sum.amount || 0,
        scheduledCallsCount,
        recentUsers,
        recentApplications,
        trendData
      }
    });

  } catch (error: any) {
    console.error("Fetch Admin Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
