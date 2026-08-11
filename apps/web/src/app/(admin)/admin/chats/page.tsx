"use client";

import { useEffect, useState } from "react";
import { 
  ChatCircleDots, 
  MagnifyingGlass, 
  Clock, 
  CurrencyInr, 
  CheckCircle, 
  XCircle, 
  CaretLeft, 
  CaretRight, 
  ArrowsClockwise,
  Eye,
  X,
  Paperclip
} from "@phosphor-icons/react";

interface SessionListItem {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "PENDING";
  startTime: string;
  endTime?: string;
  perMinuteRate: number;
  totalCharge: number;
  durationMinutes: number;
  isFreeTrial: boolean;
  createdAt: string;
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
  _count: {
    messages: number;
  };
}

interface MessageItem {
  id: string;
  content: string;
  attachments: string[];
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

interface DetailedSession {
  id: string;
  status: string;
  perMinuteRate: number;
  totalCharge: number;
  durationMinutes: number;
  student: { name: string; email: string };
  mentor: { name: string; email: string };
  messages: MessageItem[];
}

export default function AdminChatsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ activeSessions: 0, completedSessions: 0, totalRevenue: 0, totalMinutes: 0 });

  // Transcript inspection modal
  const [inspectModalSessionId, setInspectModalSessionId] = useState<string | null>(null);
  const [detailedSession, setDetailedSession] = useState<DetailedSession | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  async function fetchSessions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/chats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch chat sessions:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, [page, statusFilter]);

  async function openTranscript(sessionId: string) {
    setInspectModalSessionId(sessionId);
    setTranscriptLoading(true);
    try {
      const res = await fetch(`/api/admin/chats?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailedSession(data.session);
      }
    } catch (e) {
      console.error("Failed to load transcript:", e);
    } finally {
      setTranscriptLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchSessions();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <ChatCircleDots weight="fill" className="text-blue-600 dark:text-blue-400" />
            Chat Sessions & Live Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of active chat sessions, pay-per-minute billing audits, and dispute transcript inspections.
          </p>
        </div>
        <button
          onClick={() => fetchSessions()}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ArrowsClockwise weight="bold" className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Active Chats</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.activeSessions}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Live in progress</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Chats</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <CheckCircle weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.completedSessions}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Successfully concluded</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Minutes Billed</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Clock weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-3">
            {stats.totalMinutes.toLocaleString("en-IN")} min
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cumulative live mentoring time</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chat Revenue Volume</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CurrencyInr weight="bold" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">
            ₹{stats.totalRevenue.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Gross pay-per-min charges</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Status Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

      {/* Chat Sessions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Mentor</th>
                <th className="px-6 py-4">Rate & Duration</th>
                <th className="px-6 py-4">Total Billed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Messages</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <ArrowsClockwise className="animate-spin text-base" /> Loading chat sessions...
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No chat sessions found matching your filters.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{s.student.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{s.student.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{s.mentor.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{s.mentor.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-[11px]">
                      <div>Rate: ₹{s.perMinuteRate}/min</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {s.durationMinutes} min {s.isFreeTrial && "(Free Trial)"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                      ₹{s.totalCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {s.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Active
                        </span>
                      ) : s.status === "COMPLETED" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {s.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                      {s._count.messages} msgs
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openTranscript(s.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold transition"
                      >
                        <Eye weight="bold" /> Inspect
                      </button>
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
            Showing {sessions.length} of {totalCount} sessions
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

      {/* Transcript Inspection Modal */}
      {inspectModalSessionId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ChatCircleDots weight="bold" className="text-blue-600" />
                  Chat Transcript Audit
                </h3>
                {detailedSession && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Student: {detailedSession.student.name} • Mentor: {detailedSession.mentor.name} • Billed: ₹{detailedSession.totalCharge} ({detailedSession.durationMinutes}m)
                  </p>
                )}
              </div>
              <button
                onClick={() => { setInspectModalSessionId(null); setDetailedSession(null); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X weight="bold" className="text-lg" />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
              {transcriptLoading ? (
                <div className="text-center py-16 text-slate-400 flex items-center justify-center gap-2">
                  <ArrowsClockwise className="animate-spin text-base" /> Loading messages...
                </div>
              ) : !detailedSession || detailedSession.messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  No messages recorded for this chat session.
                </div>
              ) : (
                detailedSession.messages.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {m.sender.name}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                          {m.sender.role}
                        </span>
                      </span>
                      <span className="text-slate-400 text-[10px]">{new Date(m.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{m.content}</p>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {m.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 underline"
                          >
                            <Paperclip /> Attachment {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => { setInspectModalSessionId(null); setDetailedSession(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
