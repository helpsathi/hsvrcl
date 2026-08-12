"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  ArrowLeft, 
  Checks, 
  PaperPlaneRight, 
  X, 
  Phone, 
  WarningCircle,
  CalendarPlus,
  Clock,
  CurrencyInr,
  Sparkle,
  ShieldCheck,
  Lock,
  Paperclip,
  FilePdf,
  DownloadSimple,
  Eye,
  PencilSimple,
  Trash
} from "@phosphor-icons/react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isDeleted?: boolean;
  editedAt?: string | null;
}

interface PastPurgedSession {
  sessionId: string;
  date: string;
  durationMinutes: number;
  totalCharge: number;
  isFreeTrial?: boolean;
}

interface ChatData {
  id: string;
  status: string;
  perMinuteRate: number;
  isFreeTrial: boolean;
  freeTrialMaxMinutes?: number;
  isPrivate?: boolean;
  isSubscribed?: boolean;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "NONE";
  subscriptionExpiresAt?: string | null;
  mentorProfileId?: string | null;
  mentorMonthlyPrice?: number;
  firstMessageTime: string | null;
  student: { id: string; name: string; avatar: string | null };
  mentor: { id: string; name: string; avatar: string | null };
  messages: Message[];
  pastPurgedSessions?: PastPurgedSession[];
}

interface SessionSummary {
  durationMinutes: number;
  freeMinutesDiscounted: number;
  billableMinutes: number;
  perMinuteRate: number;
  totalCharge: number;
}

