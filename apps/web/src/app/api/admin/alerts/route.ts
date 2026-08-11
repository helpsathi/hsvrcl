import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, {
      requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"],
    });
    if (!auth.authorized) return auth.response!;

    const issues: Array<{
      id: string;
      title: string;
      message: string;
      link?: string;
      severity: "warning" | "error" | "info";
      createdAt?: string;
    }> = [];

    //Check Dashboard Categories
    try {
      const catConfig = await prisma.platformConfig.findUnique({
        where: { key: "DASHBOARD_CATEGORIES" },
      });
      let categories: any[] = [];
      if (catConfig) {
        try {
          categories = JSON.parse(catConfig.value);
        } catch (e) {
          categories = [];
        }
      }
      if (!Array.isArray(categories) || categories.length === 0) {
        issues.push({
          id: "CATEGORIES_EMPTY",
          title: "⚠️ Dashboard Categories Empty or Unconfigured",
          message: "The student dashboard category selection currently has 0 active items or failed to sync.",
          link: "/admin/categories",
          severity: "warning",
          createdAt: new Date().toISOString(),
        });

        // Ensure notification alert exists in database for Admin Notifications section
        const existingAlert = await prisma.notification.findFirst({
          where: {
            title: { contains: "Categories Empty" },
            isRead: false,
            targetRole: "ADMIN",
          },
        });
        if (!existingAlert) {
          await prisma.notification.create({
            data: {
              title: "⚠️ System Alert: Categories Empty",
              message: "Student dashboard categories are currently unconfigured or failed to load.",
              type: "SYSTEM_ALERT",
              targetRole: "ADMIN",
              link: "/admin/categories",
              isRead: false,
            },
          }).catch(() => {}); // silently catch if concurrent write
        }
      } else {
        // Auto-resolve any prior Categories alerts if categories exist now
        await prisma.notification.updateMany({
          where: {
            title: { contains: "Categories Empty" },
            isRead: false,
          },
          data: { isRead: true },
        }).catch(() => {});
      }
    } catch (err: any) {
      issues.push({
        id: "DATABASE_CATEGORIES_ERROR",
        title: "❌ Database Error Reading Categories",
        message: err?.message || "Failed to communicate with database for Categories.",
        link: "/admin/categories",
        severity: "error",
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Check Dashboard Offers
    try {
      const offerConfig = await prisma.platformConfig.findUnique({
        where: { key: "DASHBOARD_OFFERS" },
      });
      let offers: any[] = [];
      if (offerConfig) {
        try {
          offers = JSON.parse(offerConfig.value);
        } catch (e) {
          offers = [];
        }
      }
      if (!Array.isArray(offers) || offers.length === 0) {
        issues.push({
          id: "OFFERS_EMPTY",
          title: "⚠️ Promotional Banners / Offers Empty",
          message: "The student promotional banner card section currently has 0 active offers.",
          link: "/admin/offers",
          severity: "warning",
          createdAt: new Date().toISOString(),
        });

        const existingOfferAlert = await prisma.notification.findFirst({
          where: {
            title: { contains: "Offers Empty" },
            isRead: false,
            targetRole: "ADMIN",
          },
        });
        if (!existingOfferAlert) {
          await prisma.notification.create({
            data: {
              title: "⚠️ System Alert: Offers Empty",
              message: "Student dashboard banner offers are unconfigured or empty.",
              type: "SYSTEM_ALERT",
              targetRole: "ADMIN",
              link: "/admin/offers",
              isRead: false,
            },
          }).catch(() => {});
        }
      } else {
        // Auto-resolve any prior Offers alerts if offers exist now
        await prisma.notification.updateMany({
          where: {
            title: { contains: "Offers Empty" },
            isRead: false,
          },
          data: { isRead: true },
        }).catch(() => {});
      }
    } catch (err: any) {
      issues.push({
        id: "DATABASE_OFFERS_ERROR",
        title: "❌ Database Error Reading Offers",
        message: err?.message || "Failed to communicate with database for Offers.",
        link: "/admin/offers",
        severity: "error",
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Include any other active SYSTEM_ALERT notifications
    const activeSystemNotifs = await prisma.notification.findMany({
      where: {
        type: "SYSTEM_ALERT",
        isRead: false,
        targetRole: "ADMIN",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const notif of activeSystemNotifs) {
      // Don't duplicate if already added by exact check
      if (!issues.some((i) => i.title.includes(notif.title) || notif.title.includes(i.title.replace(/^[^\w]+/, "").trim()))) {
        issues.push({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          link: notif.link || undefined,
          severity: "warning",
          createdAt: notif.createdAt.toISOString(),
        });
      }
    }

    return NextResponse.json({
      status: issues.length === 0 ? "HEALTHY" : "ATTENTION",
      issues,
      totalActiveIssues: issues.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/alerts error:", error);
    return NextResponse.json({ error: "Server error executing health checks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, {
      requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"],
    });
    if (!auth.authorized) return auth.response!;

    const body = await req.json();
    const { action, alertId, errorDetails } = body;

    if (action === "RESOLVE") {
      if (alertId === "CATEGORIES_EMPTY" || alertId === "OFFERS_EMPTY" || alertId?.includes("_ERROR")) {
        const keyword = alertId === "CATEGORIES_EMPTY" ? "Categories" : alertId === "OFFERS_EMPTY" ? "Offers" : "Error";
        await prisma.notification.updateMany({
          where: {
            title: { contains: keyword },
            targetRole: "ADMIN",
            isRead: false,
          },
          data: { isRead: true },
        });
      } else if (alertId) {
        await prisma.notification.updateMany({
          where: { id: alertId },
          data: { isRead: true },
        });
      }
      return NextResponse.json({ success: true, message: "Alert marked as resolved." });
    }

    if (action === "LOG_ERROR" && errorDetails) {
      const existing = await prisma.notification.findFirst({
        where: { title: errorDetails.title, isRead: false, targetRole: "ADMIN" },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            title: errorDetails.title || "⚠️ System Alert",
            message: errorDetails.message || "An issue was detected requiring attention.",
            type: "SYSTEM_ALERT",
            targetRole: "ADMIN",
            link: errorDetails.link || null,
            isRead: false,
          },
        });
      }
      return NextResponse.json({ success: true, logged: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/admin/alerts error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
