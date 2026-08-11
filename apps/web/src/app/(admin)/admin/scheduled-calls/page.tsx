"use client";

import { useEffect, useState } from "react";
import { 
  CalendarCheck, 
  MagnifyingGlass, 
  Clock, 
  CheckCircle, 
  XCircle, 
  VideoCamera, 
  CaretLeft, 
  CaretRight, 
  ArrowsClockwise,
  ArrowSquareOut
} from "@phosphor-icons/react";

interface ScheduledCallItem {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "MISSED" | "RESCHEDULED" | "ACCEPTED" | "REJECTED";
  notes?: string;
  estimatedCost: number;
  meetLink?: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  mentor: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function AdminScheduledCallsPage() {
  const [calls, setCalls] = useState<ScheduledCallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ confirmedCount: 0, pendingCount: 0, completedCount: 0 });

  // Cancel Modal state
  const [cancelModalCall, setCancelModalCall] = useState<ScheduledCallItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchCalls() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/scheduled-calls?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch scheduled calls:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCalls();
  }, [page, statusFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchCalls();
  }

  async function handleCancelCall() {
    if (!cancelModalCall) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/admin/scheduled-calls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: cancelModalCall.id,
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", text: "Scheduled call cancelled successfully." });
        setCancelModalCall(null);
        setCancelReason("");
        fetchCalls();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to cancel call" });
      }
    } catch (e) {
      setFeedback({ type: "error", text: "Network error while cancelling call" });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarCheck weight="fill" className="text-blue-600 dark:text-blue-400" />
            Scheduled 1-on-1 Calls
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor booked video sessions, Google Meet integrations, scheduled time slots, and dispatch cancellations.
          </p>
        </div>
        <button
          onClick={() => fetchCalls()}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ArrowsClockwise weight="bold" className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirmed Upcoming</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">
            {stats.confirmedCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Scheduled on Google Meet</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Requests</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-3">
            {stats.pendingCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting mentor confirmation</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Calls</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <VideoCamera weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.completedCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Completed mentoring sessions</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Status Tabs */}
        <div className="flex flex-wrap rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {["ALL", "CONFIRMED", "PENDING", "COMPLETED", "CANCELLED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
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

      {/* Calls Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Mentor</th>
                <th className="px-6 py-4">Scheduled For</th>
                <th className="px-6 py-4">Duration & Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Meeting Link</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <ArrowsClockwise className="animate-spin text-base" /> Loading scheduled calls...
                    </div>
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No scheduled calls found matching your filters.
                  </td>
                </tr>
              ) : (
                calls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.student.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.student.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.mentor.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.mentor.email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{new Date(c.scheduledAt).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-500">{new Date(c.scheduledAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-[11px]">
                      <div className="font-bold text-slate-900 dark:text-white">{c.durationMinutes} minutes</div>
                      <div>₹{c.estimatedCost}</div>
                    </td>
                    <td className="px-6 py-4">
                      {c.status === "CONFIRMED" || c.status === "ACCEPTED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle weight="fill" /> Confirmed
                        </span>
                      ) : c.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock weight="fill" /> Pending
                        </span>
                      ) : c.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Completed
                        </span>
                      ) : c.status === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <XCircle weight="fill" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {c.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.meetLink ? (
                        <a
                          href={c.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Join Meet <ArrowSquareOut weight="bold" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status === "CONFIRMED" || c.status === "PENDING" ? (
                        <button
                          onClick={() => setCancelModalCall(c)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-[11px] font-bold transition"
                        >
                          Cancel Call
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {calls.length} of {totalCount} scheduled calls
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
      {cancelModalCall && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-xl font-bold">
                <XCircle weight="fill" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cancel Scheduled Call</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Cancel scheduled call for student <strong>{cancelModalCall.student.name}</strong> with mentor{" "}
              <strong>{cancelModalCall.mentor.name}</strong> on{" "}
              {new Date(cancelModalCall.scheduledAt).toLocaleString()}?
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g., Mentor unavailability, emergency cancellation..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setCancelModalCall(null); setCancelReason(""); }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Keep Call
              </button>
              <button
                onClick={handleCancelCall}
                disabled={cancelling}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
