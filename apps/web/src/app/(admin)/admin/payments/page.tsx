"use client";

import { useEffect, useState } from "react";
import { 
  Receipt, 
  MagnifyingGlass, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CurrencyInr,
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  ArrowSquareOut
} from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  gateway: string;
  orderId?: string;
  paymentId?: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  purpose: string;
  targetId?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purposeFilter, setPurposeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ successVolume: 0, successCount: 0, failedCount: 0, pendingCount: 0 });

  async function fetchPayments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        status: statusFilter,
        purpose: purposeFilter,
        search,
      });
      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch payments:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, purposeFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Receipt weight="fill" className="text-blue-600 dark:text-blue-400" />
            Payment Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete audit trail of all gateway payments, Razorpay order IDs, status verifications, and wallet recharges.
          </p>
        </div>
        <button
          onClick={() => fetchPayments()}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ArrowsClockwise weight="bold" className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Successful Volume</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CurrencyInr weight="bold" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">
            ₹{stats.successVolume.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cleared platform payments</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Orders</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <CheckCircle weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.successCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Successful transactions</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Failed / Aborted</span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <XCircle weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-3">
            {stats.failedCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Declined or abandoned</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Orders</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.pendingCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting webhook confirmation</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {["ALL", "SUCCESS", "FAILED", "PENDING"].map((st) => (
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

          {/* Purpose Filter */}
          <select
            value={purposeFilter}
            onChange={(e) => { setPurposeFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Purposes</option>
            <option value="WALLET_RECHARGE">Wallet Recharge</option>
            <option value="SUBSCRIPTION">Subscription</option>
            <option value="DIRECT_CALL">Direct Call</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-xs">
          <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search Order ID, payment ID, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Gateway IDs</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <ArrowsClockwise className="animate-spin text-base" /> Loading payment records...
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={p.user.avatar} name={p.user.name} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{p.user.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {p.purpose.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500 space-y-0.5">
                      {p.orderId && <div>Ord: {p.orderId}</div>}
                      {p.paymentId ? (
                        <div className="text-slate-700 dark:text-slate-300 font-semibold">Pay: {p.paymentId}</div>
                      ) : (
                        <div className="italic text-slate-400">No payment ID</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle weight="fill" /> Success
                        </span>
                      ) : p.status === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <XCircle weight="fill" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock weight="fill" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleTimeString()}</div>
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
            Showing {payments.length} of {totalCount} records
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
