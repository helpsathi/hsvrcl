import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/google-calendar/callback
 * Google redirects back here after the mentor grants permission.
 * We exchange the authorization code for tokens and save the refresh_token to the DB.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const mentorUserId = searchParams.get("state"); // We passed userId as state
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const mentorDashboardUrl = `${appUrl}/mentor-dashboard`;

  if (error || !code || !mentorUserId) {
    console.error("[Google Calendar Callback] Error or missing params:", { error, code: !!code, mentorUserId });
    return NextResponse.redirect(`${mentorDashboardUrl}?google_calendar=error`);
  }

  const clientId = process.env.MEET_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.MEET_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google-calendar/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${mentorDashboardUrl}?google_calendar=error`);
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Exchange the one-time code for access + refresh tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      // This can happen if the user already authorized before and didn't revoke.
      // In that case, we can't get a new refresh token. Ask them to disconnect & reconnect.
      console.warn("[Google Calendar Callback] No refresh_token received. User may need to revoke access at accounts.google.com and reconnect.");
      return NextResponse.redirect(`${mentorDashboardUrl}?google_calendar=no_refresh_token`);
    }

    // Find this mentor's profile and save the refresh token
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
    });

    if (!mentorProfile) {
      console.error("[Google Calendar Callback] No mentor profile found for userId:", mentorUserId);
      return NextResponse.redirect(`${mentorDashboardUrl}?google_calendar=error`);
    }

    await prisma.mentorProfile.update({
      where: { userId: mentorUserId },
      data: {
        // @ts-ignore: fields were just added to schema
        googleCalendarRefreshToken: tokens.refresh_token,
        googleCalendarConnected: true,
      },
    });

    console.log(`[Google Calendar Callback] Successfully connected Google Calendar for mentor: ${mentorUserId}`);
    return NextResponse.redirect(`${mentorDashboardUrl}?google_calendar=connected`);
  } catch (err: any) {
    console.error("[Google Calendar Callback] Token exchange failed:", err.message);
    return NextResponse.redirect(`${mentorDashboardUrl}?google_calendar=error`);
  }
}
