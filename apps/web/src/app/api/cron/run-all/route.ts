import { NextResponse } from "next/server";

// Import all cron handlers
import { POST as syncScheduledCalls } from "../../scheduled-calls/sync/route";
import { POST as cleanupSubscriptions } from "../../subscriptions/cleanup/route";
import { GET as approveReviews } from "../approve-reviews/route";
import { GET as sweepChats } from "../sweep-chats/route";
import { GET as billing } from "../billing/route";
import { GET as subscriptionsRenew } from "../subscriptions-renew/route";
import { GET as purgeExpiredChats } from "../purge-expired-chats/route";
import { GET as scheduledMessages } from "../scheduled-messages/route";

export const maxDuration = 300; // Allow maximum time on hobby tier since it runs many tasks

export async function POST(req: Request) {
  const internalSecret = req.headers.get("x-internal-secret");
  const authHeader = req.headers.get("authorization");

  if (!process.env.INTERNAL_API_SECRET || (internalSecret !== process.env.INTERNAL_API_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create a synthetic request to pass to the handlers
  // We attach the secrets so they pass their own internal auth checks
  const createSyntheticRequest = (method: string) => {
    return new Request(req.url, {
      method,
      headers: {
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
        "authorization": `Bearer ${process.env.CRON_SECRET || ""}`
      }
    });
  };

  try {
    // Run all background jobs concurrently to maximize efficiency
    // We use Promise.allSettled so if one fails, the others still complete
    const results = await Promise.allSettled([
      syncScheduledCalls(createSyntheticRequest("POST")),
      cleanupSubscriptions(createSyntheticRequest("POST")),
      approveReviews(createSyntheticRequest("GET")),
      sweepChats(createSyntheticRequest("GET")),
      billing(createSyntheticRequest("GET")),
      subscriptionsRenew(createSyntheticRequest("GET")),
      purgeExpiredChats(createSyntheticRequest("GET")),
      scheduledMessages(createSyntheticRequest("GET")),
    ]);

    const failed = results.filter(r => r.status === "rejected");
    if (failed.length > 0) {
      console.error(`[Cron Run-All] ${failed.length} tasks failed`, failed);
    }

    return NextResponse.json({
      success: true,
      message: `Executed 8 background tasks. ${results.length - failed.length} succeeded, ${failed.length} failed.`
    });
  } catch (err: any) {
    console.error("[Cron Run-All] Master execution error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
