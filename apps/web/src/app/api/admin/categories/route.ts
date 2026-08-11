import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"] });
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const config = await prisma.platformConfig.findUnique({
      where: { key: "DASHBOARD_CATEGORIES" }
    });
    
    let categories = [];
    if (config) {
      try {
        categories = JSON.parse(config.value);
      } catch (e) {
        categories = [];
      }
    }
    
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const { categories } = await req.json();
    
    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: "Categories must be an array" }, { status: 400 });
    }

    const config = await prisma.platformConfig.upsert({
      where: { key: "DASHBOARD_CATEGORIES" },
      update: { value: JSON.stringify(categories) },
      create: { 
        key: "DASHBOARD_CATEGORIES", 
        value: JSON.stringify(categories),
        description: "Dynamic categories displayed on the student dashboard",
        type: "json"
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: "UPDATE_CATEGORIES",
        details: `Updated dashboard categories count: ${categories.length}`,
      },
    });

    return NextResponse.json({ success: true, categories: JSON.parse(config.value) });
  } catch (error: any) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
