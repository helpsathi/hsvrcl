"use client";

import { useEffect, useState } from "react";
import { 
  Wallet, 
  MagnifyingGlass, 
  CurrencyInr, 
  PlusMinus, 
  CaretLeft, 
  CaretRight, 
  ArrowsClockwise, 
  LockKeyOpen,
  Lock,
  ArrowUpRight,
  ArrowDownLeft
} from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface WalletRecord {
  id: string;
  balance: number;
  lockedBalance: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "MENTOR" | "ADMIN";
    adminSubRole?: string | null;
    avatar?: string;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description?: string;
    createdAt: string;
  }>;
}

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalSystemBalance: 0, totalLockedBalance: 0, totalWalletsCount: 0 });

  // Modal state
  const [adjustModalUser, setAdjustModalUser] = useState<WalletRecord | null>(null);
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchWallets() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        role: roleFilter,
        search,
      });
      const res = await fetch(`/api/admin/wallets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWallets(data.wallets || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch wallets:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWallets();
  }, [page, roleFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchWallets();
  }

  async function handleAdjustSubmit() {
    if (!adjustModalUser) return;
    setAdjusting(true);
    try {
      const res = await fetch("/api/admin/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adjustModalUser.user.id,
          amount: parseFloat(adjustAmount),
          type: adjustType,
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", text: data.message || "Wallet updated successfully" });
        setAdjustModalUser(null);
        setAdjustAmount("");
        setAdjustReason("");
        fetchWallets();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to update wallet" });
      }
    } catch (e) {
      setFeedback({ type: "error", text: "Network error while adjusting wallet" });
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Wallet weight="fill" className="text-blue-600 dark:text-blue-400" />
            Wallets Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor real-time user balances, locked funds during active sessions, and execute administrative adjustments.
          </p>
        </div>
        <button
          onClick={() => fetchWallets()}
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total System Balance</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <CurrencyInr weight="bold" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            ₹{stats.totalSystemBalance.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Circulating user funds</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Locked In-Session Funds</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Lock weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-3">
            ₹{stats.totalLockedBalance.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Currently held during active chats</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Wallets Created</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Wallet weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.totalWalletsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered student & mentor accounts</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Role Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {["ALL", "STUDENT", "MENTOR"].map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === r
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {r === "ALL" ? "All Users" : r === "STUDENT" ? "Students" : "Mentors"}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Wallets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Available Balance</th>
                <th className="px-6 py-4">Locked Balance</th>
                <th className="px-6 py-4">Recent Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <ArrowsClockwise className="animate-spin text-base" /> Loading wallets...
                    </div>
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No wallets found matching your query.
                  </td>
                </tr>
              ) : (
                wallets.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={w.user.avatar} name={w.user.name} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{w.user.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{w.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        w.user.role === "MENTOR"
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                          : (w.user.role === "ADMIN" || w.user.adminSubRole)
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      }`}>
                        {w.user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white text-sm">
                      ₹{w.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                      {w.lockedBalance > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          ₹{w.lockedBalance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      {w.transactions.length > 0 ? (
                        <div>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {w.transactions[0].type.replace(/_/g, " ")}: ₹{w.transactions[0].amount}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(w.transactions[0].createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">No transactions</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setAdjustModalUser(w);
                          setAdjustType("CREDIT");
                          setAdjustAmount("");
                          setAdjustReason("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-[11px] font-bold transition"
                      >
                        <PlusMinus weight="bold" /> Adjust
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
            Showing {wallets.length} of {totalCount} wallets
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

      {/* Manual Adjust Modal */}
      {adjustModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
                <PlusMinus weight="bold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manual Wallet Adjustment</h3>
                <p className="text-xs text-slate-500">{adjustModalUser.user.name} ({adjustModalUser.user.email})</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Current Balance:</span>
              <span className="font-black text-slate-900 dark:text-white text-sm">
                ₹{adjustModalUser.balance.toFixed(2)}
              </span>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType("CREDIT")}
                className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  adjustType === "CREDIT"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <ArrowDownLeft weight="bold" /> Credit (+ Add)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType("DEBIT")}
                className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  adjustType === "DEBIT"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <ArrowUpRight weight="bold" /> Debit (- Deduct)
              </button>
            </div>

            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 250"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            {/* Reason input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Audit Reason (Required)</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="E.g., Customer support refund for session #123, offline payment adjustment..."
                rows={2}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustSubmit}
                disabled={adjusting || !adjustAmount || !adjustReason}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50"
              >
                {adjusting ? "Processing..." : `Confirm ${adjustType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
