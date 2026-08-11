"use client";

import { useState, useEffect } from "react";
import { Megaphone, Users, Trash, CheckCircle, WarningCircle, ArrowSquareOut } from "@phosphor-icons/react";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/providers/ToastProvider";

interface BroadcastHistory {
  id: string;
  title: string;
  message: string;
  targetRole: string;
  createdAt: string;
  readCount: number;
  link?: string;
}

export default function AdminNotificationsPage() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetRole: "ALL",
    link: "",
  });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/admin/notifications?page=${page}&limit=${limit}`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.notifications || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalNotifications(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch broadcast history", err);
      toast.error("Failed to load broadcast history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSending(true);

      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Notification broadcasted to ${formData.targetRole} audience!`);
        setFormData({ title: "", message: "", targetRole: "ALL", link: "" });
        fetchHistory();
      } else {
        toast.error(data.error || "Failed to send notification");
      }
    } catch (err) {
      toast.error("Error broadcasting notification");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(item: BroadcastHistory) {
    try {
      const res = await fetch(`/api/admin/notifications?id=${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory(history.filter((n) => n.id !== item.id));
        toast.success("Notification recalled successfully.");
      } else {
        toast.error("Failed to delete notification");
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.error("Failed to delete notification");
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
            <Megaphone weight="fill" className="text-indigo-600 dark:text-indigo-400 text-2xl" />
          </div>
          Broadcast & Targeted Notifications
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">
          Send real-time system announcements to all users, specific roles, or dynamic subscriber cohorts with read tracking analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Broadcast Form */}
        <form onSubmit={handleSend} className="lg:col-span-1 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Users className="text-indigo-500" /> New Broadcast
          </h2>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Target Audience</label>
            <select
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="ALL">🌐 All Platform Users</option>
              <option value="STUDENT">🎓 Students Only</option>
              <option value="MENTOR">👔 All Mentors</option>
              <option value="ACTIVE_SUBSCRIBERS">✨ Active Subscribers (Students)</option>
              <option value="VERIFIED_MENTORS">✅ Verified & Approved Mentors</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Notification Title</label>
            <input
              type="text"
              required
              placeholder="e.g. ⚡ New Feature & Mentorship Discount!"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Message Body</label>
            <textarea
              required
              rows={4}
              placeholder="Write the full announcement message text here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Action Link URL (Optional)</label>
            <input
              type="text"
              placeholder="e.g. /mentors or /wallet"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            <Megaphone weight="fill" className="text-lg" />
            {sending ? "Broadcasting..." : "Dispatch Broadcast"}
          </button>
        </form>

        {/* Broadcast History & Read Tracking */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Recent Broadcasts & Read Analytics
            </h2>
            <button
              onClick={fetchHistory}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              ↻ Refresh History
            </button>
          </div>

          {loadingHistory ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center animate-pulse text-slate-400 font-bold">
              Loading broadcast history...
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Megaphone className="text-4xl text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">No announcements broadcasted yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Use the form to dispatch your first platform notification.</p>
            </div>
          ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60">
                          {item.targetRole}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          • {new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{item.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{item.message}</p>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1">
                          <ArrowSquareOut /> Action Link: {item.link}
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-4 md:shrink-0 pt-3 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-800/60">
                      <div className="text-center px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="block text-xl font-black text-slate-900 dark:text-white">{item.readCount}</span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Read Reach</span>
                      </div>

                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                        title="Recall / Delete Notification"
                      >
                        <Trash weight="bold" className="text-lg" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalNotifications}
                    pageSize={limit}
                    onPageChange={setPage}
                  />
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