// Quick Pills removed
export default function ChatRoomPage() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingMsg = searchParams?.get("msg");
  const paramName = searchParams?.get("name");
  const paramAvatar = searchParams?.get("avatar");

  const [chat, setChat] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [subscribedSending, setSubscribedSending] = useState(false);
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "EXPIRED" | "CANCELLED" | "NONE">("NONE");
  const [subExpiredDuringChat, setSubExpiredDuringChat] = useState(false);
  const [mentorProfileId, setMentorProfileId] = useState<string | null>(null);
  const [mentorMonthlyPrice, setMentorMonthlyPrice] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timer state
  const [timerStarted, setTimerStarted] = useState(false);
  const [firstMsgTime, setFirstMsgTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start ticking the timer
  const startTimer = useCallback((startTime: Date) => {
    setFirstMsgTime(startTime);
    setTimerStarted(true);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
  }, []);

  useEffect(() => {
    if (!user) return;

    const initializeChatAndSocket = async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setChat(data.chat);
        setMessages(data.chat.messages);
        setIsPrivate(!!data.chat.isPrivate);
        if (data.chat.subscriptionStatus) setSubStatus(data.chat.subscriptionStatus);
        if (data.chat.mentorProfileId) setMentorProfileId(data.chat.mentorProfileId);
        if (data.chat.mentorMonthlyPrice) setMentorMonthlyPrice(data.chat.mentorMonthlyPrice);
        // Resume timer if mentor already sent first message
        if (data.chat.firstMessageTime && data.chat.status === "ACTIVE") {
          startTimer(new Date(data.chat.firstMessageTime));
        }

        // Fetch socket-specific auth token
        const tokenRes = await fetch("/api/auth/socket-token");
        const tokenData = await tokenRes.json();

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
        socketRef.current = io(socketUrl, {
          auth: { token: tokenData.token },
          reconnectionAttempts: 10,
          reconnectionDelay: 1500,
          forceNew: true,
        });

        if (socketRef.current.connected) {
          setIsConnected(true);
          socketRef.current.emit("join_session", chatId);
        }

        socketRef.current.on("connect", () => {
          setIsConnected(true);
          setSendError(null);
          socketRef.current?.emit("join_session", chatId);
        });

        socketRef.current.on("disconnect", () => {
          setIsConnected(false);
        });

        socketRef.current.on("connect_error", (err: any) => {
          console.error("Socket connection error:", err.message || err);
          setIsConnected(false);
        });

        socketRef.current.on("user_typing", ({ senderId }: { senderId: string }) => {
          if (senderId !== user.id) setIsOtherUserTyping(true);
        });

        socketRef.current.on("user_stopped_typing", ({ senderId }: { senderId: string }) => {
          if (senderId !== user.id) setIsOtherUserTyping(false);
        });

        socketRef.current.on("receive_message", (message: Message) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
        });

        socketRef.current.on("message_edited", (updatedMsg: Message) => {
          setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        });

        socketRef.current.on("message_deleted", (updatedMsg: Message) => {
          setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        });

        socketRef.current.on("timer_started", (data: { firstMessageTime: string; isFreeTrial: boolean }) => {
          startTimer(new Date(data.firstMessageTime));
        });

        socketRef.current.on("chat_terminated", async () => {
          if (timerRef.current) clearInterval(timerRef.current);
          const res = await fetch(`/api/chats/${chatId}`);
          const data = await res.json();
          if (res.ok && data.chat) {
            setChat(prev => prev ? { ...prev, status: "COMPLETED", _count: data.chat._count } : prev);
          }
        });

        socketRef.current.on("private_toggled", (data: { isPrivate: boolean }) => {
          setIsPrivate(data.isPrivate);
        });

        socketRef.current.on("error", (msg: string) => {
          setSendError(msg);
          setError(msg);
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeChatAndSocket();

    return () => {
      socketRef.current?.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [chatId, user, startTimer]);

  // Real-time polling every 60s during ACTIVE session to detect mid-session subscription expiration
  useEffect(() => {
    if (!chatId || !user || user.role !== "STUDENT") return;
    const subPollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        const data = await res.json();
        if (res.ok && data.chat) {
          setChat(prev => {
            if (prev && data.chat.isSubscribed === false && prev.isSubscribed) {
              setSubExpiredDuringChat(true);
              setSubStatus(data.chat.subscriptionStatus || "EXPIRED");
              return { ...prev, isSubscribed: false, subscriptionStatus: data.chat.subscriptionStatus };
            }
            return prev;
          });
        }
      } catch (e) {
        // Silently catch background poll errors
      }
    }, 60000);
    return () => clearInterval(subPollInterval);
  }, [chatId, user]);


  // Auto-send a pending message passed via URL (subscribed user redirect flow)
  useEffect(() => {
    if (!pendingMsg || !user || !isConnected) return;
    const tryAutoSend = () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("send_message", {
          sessionId: chatId,
          senderId: user.id,
          content: pendingMsg,
        });
        // Clean URL without reload
        router.replace(`/chats/${chatId}`);
      }
    };
    // Wait a tick for socket to join session
    const t = setTimeout(tryAutoSend, 200);
    return () => clearTimeout(t);
  }, [pendingMsg, user, isConnected, chatId, router]);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (chat?.status !== "ACTIVE" || !socketRef.current) return;
    socketRef.current.emit("typing", { sessionId: chatId, senderId: user.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { sessionId: chatId, senderId: user.id });
    }, 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || !user || !chatId) return;

    if (!socketRef.current || !socketRef.current.connected) {
      setSendError("Connecting to real-time server... Please wait a second and try again.");
      return;
    }

    setSendError(null);

    if (editingMessageId) {
      socketRef.current.emit("edit_message", {
        sessionId: chatId,
        messageId: editingMessageId,
        content: text,
      });
      setEditingMessageId(null);
      setNewMessage("");
      return;
    }

    if (chat?.status !== "ACTIVE" && !chat?.isSubscribed) return;

    socketRef.current.emit("send_message", {
      sessionId: chatId,
      senderId: user.id,
      content: text,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit("stop_typing", { sessionId: chatId, senderId: user.id });

    setNewMessage("");
  };

  // For subscribed users with a completed session — create a new free session and send
  const handleSubscribedSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || subscribedSending) return;
    setSubscribedSending(true);
    try {
      const res = await fetch("/api/chats/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId: chat?.mentor?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start new session");
      // Navigate to the new active chat — carries the message as a query param to auto-send
      router.push(`/chats/${data.chatId}?msg=${encodeURIComponent(newMessage.trim())}`);
    } catch (err: any) {
      setSendError(err.message);
      setSubscribedSending(false);
    }
  };

  const handleTogglePrivate = async () => {
    if (!chat || chat.status !== "ACTIVE") return;
    try {
      const res = await fetch(`/api/chats/${chatId}/toggle-private`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsPrivate(data.isPrivate);
      socketRef.current?.emit("toggle_private", { sessionId: chatId, isPrivate: data.isPrivate });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    if (socketRef.current) {
      socketRef.current.emit("delete_message", {
        sessionId: chatId,
        messageId,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chat || chat.status !== "ACTIVE") return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      let msgContent = "";
      if (data.fileType === "IMAGE") {
        msgContent = `[IMAGE:${data.url}]`;
      } else {
        msgContent = `[PDF:${data.fileName}:${data.url}]`;
      }

      socketRef.current?.emit("send_message", {
        sessionId: chatId,
        senderId: user?.id,
        content: msgContent,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleEndChat = async () => {
    if (!chat || ending) return;
    setEnding(true);
    try {
      const res = await fetch(`/api/chats/${chatId}/end`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to end session");

      socketRef.current?.emit("session_ended", { sessionId: chatId, endedBy: user?.id });

      if (timerRef.current) clearInterval(timerRef.current);

      setSummary(data.summary);
      setChat((prev) => prev ? { ...prev, status: "COMPLETED" } : prev);
    } catch (err: any) {
      setError(err.message);
      setEnding(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const estimatedCost = chat
    ? (Math.max(0, Math.ceil(elapsedSeconds / 60) - (chat.isFreeTrial ? (chat.freeTrialMaxMinutes ?? 5) : 0)) * chat.perMinuteRate).toFixed(0)
    : "0";

  if (loading) {
    const { ChatRoomSkeleton } = require("@/components/ui/Skeleton");
    return <ChatRoomSkeleton name={paramName} avatar={paramAvatar} />;
  }

  if (error && !chat) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-white/50 dark:border-slate-800">
        <WarningCircle className="text-6xl text-rose-500 mx-auto mb-4 weight-fill" />
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Error</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">{error}</p>
        <Link href="/chats" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold w-full block shadow-lg">Go Back</Link>
      </div>
    </div>
  );

  if (!chat || !user) return null;

  const otherUser = chat.student.id === user.id ? chat.mentor : chat.student;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 relative animate-in fade-in duration-300">
      
      {/* Session Summary Modal */}
      {summary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[32px] p-8 w-full max-w-sm shadow-2xl text-center relative border border-white/50 dark:border-slate-800/50 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500/20 shadow-lg">
              <Checks weight="bold" className="text-4xl" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Session Summary</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-medium">Official consultation receipt</p>

            <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-2xl p-5 space-y-3 mb-6 text-left border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Duration</span>
                <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">{summary.durationMinutes} min</span>
              </div>
              {summary.freeMinutesDiscounted > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Free Trial Applied</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">-{summary.freeMinutesDiscounted} min</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Rate</span>
                <span className="font-bold text-slate-800 dark:text-white">{summary.billableMinutes} min × ₹{summary.perMinuteRate}</span>
              </div>
              
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-base">
                  {chat.student.id === user.id ? "Total Billed" : "Earnings"}
                </span>
                <span className={`font-black text-2xl ${chat.student.id === user.id ? "text-slate-900 dark:text-white" : "text-emerald-500"}`}>
                  ₹{summary.totalCharge}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/chats")}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold hover:from-blue-500 hover:to-indigo-500 transition-transform active:scale-[0.98] shadow-xl shadow-blue-500/25"
            >
              Back to Messages
            </button>
          </div>
        </div>
      )}

      {/* Premium Glass Header */}
      <div className="px-4 py-3 flex items-center justify-between z-20 shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <Link href="/chats" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-1">
            <ArrowLeft className="text-xl" />
          </Link>
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push(`/book-call/${chat.mentor?.id || otherUser.id}`)}>
            <div className="relative">
              <img
                src={otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`}
                alt={otherUser.name}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`; }}
                className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
              {chat.status === "ACTIVE" && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {otherUser.name}
              </h3>
              {chat.status === "ACTIVE" ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Live Session</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Session Completed</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {chat.status === "ACTIVE" ? (
            <div className="flex items-center gap-2">
              {/* Ticking Timer */}
              {timerStarted && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-semibold shadow-inner border border-slate-200 dark:border-slate-700">
                  <span className="text-emerald-600 dark:text-emerald-400">₹{estimatedCost}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono">{formatTime(elapsedSeconds)}</span>
                </div>
              )}

              <button
                onClick={handleTogglePrivate}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm shadow-sm transition-all ${
                  isPrivate
                    ? "bg-amber-500 text-white shadow-amber-500/20 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title={isPrivate ? "Private Mode (Auto-delete history on end)" : "Click to enable Private Chat mode"}
              >
                {isPrivate ? <Lock weight="fill" className="text-lg" /> : <ShieldCheck weight="bold" className="text-lg" />}
                <span className="hidden md:inline">{isPrivate ? "Private ON" : "Private Off"}</span>
              </button>
              
              <button
                onClick={handleEndChat}
                disabled={ending}
                className="text-rose-500 hover:text-white hover:bg-rose-500 p-2 rounded-full transition-colors ml-1"
                title="End Chat"
              >
                {ending ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <X weight="bold" className="text-xl" />}
              </button>
            </div>
          ) : (
            user.role === "STUDENT" && (
              <Link 
                href={`/book-call/${chat.mentor?.id || otherUser.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-bold text-sm shadow-sm hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
              >
                <Phone weight="fill" className="text-lg" />
                <span className="hidden sm:inline">Request Call</span>
              </Link>
            )
          )}
        </div>
      </div>

      {!isConnected && chat.status === "ACTIVE" && (
        <div className="bg-indigo-500/10 border-b border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 z-20 shrink-0">
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Connecting to real-time chat server...</span>
        </div>
      )}

      {sendError && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <WarningCircle weight="fill" className="text-rose-500 text-sm shrink-0" />
            <span>{sendError}</span>
          </div>
          <button onClick={() => setSendError(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X weight="bold" />
          </button>
        </div>
      )}

      {isPrivate && chat.status === "ACTIVE" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 z-20 shrink-0">
          <Lock weight="fill" className="text-amber-400 text-sm animate-bounce" />
          <span>🔒 Private Mode Active: All messages will be automatically deleted when the session ends.</span>
        </div>
      )}

      {subExpiredDuringChat && chat.status === "ACTIVE" && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 text-rose-700 dark:text-rose-300 px-4 py-2.5 text-xs md:text-sm font-bold flex flex-col sm:flex-row items-center justify-between gap-3 z-20 shrink-0 animate-in slide-in-from-top duration-300 shadow-sm">
          <div className="flex items-center gap-2">
            <WarningCircle weight="fill" className="text-rose-500 text-lg shrink-0 animate-bounce" />
            <span>⚠️ Your free subscription access just expired! Future sessions will be billed at pay-per-minute (₹{chat.perMinuteRate || 15}/min).</span>
          </div>
          {mentorProfileId && (
            <Link
              href={`/mentors/${mentorProfileId}`}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-opacity shrink-0"
            >
              Renew Subscription
            </Link>
          )}
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto relative z-10 flex flex-col no-scrollbar">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col">
          
          {/* Banner Badges & Historical Purged Sessions */}
          <div className="flex flex-col items-center gap-2 my-6">
            <span className="bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-500 dark:text-slate-400 text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            {chat.isFreeTrial && (
              <span className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[12px] px-4 py-2 rounded-full font-bold shadow-sm max-w-sm text-center flex items-center gap-2">
                <Sparkle weight="fill" className="text-amber-500 shrink-0" />
                Free Trial Session — First {chat.freeTrialMaxMinutes ?? 5} minutes free!
              </span>
            )}

            {/* Past Purged Top-Up Sessions (>28 days retention history) */}
            {chat.pastPurgedSessions && chat.pastPurgedSessions.length > 0 && (
              <div className="w-full max-w-md flex flex-col gap-2 my-2">
                {chat.pastPurgedSessions.map((past) => {
                  const pastDate = new Date(past.date);
                  const formattedPastDate = pastDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={past.sessionId}
                      className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-3 text-xs animate-in fade-in"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock weight="fill" className="text-base" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Chatted {past.durationMinutes} min{past.durationMinutes === 1 ? "" : "s"}
                          </p>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {formattedPastDate}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                          {past.totalCharge > 0 ? `₹${past.totalCharge} deducted` : "Free session"} • Messages cleared after 28 days for privacy.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Empty Conversation State */}
          {messages.length === 0 && (
            <div className="my-12 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto rounded-3xl bg-slate-50/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
                <PaperPlaneRight weight="fill" className="text-2xl" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                {chat.pastPurgedSessions && chat.pastPurgedSessions.length > 0 ? "Ready for a New Session" : "Start the Conversation"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                {chat.pastPurgedSessions && chat.pastPurgedSessions.length > 0
                  ? `Previous session messages were auto-cleared after 28 days. Send a message below to start chatting with ${otherUser.name}.`
                  : `Send your first message to ${otherUser.name} to begin your live session.`}
              </p>
            </div>
          )}

          {/* Chat Bubbles */}
          {messages.map((msg, index) => {
            const isMine = msg.senderId === user.id;
            const isFirstInCluster = index === 0 || messages[index - 1].senderId !== msg.senderId;
            const showAvatar = !isMine && isFirstInCluster;
            
            return (
              <div key={msg.id} className={`flex w-full group ${isMine ? "justify-end" : "justify-start"} ${isFirstInCluster && index !== 0 ? "mt-4" : "mt-1.5"} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                <div className={`relative flex max-w-[85%] md:max-w-[70%] ${isMine ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                  
                  {!isMine && (
                    <div className="w-6 shrink-0 flex flex-col justify-end h-full">
                      {showAvatar ? (
                        <img 
                          src={otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`; }}
                          className="w-6 h-6 rounded-full border border-white dark:border-slate-700 shadow-sm object-cover mb-1"
                        />
                      ) : <div className="w-6 h-6"></div>}
                    </div>
                  )}

                  <div className={`relative px-4 py-2.5 shadow-sm text-[15px] leading-relaxed transition-all ${
                    isMine
                      ? "bg-brand-600 text-white rounded-2xl rounded-br-sm shadow-brand-500/20"
                      : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 rounded-2xl rounded-bl-sm"
                  }`}>
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span className="whitespace-pre-wrap break-words">
                        {msg.isDeleted ? (
                          <span className="italic opacity-80 text-sm">This message was deleted</span>
                        ) : msg.content.startsWith("[IMAGE:") ? (
                          <div className="mt-1">
                            <img
                              src={msg.content.replace("[IMAGE:", "").replace("]", "")}
                              alt="Attachment"
                              onClick={() => setPreviewImage(msg.content.replace("[IMAGE:", "").replace("]", ""))}
                              className="max-w-[240px] md:max-w-[320px] max-h-[300px] rounded-xl object-cover border border-black/10 dark:border-white/10 cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                            />
                          </div>
                        ) : msg.content.startsWith("[PDF:") ? (
                          (() => {
                            const parts = msg.content.replace("[PDF:", "").replace("]", "").split(":");
                            const fileName = parts.length > 2 ? parts.slice(0, -1).join(":") : parts[0];
                            const url = parts[parts.length - 1];
                            return (
                              <div className="mt-1 bg-slate-900/10 dark:bg-white/10 p-3 rounded-xl flex items-center gap-3 border border-black/10 dark:border-white/10 max-w-xs">
                                <FilePdf weight="fill" className="text-red-500 text-3xl shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{fileName}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">PDF Document</p>
                                </div>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shrink-0"
                                  title="View/Download PDF"
                                >
                                  <DownloadSimple weight="bold" className="text-base" />
                                </a>
                              </div>
                            );
                          })()
                        ) : (
                          msg.content
                        )}
                      </span>
                      <div className={`text-[10px] font-bold min-w-fit flex items-center gap-1 ml-auto mt-1 ${isMine ? "text-brand-100/80" : "text-slate-400"}`}>
                        {msg.editedAt && !msg.isDeleted && <span className="opacity-70 mr-1">(edited)</span>}
                        {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        {isMine && <Checks weight="bold" className="text-sm text-brand-200" />}
                      </div>
                    </div>
                  </div>
                  {/* Edit / Delete Buttons */}
                  {isMine && !msg.isDeleted && (
                    <div className="flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity absolute right-full mr-2 top-1/2 -translate-y-1/2">
                      {!msg.content.startsWith("[IMAGE:") && !msg.content.startsWith("[PDF:") && (
                        <button 
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setNewMessage(msg.content);
                          }}
                          className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-brand-600 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Edit Message"
                        >
                          <PencilSimple weight="bold" className="text-[12px]" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                        title="Delete Message"
                      >
                        <Trash weight="bold" className="text-[12px]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isOtherUserTyping && (
            <div className="flex w-full justify-start mt-1.5 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div className="flex items-end gap-2">
                <div className="w-6 shrink-0 flex flex-col justify-end h-full">
                  <img 
                    src={otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`} 
                    alt="" 
                    className="w-6 h-6 rounded-full object-cover mb-1 opacity-80" 
                  />
                </div>
                <div className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5 h-10">
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-28" />
        </div>
      </div>

      {/* Composer & Quick Pills */}
      <div className="w-full bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 py-4 z-30 shrink-0 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-end shadow-[0_-10px_40px_rgba(0,0,0,0.03)] pb-4 md:pb-4 pb-safe">
        <div className="w-full max-w-5xl mx-auto space-y-3">
          
          {/* Quick Response Pills Removed */}
          {/* Form Input */}
          {chat.status === "ACTIVE" ? (
            <form onSubmit={handleSendMessage} className="flex items-end gap-2 px-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-11 h-11 shrink-0 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50 mb-0.5"
                title="Upload Image or PDF (Max 10MB)"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Paperclip weight="bold" className="text-xl" />
                )}
              </button>

              <div className="flex-1 bg-white dark:bg-slate-900 rounded-[28px] px-5 py-2.5 shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-700 focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all flex flex-col justify-end">
                {editingMessageId && (
                  <div className="flex items-center justify-between text-xs font-bold text-brand-600 mb-1 px-1">
                    <span>Editing message...</span>
                    <button 
                      type="button" 
                      onClick={() => { setEditingMessageId(null); setNewMessage(""); }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X weight="bold" />
                    </button>
                  </div>
                )}
                <div className="flex items-end">
                  <textarea
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder="Type a message..."
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                    className="w-full bg-transparent border-none text-[15px] font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none py-1 max-h-32"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-12 h-12 shrink-0 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30 hover:scale-105 hover:shadow-xl hover:shadow-brand-500/40 transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none mb-0.5"
              >
                <PaperPlaneRight weight="fill" className="text-xl -ml-0.5" />
              </button>
            </form>
          ) : chat.isSubscribed && user.role === "STUDENT" ? (
            // Subscribed users: always show the composer to start a new free session
            <form onSubmit={handleSubscribedSend} className="flex items-end gap-2 px-1">
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-[28px] px-5 py-2.5 shadow-md shadow-slate-200/50 dark:shadow-none border border-indigo-300 dark:border-indigo-700 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-500 shrink-0">✦ Subscribed</span>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a new message to your mentor..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubscribedSend(e as any);
                    }
                  }}
                  className="w-full bg-transparent border-none text-[15px] font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none py-1 max-h-32"
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || subscribedSending}
                className="w-12 h-12 shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none mb-0.5"
              >
                {subscribedSending
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <PaperPlaneRight weight="fill" className="text-xl -ml-0.5" />}
              </button>
            </form>
          ) : user.role === "STUDENT" ? (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[28px] border-2 border-indigo-200/80 dark:border-indigo-800/60 p-6 shadow-2xl space-y-4 max-w-3xl mx-auto my-1 transition-all">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500/20 via-amber-500/20 to-indigo-500/20 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Lock weight="fill" className="text-2xl text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {subStatus === "EXPIRED" ? "Subscription Expired" : subStatus === "CANCELLED" ? "Subscription Cancelled" : "Session Completed"}
                      {(subStatus === "EXPIRED" || subStatus === "CANCELLED") && (
                        <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border border-rose-500/30">Free Access Ended</span>
                      )}
                    </h4>
                    <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
                      {subStatus === "EXPIRED" || subStatus === "CANCELLED"
                        ? `Your subscriber benefits for ${chat.mentor.name} have ended. Renew or switch to pay-per-minute to keep chatting.`
                        : `To start a new conversation with ${chat.mentor.name}, choose how you want to proceed:`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Option 1: Pay Per Minute */}
                <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm">
                  <div className="text-left space-y-1">
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CurrencyInr weight="bold" className="text-base text-blue-500" /> Pay-Per-Minute
                    </span>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Standard pricing deducted from your wallet balance per minute.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-lg font-black text-slate-900 dark:text-white">₹{chat.perMinuteRate || 15}<span className="text-xs font-bold text-slate-500">/min</span></span>
                    <button
                      onClick={async () => {
                        try {
                          setSubscribedSending(true);
                          const res = await fetch("/api/chats/initiate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ mentorId: chat.mentor.id }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            if (data.requireRecharge) {
                              router.push("/wallet");
                              return;
                            }
                            throw new Error(data.error || "Failed to initiate chat");
                          }
                          router.push(`/chats/${data.chatId}`);
                        } catch (e: any) {
                          setError(e.message);
                          setSubscribedSending(false);
                        }
                      }}
                      disabled={subscribedSending}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black shadow-md transition-all disabled:opacity-50"
                    >
                      Start Paid Chat
                    </button>
                  </div>
                </div>

                {/* Option 2: Renew / Subscribe */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/90 via-purple-50/90 to-brand-50/90 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-slate-950 p-4 rounded-2xl border-2 border-indigo-500/50 dark:border-indigo-500/40 flex flex-col justify-between gap-4 shadow-lg shadow-indigo-500/5 hover:border-indigo-500 transition-all">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-purple-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm">
                    Recommended
                  </div>
                  <div className="text-left space-y-1 pr-16">
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkle weight="fill" className="text-base text-amber-500 animate-pulse" /> Unlimited Subscriber
                    </span>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Unlock unlimited free chats, zero call fees, and direct session proposals!
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 dark:border-indigo-800/50">
                    <span className="text-lg font-black text-indigo-950 dark:text-indigo-200">₹{mentorMonthlyPrice || "499"}<span className="text-xs font-bold text-slate-500">/month</span></span>
                    <Link
                      href={mentorProfileId ? `/mentors/${mentorProfileId}` : `/dashboard`}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-black shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {subStatus === "EXPIRED" || subStatus === "CANCELLED" ? "Renew Subscription ✦" : "Subscribe Now ✦"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl text-center border border-slate-200/60 dark:border-slate-800 shadow-sm mx-1">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">This session has been completed.</p>
              <button onClick={() => router.push('/dashboard')} className="mt-1 text-brand-600 dark:text-brand-400 text-sm font-bold hover:underline">Find another mentor</button>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Full view" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-4 -right-4 bg-white text-slate-900 p-2 rounded-full shadow-lg font-bold"
            >
              <X weight="bold" className="text-xl" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
