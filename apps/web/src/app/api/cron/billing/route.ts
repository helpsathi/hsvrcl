import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformConfigNumber, CONFIG_KEYS } from "@/lib/config";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = !!process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET;
  const isCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron && !isInternal && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeSessions = await prisma.chatSession.findMany({
      where: { status: "ACTIVE" },
      include: { 
        student: { include: { wallet: true } }, 
        mentor: { include: { wallet: true } } 
      }
    });

    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const secret = process.env.INTERNAL_API_SECRET || "";
    let autoEndedCount = 0;

    for (const session of activeSessions) {
      if (!session.firstMessageTime) continue;
      
      // Calculate active duration
      const durationMs = Date.now() - session.firstMessageTime.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);

      let currentCost = durationMinutes * session.perMinuteRate;
      if (session.isFreeTrial) {
        const maxFreeMins = await getPlatformConfigNumber(CONFIG_KEYS.FREE_TRIAL_MAX_MINUTES);
        const billableMinutes = Math.max(0, durationMinutes - maxFreeMins);
        currentCost = billableMinutes * session.perMinuteRate;
      }

      const studentBalance = session.student.wallet?.balance || 0;

      // If student cannot afford the NEXT minute, end the session now
      if (studentBalance < (currentCost + session.perMinuteRate)) {
        if (secret) {
          try {
            await fetch(`${apiUrl}/api/chats/${session.id}/end`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-internal-secret": secret,
              },
            });
            autoEndedCount++;
          } catch (err) {
            console.error(`Failed to billing-end chat ${session.id}:`, err);
          }
        }
      }
    }

    return NextResponse.json({ success: true, autoEndedCount });
  } catch (error: any) {
    console.error("Cron billing error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export const POST = GET;
