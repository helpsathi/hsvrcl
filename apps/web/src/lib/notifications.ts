import { prisma } from "@/lib/prisma";
import webPush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@helpsathi.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: string; // e.g., "BOOKING", "PROPOSAL_ACCEPTED", "PAYMENT", "REVIEW", "CHAT", "PAYOUT", "ACCOUNT"
  link?: string; // e.g., "/mentor-dashboard", "/wallet", "/chats/123"
  targetRole?: string;
}

/**
 * Dispatches Web Push notification to user's registered browser endpoints.
 */
export async function sendWebPush(
  userId: string,
  title: string,
  body: string,
  url = "/dashboard",
  tag = "notification"
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV WEB PUSH SINK] To User: ${userId} | Title: ${title} | Body: ${body}`);
    }
    return;
  }

  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) return;

    const payload = JSON.stringify({ title, body, url, tag });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
        } catch (error: any) {
          // If 410 Gone or 404 Not Found, subscription has expired or been revoked
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            console.error("Failed to send Web Push to subscription endpoint:", error);
          }
        }
      })
    );
  } catch (err) {
    console.error("sendWebPush helper error:", err);
  }
}

/**
 * Dispatches a transactional email alert via Resend/SendGrid API or falls back to development sink logging.
 */
export async function sendEmailNotification(email: string, subject: string, htmlContent: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV EMAIL SINK] To: ${email} | Subject: ${subject}`);
    }
    return false;
  }

  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "HelpSathi <noreply@helpsathi.com>",
          to: [email],
          subject,
          html: htmlContent,
        }),
      });
      return res.ok;
    } else if (process.env.SENDGRID_API_KEY) {
      const rawFrom = process.env.EMAIL_FROM || "HelpSathi <noreply@helpsathi.com>";
      const emailMatch = rawFrom.match(/<(.+)>/);
      const fromEmail = emailMatch ? emailMatch[1] : rawFrom;
      const fromName = emailMatch ? rawFrom.split("<")[0].trim() : "HelpSathi";

      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: fromEmail, name: fromName },
          subject,
          content: [{ type: "text/html", value: htmlContent }],
        }),
      });
      return res.ok;
    }
    return true;
  } catch (error) {
    console.error("Email dispatch failed:", error);
    return false;
  }
}

/**
 * Dispatches a notification by simultaneously persisting it in PostgreSQL via Prisma
 * and triggering instantaneous real-time delivery + browser push via the Socket server & Web Push.
 * Anti-flood debouncing is automatically enforced on real-time delivery.
 */
export async function dispatchNotification({
  userId,
  title,
  message,
  type = "GENERAL",
  link = "/notifications",
  targetRole = undefined
}: NotificationPayload): Promise<any> {
  try {
    // 1. Persist notification in Prisma for 100% accurate audit log & inbox history
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
        targetRole: targetRole || null,
        isRead: false,
      },
    });

    // 2. Dispatch real-time web socket event asynchronously without blocking API response
    const socketServerUrl = process.env.SOCKET_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    try {
      fetch(`${socketServerUrl}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
        },
        body: JSON.stringify({
          id: notification.id,
          userId,
          title,
          message,
          type,
          link,
        }),
      }).catch((e) => console.error("Non-blocking real-time push dispatch error:", e));
    } catch (pushError) {
      console.error("Socket notify call failed:", pushError);
    }

    // 3. Dispatch Web Push notification directly to subscribed devices/browsers
    sendWebPush(userId, title, message, link, type).catch((err) =>
      console.error("Web Push helper trigger failed:", err)
    );

    // 4. Dispatch transactional email alert asynchronously for high-priority notification types if configured
    if (["BOOKING", "PAYMENT", "PAYOUT", "ACCOUNT"].includes(type)) {
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
        .then((u) => {
          if (u?.email) {
            sendEmailNotification(
              u.email,
              `${title} | HelpSathi Notification`,
              `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #4338ca;">${title}</h2>
                <p style="font-size: 16px; color: #333;">Hello ${u.name || "User"},</p>
                <p style="font-size: 16px; color: #555;">${message}</p>
                <div style="margin: 25px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://helpsathi.com"}${link}" style="background: #4338ca; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888;">Thank you for using HelpSathi. If you did not expect this message, please check your account settings.</p>
              </div>`
            ).catch(err => console.error("Email helper trigger failed:", err));
          }
        })
        .catch((e) => console.error("Failed user fetch for email notification:", e));
    }

    return notification;
  } catch (error) {
    console.error("dispatchNotification persistence failed:", error);
    return null;
  }
}
