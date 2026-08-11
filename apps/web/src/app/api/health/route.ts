import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("Database healthcheck ping failed:", err);
    dbStatus = "error";
  }

  const isHealthy = dbStatus === "ok";

  return NextResponse.json({
    status: isHealthy ? "ok" : "degraded",
    service: "web",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  }, { status: isHealthy ? 200 : 503 });
}