import { google } from "googleapis";

interface CreateMeetEventOptions {
  title: string;
  description?: string;
  startTime: Date;
  durationMinutes: number;
  attendeeEmails?: (string | null | undefined)[];
}

interface MeetEventResult {
  meetLink: string;
  eventId?: string;
}

/**
 * Helper to get an authenticated OAuth2 client for Google Calendar API.
 * Uses the mentor's specific refresh token if provided, otherwise falls back to system env vars.
 */
export function getOAuthClient(specificRefreshToken?: string) {
  const clientId = process.env.MEET_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.MEET_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  
  // Use the mentor's token if passed in, else fall back to the central HelpSathi token
  const refreshToken = specificRefreshToken || process.env.MEET_GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn(
      "[Google Calendar] Missing OAuth credentials (GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN) in environment variables or user profile."
    );
    return null;
  }

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    return auth;
  } catch (err) {
    console.error("[Google Calendar] Failed to initialize OAuth2 Client:", err);
    return null;
  }
}

export async function createGoogleMeetEvent({
  title,
  description,
  startTime,
  durationMinutes,
  attendeeEmails = [],
  mentorRefreshToken, // Add this optional param
}: CreateMeetEventOptions & { mentorRefreshToken?: string | null }): Promise<MeetEventResult> {
  const auth = getOAuthClient(mentorRefreshToken || undefined);

  if (!auth) {
    throw new Error(
      "Google Meet OAuth credentials missing or not configured. Please authorize Google Calendar access to generate Google Meet links."
    );
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const requestId = `helpsathi-${crypto.randomUUID()}`;

    // Clean attendee emails list and mark them pre-accepted so Google Meet allows direct entry
    const validAttendees = attendeeEmails
      .filter((email): email is string => typeof email === "string" && email.includes("@"))
      .map((email) => ({ email, responseStatus: "accepted" }));

    const baseDescription = description || "HelpSathi Mentorship & Consultation Video Call.";
    const mentorInstruction = "\n\nIMPORTANT FOR MENTORS: Please admit the student into the meeting if they ask to join (knock), as they may be using a different Google account.";
    
    const eventBody = {
      summary: title,
      description: baseDescription + mentorInstruction,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      attendees: validAttendees,
      guestsCanSeeOtherGuests: true,
      guestsCanInviteOthers: true,
      guestsCanModify: false,
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: validAttendees.length > 0 ? "all" : "none", // Sends formal calendar invites to all attendees
      requestBody: eventBody,
    });

    const hangoutLink = response.data.hangoutLink;
    const eventId = response.data.id || undefined;

    if (!hangoutLink) {
      throw new Error("Google Calendar API succeeded but did not return a valid Google Meet hangout link.");
    }

    console.log(
      `[Google Calendar] Successfully generated real Google Meet: ${hangoutLink} (Event ID: ${eventId})`
    );
    return { meetLink: hangoutLink, eventId };
  } catch (error: any) {
    console.error("[Google Calendar Error] Failed to create Google Meet event:", error.message || error);
    throw new Error(
      `Google Meet Creation Failed: ${error.message || "Invalid or expired Google OAuth authorization (invalid_grant). Please re-authorize Google Calendar."}`
    );
  }
}

/**
 * Deletes an existing Google Calendar event when a meeting is cancelled or rejected.
 */
export async function deleteGoogleMeetEvent(eventId?: string | null, mentorRefreshToken?: string | null): Promise<boolean> {
  if (!eventId) return false;
  try {
    const auth = getOAuthClient(mentorRefreshToken || undefined);
    if (!auth) return false;

    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
      sendUpdates: "all", // Notify attendees of cancellation
    });
    console.log(`[Google Calendar] Successfully cancelled event ID: ${eventId}`);
    return true;
  } catch (error: any) {
    console.error(`[Google Calendar Error] Failed to delete event ${eventId}:`, error.message || error);
    return false;
  }
}
