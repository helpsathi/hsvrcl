import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const internalSecret = req.headers.get("x-internal-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!process.env.INTERNAL_API_SECRET || (internalSecret !== process.env.INTERNAL_API_SECRET && internalSecret !== process.env.CRON_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const result = await prisma.subscription.updateMany({
      where: {
        isActive: true,
        endDate: { lte: now }
      },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, expiredCount: result.count });
  } catch (error: any) {
    console.error("Subscription cleanup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
