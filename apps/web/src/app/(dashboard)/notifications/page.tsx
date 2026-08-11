"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { Bell, CalendarCheck, Wallet, Star, MessageCircle, CheckCircle, Trash2, ArrowRight, Loader2, ShieldCheck, Sliders, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface NotifRecord {
  id: string;
  userId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

function NotificationsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "settings" ? "SETTINGS" : "FEED";
  const [viewMode, setViewMode] = useState<"FEED" | "SETTINGS">(initialView);
  const [notifications, setNotifications] = useState<NotifRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "CHATS" | "BOOKINGS" | "PAYMENTS" | "REVIEWS">("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await fetch(`/api/notifications?page=${pageNum}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        const newItems = data.notifications || [];
        setNotifications((prev) => (append ? [...prev, ...newItems] : newItems));
        if (data.pagination) {
          setHasMore(data.pagination.hasMore);
          setTotalCount(data.pagination.total);
        }
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
  }, []);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (e) {
      console.error("Mark all read failed:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearRead = async () => {
    setActionLoading(true);
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } catch (e) {
      console.error("Clear read failed:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete ALL notifications?")) return;
    setActionLoading(true);
    setNotifications([]);
    setTotalCount(0);
    setHasMore(false);
    try {
      await fetch("/api/notifications?all=true", { method: "DELETE" });
    } catch (e) {
      console.error("Clear all failed:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "UNREAD":
        return notifications.filter((n) => !n.isRead);
      case "CHATS":
        return notifications.filter((n) => n.type === "CHAT_MESSAGE" || n.type === "CHAT");
      case "BOOKINGS":
        return notifications.filter((n) => n.type === "BOOKING" || n.type === "PROPOSAL_ACCEPTED" || n.type === "GROUP_MEETING");
      case "PAYMENTS":
        return notifications.filter((n) => n.type === "PAYMENT" || n.type === "PAYOUT" || n.type === "WALLET");
      case "REVIEWS":
        return notifications.filter((n) => n.type === "REVIEW" || n.type === "GENERAL");
      default:
        return notifications;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredList = getFilteredNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "BOOKING":
      case "PROPOSAL_ACCEPTED":
      case "GROUP_MEETING":
        return { icon: <CalendarCheck className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-500/10 border-emerald-500/20" };
      case "PAYMENT":
      case "PAYOUT":
      case "WALLET":
        return { icon: <Wallet className="w-5 h-5 text-blue-500" />, bg: "bg-blue-500/10 border-blue-500/20" };
      case "REVIEW":
        return { icon: <Star className="w-5 h-5 text-amber-500" />, bg: "bg-amber-500/10 border-amber-500/20" };
      case "CHAT_MESSAGE":
      case "CHAT":
        return { icon: <MessageCircle className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-500/10 border-indigo-500/20" };
      default:
        return { icon: <Bell className="w-5 h-5 text-brand-main" />, bg: "bg-brand-main/10 border-brand-main/20" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors pb-28 md:pb-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notification Hub</h1>
              {viewMode === "FEED" && unreadCount > 0 && (
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-brand-main text-white animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Manage your message alerts, booking updates, and device push preferences.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setViewMode(viewMode === "FEED" ? "SETTINGS" : "FEED")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 font-extrabold rounded-xl text-xs transition shadow-sm ${
                viewMode === "SETTINGS"
                  ? "bg-brand-main text-slate-950 hover:bg-brand-400"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {viewMode === "SETTINGS" ? (
                <>
                  <ArrowLeft className="w-4 h-4" /> Back to Notifications
                </>
              ) : (
                <>
                  <Sliders className="w-4 h-4 text-brand-main dark:text-amber-400" /> Settings
                </>
              )}
            </button>

            {viewMode === "FEED" && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> Mark Read
              </button>
            )}
            {viewMode === "FEED" && notifications.length > 0 && (
              <>
                <button
                  onClick={handleClearRead}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Read
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Conditional View: Preferences vs. Feed */}
        {viewMode === "SETTINGS" ? (
          <div className="animate-fade-in duration-200">
            <NotificationPreferences />
          </div>
        ) : (
          <>
            {/* Filter Navigation Tabs with smooth touch scrolling */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800 -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                { id: "ALL", label: "All", badge: totalCount || notifications.length },
                { id: "UNREAD", label: "Unread", badge: unreadCount },
                { id: "CHATS", label: "💬 Chats" },
                { id: "BOOKINGS", label: "📅 Bookings" },
                { id: "PAYMENTS", label: "💳 Payments" },
                { id: "REVIEWS", label: "⭐ Reviews" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === tab.id
                      ? "bg-brand-main text-slate-950 font-black shadow-md"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === tab.id ? "bg-slate-950 text-brand-main" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications Roster */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-main" />
                <p className="font-bold text-sm">Loading your activity history...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
                  <Bell className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">No notifications in this view</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
                  When students book sessions, send messages, or recharges are credited, alerts will appear right here.
                </p>
                <button
                  onClick={() => setViewMode("SETTINGS")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold transition shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <Sliders className="w-4 h-4 text-brand-main" /> Check Notification & Push Settings
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredList.map((notif) => {
                  const style = getIcon(notif.type);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.isRead) handleMarkAsRead(notif.id);
                        if (notif.link) router.push(notif.link);
                      }}
                      className={`cursor-pointer bg-white dark:bg-slate-900/90 rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex items-start gap-4 shadow-sm hover:shadow-md hover:border-brand-main/40 ${
                        !notif.isRead
                          ? "border-l-4 border-l-brand-main border-slate-200 dark:border-slate-800 bg-brand-main/[0.02] dark:bg-brand-main/[0.02]"
                          : "border-slate-200/80 dark:border-slate-800/80 opacity-80"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${style.bg}`}>
                        {style.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{notif.title}</h4>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-brand-main animate-ping shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                            {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        {notif.link && (
                          <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-main hover:underline">
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {!notif.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="text-slate-400 hover:text-emerald-500 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                          title="Mark as Read"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center pt-4 pb-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-black transition shadow-sm disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-brand-main" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <span>Load Earlier Notifications</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-main" />
        <p className="font-bold text-sm">Loading notifications hub...</p>
      </div>
    }>
      <NotificationsContent />
    </Suspense>
  );
}
