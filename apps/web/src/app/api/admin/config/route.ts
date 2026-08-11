import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedPlatformConfigs } from "@/lib/config";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    await seedPlatformConfigs();
    const configs = await prisma.platformConfig.findMany({
      orderBy: { key: "asc" }
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("GET /api/admin/config error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const body = await req.json();

    // Handle batch update: { configs: [{ key, value, description }] }
    if (body.configs && Array.isArray(body.configs)) {
      const updated = [];
      for (const item of body.configs) {
        if (item.key && item.value !== undefined) {
          const cfg = await prisma.platformConfig.upsert({
            where: { key: item.key },
            update: {
              value: String(item.value),
              description: item.description ?? undefined
            },
            create: {
              key: item.key,
              value: String(item.value),
              description: item.description ?? "",
            }
          });
          updated.push(cfg);
        }
      }

      try {
        await prisma.auditLog.create({
          data: {
            userId: session!.userId,
            action: "BATCH_UPDATE_PLATFORM_CONFIGS",
            targetId: "SYSTEM",
            details: `Batch updated ${updated.length} platform configuration values`,
          },
        });
      } catch (e) {
        console.error("Failed to write audit log:", e);
      }

      return NextResponse.json({ success: true, configs: updated });
    }

    // Handle single key update: { key, value }
    const { key, value, description } = body;
    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value required" }, { status: 400 });
    }

    const config = await prisma.platformConfig.upsert({
      where: { key },
      update: {
        value: String(value),
        description: description ?? undefined
      },
      create: {
        key,
        value: String(value),
        description: description ?? "",
      }
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: "UPDATE_PLATFORM_CONFIG",
          targetId: key,
          details: `Updated platform configuration: ${key} = ${String(value)}`,
        },
      });
    } catch (e) {
      console.error("Failed to write audit log:", e);
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("POST /api/admin/config error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
