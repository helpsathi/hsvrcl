import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateUsernameSyntax } from "@/lib/username";
import { usernameRateLimiter } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { available: false, error: "Authentication required to check username availability." },
        { status: 401, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    // Identify requestor by user ID or IP for rate limiting defense against DoS and scraping
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown-ip";
    const rateLimitKey = `username_check_${session.userId || clientIp}`;
    const rateStatus = usernameRateLimiter.check(rateLimitKey);

    if (!rateStatus.success) {
      return NextResponse.json(
        { available: false, error: "Too many username check requests. Please pause and wait a minute." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateStatus.reset - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": rateStatus.limit.toString(),
            "X-RateLimit-Remaining": rateStatus.remaining.toString(),
            "Cache-Control": "no-store, private",
          },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username");
    const currentMentorId = searchParams.get("currentMentorId");

    if (!rawUsername) {
      return NextResponse.json(
        { available: false, error: "Username is required" },
        { status: 400, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    // ReDoS and Memory Protection: Immediately reject excessively long payload strings
    if (rawUsername.length > 50) {
      return NextResponse.json(
        { available: false, error: "Username query string exceeds maximum allowable length." },
        { status: 400, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    const username = rawUsername.trim().toLowerCase();
    const validation = validateUsernameSyntax(username);

    if (!validation.isValid) {
      return NextResponse.json(
        { available: false, error: validation.error || "Invalid username format" },
        { status: 200, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    // Fast O(log N) lookup leveraging B-Tree unique index on username column
    const existing = await prisma.mentorProfile.findUnique({
      where: { username },
      select: { id: true, userId: true },
    });

    if (existing) {
      if (existing.userId === session.userId || (currentMentorId && (existing.id === currentMentorId || existing.userId === currentMentorId))) {
        return NextResponse.json(
          { available: true, message: "This is your current username." },
          { status: 200, headers: { "Cache-Control": "no-store, private" } }
        );
      }
      return NextResponse.json(
        { available: false, error: "Username is already taken by another mentor." },
        { status: 200, headers: { "Cache-Control": "no-store, private" } }
      );
    }

    return NextResponse.json(
      { available: true },
      { status: 200, headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (error: any) {
    console.error("Check Username Error:", error);
    return NextResponse.json(
      { available: false, error: "Server error checking availability." },
      { status: 500, headers: { "Cache-Control": "no-store, private" } }
    );
  }
}
