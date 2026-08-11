"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Receipt, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle, 
  CurrencyInr,
  ArrowsClockwise,
  PlusCircle
} from "@phosphor-icons/react";

interface HistoryItem {
  id: string;
  type: "PAYMENT_GATEWAY" | "WALLET_LEDGER" | "SUBSCRIPTION_CHARGE";
  purpose: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  reference?: string;
  description?: string;
}

export default function PaymentHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  async function fetchHistory(pageParam: number = page) {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/history?page=${pageParam}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.total);
        }
      }
    } catch (e) {
      console.error("Failed to load payment history:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const filteredHistory = history.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "WALLET") return item.type === "WALLET_LEDGER";
    if (filter === "SUBSCRIPTIONS") return item.type === "SUBSCRIPTION_CHARGE";
    if (filter === "GATEWAY") return item.type === "PAYMENT_GATEWAY";
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-6 sm:pb-12 px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
          <Receipt weight="fill" /> Financial Transactions
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Payment History
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed wrap-break-word">
          View your complete transaction history across wallet recharges, mentor subscriptions, and pay-per-minute sessions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 w-full min-w-0">
        <div className="flex flex-1 min-w-0 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          {[
            { label: "All Records", value: "ALL" },
            { label: "Wallet Ledger", value: "WALLET" },
            { label: "Subscriptions", value: "SUBSCRIPTIONS" },
            { label: "Gateway Payments", value: "GATEWAY" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setPage(1); }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                filter === tab.value
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchHistory(page)}
          className="p-2 shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold"
          title="Refresh History"
        >
          <ArrowsClockwise weight="bold" className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Transaction Feed */}
      {loading ? (
        <div className="space-y-3 w-full">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse w-full" />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3 w-full">
          <Receipt className="mx-auto text-4xl text-slate-400" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No transactions found</h3>
          <p className="text-xs text-slate-500">There are no records matching your current filter on this page.</p>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {filteredHistory.map((tx) => {
            const isCredit = 
              (tx.type === "WALLET_LEDGER" && (tx.purpose?.includes("CREDIT") || tx.purpose?.includes("RECHARGE"))) ||
              tx.purpose === "WALLET_RECHARGE" ||
              tx.purpose?.toLowerCase().includes("recharge") ||
              tx.purpose?.toLowerCase().includes("credit");

            return (
              <div
                key={tx.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition w-full min-w-0 overflow-hidden"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-lg sm:text-xl shrink-0 font-bold mt-0.5 sm:mt-0 ${
                      isCredit
                        ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : tx.type === "SUBSCRIPTION_CHARGE"
                        ? "bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                        : "bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft weight="bold" />
                    ) : tx.type === "SUBSCRIPTION_CHARGE" ? (
                      <CreditCard weight="bold" />
                    ) : (
                      <ArrowUpRight weight="bold" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="truncate max-w-full">{tx.purpose?.replace(/_/g, " ") || tx.type}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 ${
                        tx.status === "SUCCESS" || tx.status === "ACTIVE"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : tx.status === "FAILED"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="shrink-0">{new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })} at {new Date(tx.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      {tx.reference && (
                        <span className="font-mono text-[10px] sm:text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 truncate max-w-[200px] sm:max-w-none">
                          Ref: {tx.reference.slice(0, 16)}
                        </span>
                      )}
                    </div>
                    {tx.description && (
                      <p className="text-[11px] text-slate-500 italic truncate max-w-full">{tx.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:block text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                  <span className="sm:hidden text-xs font-semibold text-slate-400">Amount</span>
                  <div>
                    <div className={`text-base sm:text-lg font-black ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                      {isCredit ? "+" : "-"}₹{tx.amount.toFixed(2)}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold block text-right sm:text-right">INR</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 w-full">
          <span className="text-xs text-slate-500 font-medium">
            Page {page} of {totalPages} ({totalRecords} records)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
