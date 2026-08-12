import { prisma } from "@/lib/prisma";

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: string; // e.g., "BOOKING", "PROPOSAL_ACCEPTED", "PAYMENT", "REVIEW", "CHAT", "PAYOUT", "ACCOUNT"
  link?: string; // e.g., "/mentor-dashboard", "/wallet", "/chats/123"
  targetRole?: string;
}

/**
 * Dispatches a notification by simultaneously persisting it in PostgreSQL via Prisma
 * and triggering instantaneous real-time delivery + browser push + email via the Socket server.
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

    // 2. Dispatch real-time web socket event asynchronously (Render handles Web Push and Email)
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

    return notification;
  } catch (error) {
    console.error("dispatchNotification persistence failed:", error);
    return null;
  }
}

