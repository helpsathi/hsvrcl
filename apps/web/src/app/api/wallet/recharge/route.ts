import { NextResponse } from "next/server";

export async function POST() {
  // This endpoint has been disabled for security reasons.
  // Recharges should only be processed via Razorpay webhooks.
  return NextResponse.json({ error: "Endpoint disabled" }, { status: 404 });
}
