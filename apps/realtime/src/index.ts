import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { jwtVerify } from "jose";

dotenv.config();

const secretKey = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!secretKey || secretKey === "fallback_only_for_development_secret_do_not_use_in_prod")) {
  console.error("SECURITY WARNING: JWT_SECRET environment variable is missing or insecure in production mode!");
}

const JWT_SECRET = new TextEncoder().encode(
  secretKey || "dev_secret_only_for_local_testing_do_not_use_in_prod"
);

const app = express();
const frontendOriginRaw = process.env.FRONTEND_URL || 'http://localhost:3000';
const frontendOrigin = frontendOriginRaw.includes(',') 
  ? frontendOriginRaw.split(',').map(url => url.trim()) 
  : frontendOriginRaw;

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Fix: Allow all origins to bypass Render/Vercel CORS issues (secured via JWT)
    methods: ['GET', 'POST'],
  },
  pingInterval: 25000,
  pingTimeout: 60000, // Fix: Prevent Render proxy from dropping idle websocket connections
});

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX || 25), // Maximum concurrent connections in pool
      min: Number(process.env.PG_POOL_MIN || 1),  // Keep minimum idle clients ready
      idleTimeoutMillis: 30000,                   // Close clients after 30 seconds of inactivity
      connectionTimeoutMillis: 25000,             // 25s timeout for Neon cold starts
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
  : null;

if (pool) {
  pool.on('error', (err: any) => {
    console.warn('Realtime PostgreSQL pool client error:', err?.message || err);
  });
}

const prisma = pool
  ? new PrismaClient({ adapter: new PrismaPg(pool) })
  : new PrismaClient();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'realtime' });
});

// Anti-Flood Debounce Tracker: userId -> category -> array of recent notification timestamps & items
interface RecentEvent {
  title: string;
  message: string;
  timestamp: number;
}
const recentUserEvents = new Map<string, Map<string, RecentEvent[]>>();

