import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { key: "DASHBOARD_OFFERS" }
    });
    
    let offers = [];
    if (config) {
      try {
        offers = JSON.parse(config.value);
      } catch (e) {
        offers = [];
      }
    }
    
    return NextResponse.json({ offers });
  } catch (error: any) {
    console.error("GET /api/admin/offers error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
    if (!auth.authorized) return auth.response!;

    const { offers } = await req.json();
    
    if (!Array.isArray(offers)) {
      return NextResponse.json({ error: "Offers must be an array" }, { status: 400 });
    }

    const config = await prisma.platformConfig.upsert({
      where: { key: "DASHBOARD_OFFERS" },
      update: { value: JSON.stringify(offers) },
      create: { 
        key: "DASHBOARD_OFFERS", 
        value: JSON.stringify(offers),
        description: "Dynamic offers displayed on the student dashboard",
        type: "json"
      }
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: "UPDATE_OFFERS_AND_BANNERS",
          targetId: "DASHBOARD_OFFERS",
          details: `Updated ${offers.length} active dashboard banner/offer items`,
        },
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    return NextResponse.json({ success: true, offers: JSON.parse(config.value) });
  } catch (error: any) {
    console.error("POST /api/admin/offers error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
