"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatedList } from "@/components/magicui/animated-list";
import { MessageCircle, X, Bell, CalendarCheck, Wallet, Star, ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/components/providers/AuthProvider";

interface NotificationItem {
  id: string;
  name: string;
  message: string;
  time: string;
  type?: string;
  link?: string;
  isBatched?: boolean;
}

export function GlobalChatNotification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const router = useRouter();
  const { user, refetchUser } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const recentHistoryRef = useRef<Map<string, number>>(new Map());

  // Keep pathnameRef synchronized without restarting socket
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const triggerOSNotification = useCallback((title: string, body: string, url: string, tag: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: "/favicon.ico",
            tag: tag || "helpsathi_alert",
            renotify: true,
            vibrate: [200, 100, 200],
            data: { url },
          } as any);
        }).catch((err) => console.error("SW push banner failed:", err));
      } else {
        new Notification(title, { body, icon: "/favicon.ico", tag });
      }
    }
  }, []);

  const addNotificationToast = useCallback((notif: NotificationItem) => {
    const now = Date.now();
    const key = `${notif.name}:${notif.message}`;
    const lastSeen = recentHistoryRef.current.get(key) || 0;

    // Suppress exact duplicate popups within 15 seconds
    if (now - lastSeen < 15000) {
      return;
    }
    recentHistoryRef.current.set(key, now);

    // Keep max 2 visible toasts and add new one
    setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)].slice(0, 2));

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    }, 4500);
  }, []);

  // Web Push Subscription & Permission Check (Snoozed 1 day if dismissed)
  useEffect(() => {
    if (!user) return;

    const checkPushSubscription = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        
        // If not actively subscribed to our backend
        if (!sub) {
          if (Notification.permission === "granted") {
            // They previously granted permission, but the subscription was lost (e.g. cleared browser data)
            // Silently auto-subscribe them in the background
            if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
              const newSub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
              });
              await fetch("/api/notifications/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  endpoint: newSub.endpoint,
                  keys: {
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(newSub.getKey("p256dh")!))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(newSub.getKey("auth")!))),
                  },
                }),
              });
            }
          } else if (Notification.permission === "default") {
            const dismissedUntil = localStorage.getItem("push_prompt_dismissed_until");
            const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();
            if (!isDismissed) {
              // Show gentle prompt after 2 seconds
              setTimeout(() => setShowPermissionPrompt(true), 2000);
            }
          }
        }
      } catch (err) {
        console.error("Push subscription check failed:", err);
      }
    };

    checkPushSubscription();
  }, [user]);

  // Persistent, Single-Session Socket Connection
  useEffect(() => {
    if (!user?.id) return;

    let socket: Socket | null = null;
    
    const connectSocket = async () => {
      try {
        const tokenRes = await fetch("/api/auth/socket-token");
        const tokenData = await tokenRes.json();

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
        socket = io(socketUrl, {
          auth: { token: tokenData.token },
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });
        socketRef.current = socket;

        socket.emit("user_online", user.id);

        socket.on("connect_error", (err: any) => {
          console.error("Global socket connection error:", err.message || err);
        });

        // 1. Incoming chat message handler
        socket.on("receive_message", (msg: { sessionId?: string; senderId: string; content: string; createdAt?: string }) => {
          if (msg.senderId === user.id) return;

          const sessionId = msg.sessionId || "";
          const currentPath = pathnameRef.current;

          // Suppress toast if user is actively focused in this exact conversation
          const isViewingThisChat = sessionId
            ? ((currentPath?.includes(`/chats/${sessionId}`) || currentPath?.includes(`/mentor-chat/${sessionId}`)) && !document.hidden)
            : false;

          if (isViewingThisChat) return;

          if (localStorage.getItem("mute_chat_notifs") === "true") return;

          const notifId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newNotif: NotificationItem = {
            id: notifId,
            name: "New Message",
            message: msg.content,
            time: "Just now",
            type: "CHAT_MESSAGE",
            link: sessionId ? `/chats/${sessionId}` : "/notifications",
          };

          addNotificationToast(newNotif);
          triggerOSNotification("New Message", msg.content, sessionId ? `/chats/${sessionId}` : "/notifications", "chat_message");
        });

        // 2. Structured platform broadcast handler
        socket.on("global_notification", (payload: { id: string; title: string; message: string; type?: string; link?: string; isBatched?: boolean }) => {
          if (payload.type === "ACCOUNT" || payload.type === "ROLE_UPDATE") {
            refetchUser();
          }

          if (payload.type === "BOOKING" || payload.type === "PROPOSAL_ACCEPTED") {
            if (localStorage.getItem("mute_booking_notifs") === "true") return;
          } else if (payload.type === "PAYMENT") {
            if (localStorage.getItem("mute_payment_notifs") === "true") return;
          }

          const notifId = payload.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newNotif: NotificationItem = {
            id: notifId,
            name: payload.title,
            message: payload.message,
            time: "Just now",
            type: payload.type || "GENERAL",
            link: payload.link || "/notifications",
            isBatched: payload.isBatched,
          };

          addNotificationToast(newNotif);
          triggerOSNotification(payload.title, payload.message, payload.link || "/notifications", payload.type || "GENERAL");
          
          // Instantly refresh the header notification count
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("refresh_header_notifications"));
            
            // Instantly refresh the header wallet balance if it's financial
            if (payload.type === "PAYMENT" || payload.type === "PAYOUT" || payload.type === "WALLET_UPDATE") {
              window.dispatchEvent(new CustomEvent("refresh_header_wallet"));
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize socket auth", err);
      }
    };

    connectSocket();

    return () => {
      socket?.disconnect();
    };
  }, [user?.id, addNotificationToast, refetchUser, triggerOSNotification]);

  const handleEnablePush = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setShowPermissionPrompt(false);
        triggerOSNotification("HelpSathi Push Enabled! 🚀", "You will now receive instant phone and PC alerts for calls and chats.", "/notifications", "test_push");
        
        if ("serviceWorker" in navigator && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });
            await fetch("/api/notifications/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                endpoint: sub.endpoint,
                keys: {
                  p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
                  auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
                },
              }),
            });
          } catch (e) {
            console.error("Push subscription failed", e);
          }
        }
      } else {
        setShowPermissionPrompt(false);
        // Snooze for 1 day
        localStorage.setItem("push_prompt_dismissed_until", (Date.now() + 86400000).toString());
      }
    }
  };

  const handleDismissPrompt = () => {
    setShowPermissionPrompt(false);
    // Snooze for 1 day
    localStorage.setItem("push_prompt_dismissed_until", (Date.now() + 86400000).toString());
  };

  const getIconForType = (type?: string) => {
    switch (type) {
      case "BOOKING":
      case "PROPOSAL_ACCEPTED":
        return { icon: <CalendarCheck className="w-4 h-4 text-emerald-500" />, bg: "bg-emerald-500/10 border-emerald-500/20" };
      case "PAYMENT":
        return { icon: <Wallet className="w-4 h-4 fill-blue-500 text-blue-500" />, bg: "bg-blue-500/10 border-blue-500/20" };
      case "REVIEW":
        return { icon: <Star className="w-4 h-4 fill-amber-500 text-amber-500" />, bg: "bg-amber-500/10 border-amber-500/20" };
      case "CHAT_MESSAGE":
      case "CHAT":
        return { icon: <MessageCircle className="w-4 h-4 fill-indigo-500 text-indigo-500" />, bg: "bg-indigo-500/10 border-indigo-500/20" };
      default:
        return { icon: <Bell className="w-4 h-4 fill-brand-main text-brand-main" />, bg: "bg-brand-main/10 border-brand-main/20" };
    }
  };

  if (!user && !showPermissionPrompt && notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-2rem)] pointer-events-none flex flex-col gap-3">
      {/* Push Permission Consent Card */}
      {showPermissionPrompt && (
        <div className="pointer-events-auto bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-xl border border-slate-700 shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-main/20 flex items-center justify-center text-brand-main shrink-0">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold text-sm text-white">Enable Phone & PC Alerts</p>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Get instant notifications for call bookings, chats & payments even when this browser tab is closed!
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleEnablePush}
                  className="px-3 py-1.5 bg-brand-main hover:bg-brand-main/90 text-white font-bold rounded-lg transition text-xs shadow-md shadow-brand-main/20"
                >
                  Enable Now 🚀
                </button>
                <button
                  onClick={handleDismissPrompt}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold rounded-lg transition text-xs"
                >
                  Later
                </button>
              </div>
            </div>
            <button onClick={handleDismissPrompt} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Real-time Floating Notification Toasts with Auto-Dismiss */}
      {notifications.length > 0 && (
        <AnimatedList delay={400}>
          {notifications.map((notif) => {
            const style = getIconForType(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => {
                  setNotifications((n) => n.filter((x) => x.id !== notif.id));
                  if (notif.link) router.push(notif.link);
                }}
                className="pointer-events-auto cursor-pointer bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex gap-3.5 w-full relative group hover:scale-[1.02] transition-all duration-200"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifications((n) => n.filter((x) => x.id !== notif.id));
                  }}
                  className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${style.bg}`}>
                  {style.icon}
                </div>

                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      {notif.name}
                      {notif.isBatched && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-orange-500/20 text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                          Digest
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 font-medium leading-relaxed">
                    {notif.message}
                  </p>
                  {notif.link && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-brand-main group-hover:underline">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </AnimatedList>
      )}
    </div>
  );
}

