"use client";

import { useEffect, useState } from "react";
import { 
  ClockCounterClockwise, 
  MagnifyingGlass, 
  ShieldCheck, 
  ShieldWarning, 
  UserCheck, 
  Wallet, 
  CaretLeft, 
  CaretRight, 
  ArrowsClockwise 
} from "@phosphor-icons/react";

interface AuditLogItem {
  id: string;
  action: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        action: actionFilter,
        search,
      });
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  }

  function getActionBadge(action: string) {
    if (action.includes("WALLET") || action.includes("CREDIT") || action.includes("DEBIT")) {
      return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
    }
    if (action.includes("BAN") || action.includes("SUSPEND") || action.includes("DELETE") || action.includes("CANCEL")) {
      return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800";
    }
    if (action.includes("MENTOR") || action.includes("APPROVE") || action.includes("REJECT")) {
      return "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
    }
    return "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <ClockCounterClockwise weight="fill" className="text-blue-600 dark:text-blue-400" />
            Audit Logs & Security Trails
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable log of all administrative interventions, moderation decisions, configuration changes, and wallet adjustments.
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ArrowsClockwise weight="bold" className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Action Category Filter */}
        <div className="flex flex-wrap rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {[
            { label: "All Events", value: "ALL" },
            { label: "Wallets", value: "WALLET" },
            { label: "Mentors", value: "MENTOR" },
            { label: "Subscriptions", value: "SUBSCRIPTION" },
            { label: "Calls", value: "CALL" },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => { setActionFilter(pill.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                actionFilter === pill.value
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-xs">
          <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search action, target ID, admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Actor (Admin)</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Target ID</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <ArrowsClockwise className="animate-spin text-base" /> Loading audit logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getActionBadge(log.action)}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{log.user.name}</div>
                          <div className="text-[11px] text-slate-500">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">System / Webhook</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                        {log.details || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {log.targetId ? log.targetId.slice(0, 12) + "..." : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</div>
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
            Showing {logs.length} of {totalCount} events
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
    </div>
  );
}
