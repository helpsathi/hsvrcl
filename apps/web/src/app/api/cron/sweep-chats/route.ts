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
      },
    });

    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const secret = process.env.INTERNAL_API_SECRET || "";

    let sweptCount = 0;
    const now = Date.now();
    const maxFreeMins = await getPlatformConfigNumber(CONFIG_KEYS.FREE_TRIAL_MAX_MINUTES);

    for (const session of activeSessions) {
      let shouldEnd = false;

      if (!session.firstMessageTime) {
        // If session was created > 30 mins ago and never had a single message from mentor
        const createdMs = now - session.createdAt.getTime();
        if (createdMs > 30 * 60 * 1000) {
          shouldEnd = true;
        }
      } else {
        const elapsedMs = now - session.firstMessageTime.getTime();
        const elapsedMinutes = Math.floor(elapsedMs / 60000);

        // Cap maximum single chat duration at 12 hours (720 mins) as a failsafe against orphaned sessions
        if (elapsedMinutes >= 720) {
          shouldEnd = true;
        } else {
          // Check if cost has exceeded available wallet balance
          const cost = session.isFreeTrial
            ? Math.max(0, (elapsedMinutes - maxFreeMins) * session.perMinuteRate)
            : elapsedMinutes * session.perMinuteRate;
          const balance = session.student.wallet?.balance || 0;
          if (cost > balance) {
            shouldEnd = true;
          }
        }
      }

      if (shouldEnd && secret) {
        try {
          await fetch(`${apiUrl}/api/chats/${session.id}/end`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": secret,
            },
          });
          sweptCount++;
        } catch (err) {
          console.error(`Failed to sweep chat ${session.id}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true, activeChecked: activeSessions.length, sweptCount });
  } catch (error: any) {
    console.error("Cron sweep-chats error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export const POST = GET;
