import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getSession } from "@/lib/auth";

/**
 * GET /api/auth/google-calendar/connect
 * Generates a Google OAuth URL for mentors to authorize Calendar access.
 * The mentor is redirected to Google to grant permission.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized. Only mentors can connect Google Calendar." }, { status: 401 });
  }

  const clientId = process.env.MEET_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.MEET_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google-calendar/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google OAuth not configured on the server." }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",       // Gets a refresh_token so we can act on behalf of the mentor anytime
    prompt: "consent",            // Forces consent screen so refresh_token is always returned
    scope: [
      "https://www.googleapis.com/auth/calendar.events", // Create/manage calendar events
      "https://www.googleapis.com/auth/userinfo.email",  // Read email to verify account
    ],
    // Pass the mentor userId as state so we can identify them in the callback
    state: session.userId,
  });

  return NextResponse.redirect(authUrl);
}