app.post('/notify', async (req, res) => {
  try {
    const internalSecret = req.headers['x-internal-secret'];
    if (!process.env.INTERNAL_API_SECRET || internalSecret !== process.env.INTERNAL_API_SECRET) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing internal secret" });
    }

    const { userId, title, message, type, link, id } = req.body;
    if (!userId || !title) {
      return res.status(400).json({ error: "Missing required fields: userId or title" });
    }

    const now = Date.now();
    const eventCategory = type || "GENERAL";

    if (!recentUserEvents.has(userId)) {
      recentUserEvents.set(userId, new Map());
    }
    const userCategoryMap = recentUserEvents.get(userId)!;
    if (!userCategoryMap.has(eventCategory)) {
      userCategoryMap.set(eventCategory, []);
    }

    const eventsList = userCategoryMap.get(eventCategory)!;
    // Keep only events within the last 120 seconds (2 minutes)
    const recentEvents = eventsList.filter(e => now - e.timestamp <= 120000);
    recentEvents.push({ title, message, timestamp: now });
    userCategoryMap.set(eventCategory, recentEvents);

    let finalTitle = title;
    let finalMessage = message;
    let isBatched = false;

    // Trigger Anti-Flood Smart Batching if > 2 events of the same type arrive in 2 minutes
    if (recentEvents.length > 2) {
      isBatched = true;
      if (eventCategory === "PROPOSAL_ACCEPTED" || eventCategory === "BOOKING") {
        finalTitle = "🔥 High Demand Alert";
        finalMessage = `${recentEvents.length} students have accepted or scheduled consultation sessions recently!`;
      } else if (eventCategory === "CHAT_MESSAGE" || eventCategory === "CHAT") {
        finalTitle = `💬 New Messages (${recentEvents.length})`;
        finalMessage = `You have ${recentEvents.length} new messages waiting in your conversations.`;
      } else {
        finalTitle = `📢 ${title} (+${recentEvents.length - 1} more)`;
        finalMessage = `Multiple updates received: ${message}`;
      }
    }

    const payload = {
      id: id || Date.now().toString(),
      title: finalTitle,
      message: finalMessage,
      type: eventCategory,
      link: link || "/notifications",
      createdAt: new Date().toISOString(),
      isBatched,
      batchCount: recentEvents.length
    };

    // Emit instantaneously to the user's private notification room
    io.to(`user_${userId}`).emit('global_notification', payload);
    console.log(`Delivered real-time notification to user_${userId} [Batched: ${isBatched}]`);

    return res.json({ success: true, batched: isBatched, payload });
  } catch (error) {
    console.error("Error running /notify endpoint:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Map to track active online users: userId -> Set of socketIds
const userSockets = new Map<string, Set<string>>();
const chatTimeouts = new Map<string, NodeJS.Timeout>();
const gracePeriodTimeouts = new Map<string, NodeJS.Timeout>();
const socketSessions = new Map<string, Set<string>>();

// Socket JWT Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      if (process.env.NODE_ENV === "production" && process.env.ENFORCE_SOCKET_AUTH !== "false") {
        return next(new Error("Authentication error: No token provided"));
      }
      return next();
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload && payload.userId) {
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
    }
    next();
  } catch (err) {
    if (process.env.NODE_ENV === "production" && process.env.ENFORCE_SOCKET_AUTH !== "false") {
      return next(new Error("Authentication error: Invalid token"));
    }
    next();
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} (Authenticated: ${Boolean(socket.data.userId)})`);

  // Register online user
  socket.on('user_online', async (userId: string) => {
    // S5 Fix: Prevent room spoofing. If socket is authenticated, strictly use socket.data.userId.
    if (socket.data.userId && socket.data.userId !== userId) {
      console.warn(`Socket ${socket.id} attempted room spoofing for user ${userId}. Using authenticated ID ${socket.data.userId} instead.`);
    }
    const targetUserId = socket.data.userId || (process.env.NODE_ENV !== "production" && process.env.ENFORCE_SOCKET_AUTH !== "true" ? userId : undefined);
    if (!targetUserId) return;
    let sockets = userSockets.get(targetUserId);
    if (!sockets) {
      sockets = new Set<string>();
      userSockets.set(targetUserId, sockets);
    }
    sockets.add(socket.id);
    socket.join(`user_${targetUserId}`); // Join a private room for global notifications
    
    // If user is a mentor, update online status using targetUserId
    try {
      await prisma.mentorProfile.updateMany({
        where: { userId: targetUserId },
        data: { isOnline: true },
      });
      io.emit('presence_change', { userId: targetUserId, isOnline: true });
    } catch (e) {
      console.error('Error updating mentor online status:', e);
    }
  });

  // Join Chat Session Room
  socket.on('join_session', async (sessionId: string) => {
    socket.join(sessionId);
    if (!socketSessions.has(socket.id)) {
      socketSessions.set(socket.id, new Set());
    }
    socketSessions.get(socket.id)!.add(sessionId);

    // Cancel grace period if someone reconnects
    if (gracePeriodTimeouts.has(sessionId)) {
      clearTimeout(gracePeriodTimeouts.get(sessionId));
      gracePeriodTimeouts.delete(sessionId);
      console.log(`Grace period cancelled for session ${sessionId} (user reconnected)`);
    }

    console.log(`Socket ${socket.id} joined session ${sessionId}`);
  });

  // Leave Session Room
  socket.on('leave_session', (sessionId: string) => {
    socket.leave(sessionId);
    console.log(`Socket ${socket.id} left session ${sessionId}`);
  });

  // Send Message & Start Timer on First Mentor Message
  socket.on('send_message', async (data: { sessionId: string; senderId: string; content: string }) => {
    const { sessionId, content } = data;
    const senderId = socket.data.userId || data.senderId; // Prevent sender spoofing

    try {
      // 1. Verify session exists and is ACTIVE
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.status !== 'ACTIVE') {
        socket.emit('error', 'Chat session is not active.');
        return;
      }

      if (session.studentId !== senderId && session.mentorId !== senderId) {
        socket.emit('error', 'You are not a participant of this session.');
        return;
      }

      let firstMsgTime = session.firstMessageTime;

      // Timer Rule: Timer starts only after mentor sends first message
      if (senderId === session.mentorId && !firstMsgTime) {
        firstMsgTime = new Date();
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { firstMessageTime: firstMsgTime },
        });

        // Notify room that chat billing/timer has officially started
        io.to(sessionId).emit('timer_started', {
          firstMessageTime: firstMsgTime.toISOString(),
          isFreeTrial: session.isFreeTrial,
        });
      }

      // Check if student has active subscription
      // Look up the mentor's profile ID to scope the subscription correctly
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.mentorId },
        select: { id: true },
      });
      const activeSub = await prisma.subscription.findFirst({
        where: {
          studentId: session.studentId,
          mentorId: mentorProfile?.id || "__none__",
          isActive: true,
          endDate: { gt: new Date() },
        },
      });

      // Re-evaluate duration and auto-end on EVERY message (only for pay-per-minute non-subscribed calls)
      if (firstMsgTime && session.perMinuteRate > 0 && !activeSub) {
        const studentWallet = await prisma.wallet.findUnique({
          where: { userId: session.studentId },
        });
        const balance = studentWallet?.balance || 0;
        
        let maxDurationMins = Math.floor(balance / session.perMinuteRate);
        if (session.isFreeTrial) {
          const cfg = await prisma.platformConfig.findUnique({ where: { key: "free_trial_max_minutes" } });
          const freeMins = cfg ? parseFloat(cfg.value) : 5;
          maxDurationMins += (isNaN(freeMins) ? 5 : freeMins);
        }

        const elapsedMs = new Date().getTime() - new Date(firstMsgTime).getTime();
        const maxDurationMs = maxDurationMins * 60 * 1000;
        const remainingMs = maxDurationMs - elapsedMs;

        if (maxDurationMins <= 0 || remainingMs <= 0) {
          io.to(sessionId).emit('error', 'Wallet balance exhausted. Chat ending automatically.');
          io.to(sessionId).emit('chat_terminated', { sessionId, endedBy: 'SYSTEM' });
          
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            await fetch(`${apiUrl}/api/chats/${sessionId}/end`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': process.env.INTERNAL_API_SECRET || "",
              },
            });
          } catch (e) {
            console.error("Auto-end session failed", e);
          }
          return; // Stop processing message, chat is over
        } else {
          // Clear any existing timeout for this session to prevent duplicate timers
          if (chatTimeouts.has(sessionId)) {
            clearTimeout(chatTimeouts.get(sessionId));
          }
          
          // Set new timeout for the exact remaining time
          const timeout = setTimeout(async () => {
            io.to(sessionId).emit('error', 'Wallet balance exhausted. Chat ending automatically.');
            io.to(sessionId).emit('chat_terminated', { sessionId, endedBy: 'SYSTEM' });
            
            try {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
              await fetch(`${apiUrl}/api/chats/${sessionId}/end`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-internal-secret': process.env.INTERNAL_API_SECRET || "",
                },
              });
            } catch (e) {
              console.error("Auto-end session failed", e);
            }
          }, remainingMs);
          
          chatTimeouts.set(sessionId, timeout);
        }
      }

      // 2. Create message in DB
      const message = await prisma.message.create({
        data: {
          sessionId,
          senderId,
          content,
        },
      });

      // 3. Broadcast to everyone in the room
      io.to(sessionId).emit('receive_message', message);
      
      // 4. Send to receiver's private room for global notifications ONLY if not in session
      const receiverId = senderId === session.mentorId ? session.studentId : session.mentorId;
      const sessionRoom = io.sockets.adapter.rooms.get(sessionId);
      const receiverSockets = userSockets.get(receiverId);
      const isReceiverInSession = receiverSockets && [...receiverSockets].some(sid => sessionRoom?.has(sid));
      
      if (!isReceiverInSession) {
        io.to(`user_${receiverId}`).emit('receive_message', message);
      }

    } catch (err) {
      console.error('Send message error:', err);
      socket.emit('error', 'Failed to send message.');
    }
  });

  // Edit Message
  socket.on('edit_message', async (data: { messageId: string; sessionId: string; content: string }) => {
    const { messageId, sessionId, content } = data;
    const senderId = socket.data.userId;

    if (!senderId) return;

    try {
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message || message.senderId !== senderId || message.sessionId !== sessionId) {
        socket.emit('error', 'Unauthorized to edit this message.');
        return;
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { content, editedAt: new Date() } as any,
      });

      io.to(sessionId).emit('message_edited', updated);
    } catch (err) {
      console.error('Edit message error:', err);
    }
  });

  // Delete Message
  socket.on('delete_message', async (data: { messageId: string; sessionId: string }) => {
    const { messageId, sessionId } = data;
    const senderId = socket.data.userId;

    if (!senderId) return;

    try {
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message || message.senderId !== senderId || message.sessionId !== sessionId) {
        socket.emit('error', 'Unauthorized to delete this message.');
        return;
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, content: "This message was deleted" } as any,
      });

      io.to(sessionId).emit('message_deleted', updated);
    } catch (err) {
      console.error('Delete message error:', err);
    }
  });

  // Typing Indicators
  socket.on('typing_start', (data: { sessionId: string; userId: string; userName: string }) => {
    socket.to(data.sessionId).emit('user_typing', { userId: data.userId, userName: data.userName, isTyping: true });
  });

  socket.on('typing_stop', (data: { sessionId: string; userId: string }) => {
    socket.to(data.sessionId).emit('user_typing', { userId: data.userId, isTyping: false });
  });

  // Read Receipts
  socket.on('mark_read', (data: { sessionId: string; userId: string }) => {
    socket.to(data.sessionId).emit('messages_read', { sessionId: data.sessionId, readBy: data.userId });
  });

  // Private Mode Toggle Broadcast
  socket.on('toggle_private', (data: { sessionId: string; isPrivate: boolean }) => {
    io.to(data.sessionId).emit('private_toggled', { sessionId: data.sessionId, isPrivate: data.isPrivate });
  });

  // Session Termination Broadcast
  socket.on('session_ended', async (data: { sessionId: string; endedBy: string }) => {
    io.to(data.sessionId).emit('chat_terminated', { sessionId: data.sessionId, endedBy: data.endedBy });
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Handle Grace Period for all sessions this socket was in
    const sessions = socketSessions.get(socket.id);
    if (sessions) {
      for (const sessionId of sessions) {
        // Wait briefly for socket.io to fully clear the room
        setTimeout(async () => {
          const roomSize = io.sockets.adapter.rooms.get(sessionId)?.size || 0;
          if (roomSize === 0 && !gracePeriodTimeouts.has(sessionId)) {
            console.log(`Room ${sessionId} is empty. Starting 3-minute grace period.`);
            const timeout = setTimeout(async () => {
              console.log(`Grace period expired for ${sessionId}. Auto-ending session.`);
              io.to(sessionId).emit('chat_terminated', { sessionId, endedBy: 'SYSTEM' });
              try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                await fetch(`${apiUrl}/api/chats/${sessionId}/end`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': process.env.INTERNAL_API_SECRET || "",
                  },
                });
              } catch (e) {
                console.error("Auto-end on grace period failed", e);
              }
              gracePeriodTimeouts.delete(sessionId);
            }, 3 * 60 * 1000); // 3 minutes
            gracePeriodTimeouts.set(sessionId, timeout);
          }
        }, 1000);
      }
      socketSessions.delete(socket.id);
    }

    for (const [userId, sockets] of userSockets.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          try {
            await prisma.mentorProfile.updateMany({
              where: { userId },
              data: { isOnline: false },
            });
            io.emit('presence_change', { userId, isOnline: false });
          } catch (e) {
            console.error('Error setting mentor offline on disconnect:', e);
          }
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4000;

const server = httpServer.listen(PORT, () => {
  console.log(`Realtime service running on port ${PORT}`);
});

// H1, H3, L7, M5 & M13: Background interval scheduler for automated cleanup, syncs, reminders, and anti-flood cleanup
const schedulerInterval = setInterval(async () => {
  try {
    // 1. Clean up stale entries from recentUserEvents memory tracker to prevent unbounded memory growth
    const nowMs = Date.now();
    for (const [userId, categories] of recentUserEvents.entries()) {
      for (const [cat, events] of categories.entries()) {
        const fresh = events.filter(e => nowMs - e.timestamp <= 120000);
        if (fresh.length === 0) categories.delete(cat);
        else categories.set(cat, fresh);
      }
      if (categories.size === 0) recentUserEvents.delete(userId);
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const secret = process.env.INTERNAL_API_SECRET || "";
    if (!secret) return;

    // 2. Trigger automated sync and cleanup cron endpoints
    const headers = { "Content-Type": "application/json", "x-internal-secret": secret };
    await Promise.all([
      fetch(`${apiUrl}/api/scheduled-calls/sync`, { method: "POST", headers }).catch(err => console.error("Scheduler call sync failed:", err)),
      fetch(`${apiUrl}/api/cron/approve-reviews`, { method: "POST", headers }).catch(err => console.error("Scheduler approve reviews failed:", err)),
      fetch(`${apiUrl}/api/cron/sweep-chats`, { method: "POST", headers }).catch(err => console.error("Scheduler sweep chats failed:", err)),
      fetch(`${apiUrl}/api/cron/billing`, { method: "POST", headers }).catch(err => console.error("Scheduler billing failed:", err)),
      fetch(`${apiUrl}/api/cron/subscriptions-renew`, { method: "GET", headers: { authorization: `Bearer ${process.env.CRON_SECRET || secret}` } }).catch(err => console.error("Scheduler subscriptions renew failed:", err)),
      fetch(`${apiUrl}/api/cron/purge-expired-chats`, { method: "GET", headers: { authorization: `Bearer ${process.env.CRON_SECRET || secret}` } }).catch(err => console.error("Scheduler purge expired chats failed:", err)),
      fetch(`${apiUrl}/api/cron/scheduled-messages`, { method: "GET", headers: { authorization: `Bearer ${process.env.CRON_SECRET || secret}` } }).catch(err => console.error("Scheduler scheduled messages failed:", err)),
    ]);

    // 3. Deactivate expired subscriptions
    const now = new Date();
    await prisma.subscription.updateMany({
      where: {
        isActive: true,
        endDate: { lte: now }
      },
      data: { isActive: false }
    });

    // 4. Send push notification reminder to mentor and student for scheduled calls starting in the next 15 mins
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);
    const upcomingCalls = await prisma.scheduledChat.findMany({
      where: {
        status: { in: ["ACCEPTED", "CONFIRMED"] },
        scheduledAt: { gt: now, lte: windowEnd },
        reminderSent: false,
      } as any,
      include: {
        mentor: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } }
      }
    });

    for (const call of upcomingCalls as any[]) {
      io.to(`user_${call.mentorId}`).emit('global_notification', {
        id: `remind_call_${call.id}`,
        title: "⏰ Consultation Reminder",
        message: `Your consultation call with student ${call.student?.name || 'Student'} starts in less than 15 minutes.`,
        type: "REMINDER",
        link: `/mentor/scheduled-calls`,
      });
      io.to(`user_${call.studentId}`).emit('global_notification', {
        id: `remind_call_${call.id}`,
        title: "⏰ Consultation Reminder",
        message: `Your consultation call with mentor ${call.mentor?.name || 'Mentor'} starts in less than 15 minutes.`,
        type: "REMINDER",
        link: `/scheduled-calls`,
      });
      await prisma.scheduledChat.update({
        where: { id: call.id },
        data: { reminderSent: true } as any
      });
    }

  } catch (err) {
    console.error("Error in background interval scheduler:", err);
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Hourly Cron Substitute (Bypasses Vercel free-tier cron limits)
// Pings the web API to process automated payments and refunds every hour
const hourlySyncInterval = setInterval(async () => {
  try {
    const webAppUrl = Array.isArray(frontendOrigin) 
      ? frontendOrigin.find(url => url.includes('helpsathi.com')) || frontendOrigin[0] 
      : frontendOrigin;
      
    if (webAppUrl && process.env.INTERNAL_API_SECRET) {
      console.log(`[Hourly Cron] Triggering payment/refund sync at ${webAppUrl}...`);
      await fetch(`${webAppUrl}/api/scheduled-calls/sync`, {
        method: 'POST',
        headers: {
          'x-internal-secret': process.env.INTERNAL_API_SECRET
        }
      });
    }
  } catch (err) {
    console.error("Error triggering hourly sync:", err);
  }
}, 60 * 60 * 1000); // Run every 60 minutes

// Daily Cron Substitute
// Pings the web API to process subscription cleanups once a day
const dailyCleanupInterval = setInterval(async () => {
  try {
    const webAppUrl = Array.isArray(frontendOrigin) 
      ? frontendOrigin.find(url => url.includes('helpsathi.com')) || frontendOrigin[0] 
      : frontendOrigin;
      
    if (webAppUrl && process.env.INTERNAL_API_SECRET) {
      console.log(`[Daily Cron] Triggering subscription cleanup at ${webAppUrl}...`);
      await fetch(`${webAppUrl}/api/subscriptions/cleanup`, {
        method: 'POST',
        headers: {
          'x-internal-secret': process.env.INTERNAL_API_SECRET
        }
      });
    }
  } catch (err) {
    console.error("Error triggering daily cleanup:", err);
  }
}, 24 * 60 * 60 * 1000); // Run every 24 hours

// L5: Graceful Shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received: closing HTTP and Socket servers gracefully...`);
  clearInterval(schedulerInterval);
  clearInterval(hourlySyncInterval);
  clearInterval(dailyCleanupInterval);
  io.emit("server_shutdown", { message: "Server is restarting for updates. Please reconnect shortly." });
  io.close(() => {
    console.log("Socket.io closed.");
    server.close(async () => {
      console.log("HTTP server closed.");
      await prisma.$disconnect();
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error("Forcing shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
