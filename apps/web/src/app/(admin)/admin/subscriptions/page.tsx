"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { 
  CreditCard, 
  MagnifyingGlass, 
  CheckCircle, 
  XCircle, 
  CalendarCheck, 
  CurrencyInr,
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  User
} from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface SubscriptionItem {
  id: string;
  price: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  mentor: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalActive: 0, totalExpired: 0, totalRevenue: 0 });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalSub, setCancelModalSub] = useState<SubscriptionItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchSubscriptions();
  }

  async function handleCancelSubscription() {
    if (!cancelModalSub) return;
    setCancellingId(cancelModalSub.id);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: cancelModalSub.id,
          reason: cancelReason,
        }),
      });
      if (res.ok) {
        setFeedbackMessage({ type: "success", text: "Subscription cancelled successfully." });
        setCancelModalSub(null);
        setCancelReason("");
        fetchSubscriptions();
      } else {
        const err = await res.json();
        setFeedbackMessage({ type: "error", text: err.error || "Failed to cancel subscription" });
      }
    } catch (e) {
      setFeedbackMessage({ type: "error", text: "Network error while cancelling subscription" });
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <CreditCard weight="fill" className="text-blue-600 dark:text-blue-400" />
            Subscriptions Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor all 30-day student mentor subscriptions, recurring revenue, and subscription lifecycles.
          </p>
        </div>
        <button
          onClick={() => fetchSubscriptions()}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ArrowsClockwise weight="bold" className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Subscriptions</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.totalActive}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Currently receiving mentorship</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Expired / Inactive</span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold">
              <XCircle weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.totalExpired}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Past or cancelled cycles</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cumulative Subscription Volume</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <CurrencyInr weight="bold" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-3">
            ₹{stats.totalRevenue.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Gross subscription transactions</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Status Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {["ALL", "ACTIVE", "EXPIRED"].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {st === "ALL" ? "All" : st === "ACTIVE" ? "Active" : "Expired"}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search student or mentor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Mentor</th>
                <th className="px-6 py-4">Monthly Fee</th>
                <th className="px-6 py-4">Billing Period</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <ArrowsClockwise className="animate-spin text-base" /> Loading subscriptions...
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No subscriptions found matching your filters.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const isCurrentlyActive = sub.isActive && new Date(sub.endDate) >= new Date();
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={sub.student.avatar} name={sub.student.name} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{sub.student.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{sub.student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={sub.mentor.user.avatar} name={sub.mentor.user.name} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{sub.mentor.user.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{sub.mentor.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        ₹{sub.price.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-[11px]">
                        <div>Start: {new Date(sub.startDate).toLocaleDateString()}</div>
                        <div>End: {new Date(sub.endDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        {isCurrentlyActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isCurrentlyActive ? (
                          <button
                            onClick={() => setCancelModalSub(sub)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-[11px] font-bold transition"
                          >
                            Cancel Sub
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {subscriptions.length} of {totalCount} subscriptions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <CaretLeft weight="bold" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <CaretRight weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-xl font-bold">
                <XCircle weight="fill" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cancel Subscription</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to terminate the active subscription between student{" "}
              <strong>{cancelModalSub.student.name}</strong> and mentor{" "}
              <strong>{cancelModalSub.mentor.user.name}</strong>? This will immediately end their active cycle and create an audit log.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g., Fraud report, chargeback dispute, student refund request..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setCancelModalSub(null); setCancelReason(""); }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Keep Active
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancellingId !== null}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50"
              >
                {cancellingId ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
