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
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
          <Receipt weight="fill" /> Financial Transactions
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Payment History
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          View your complete transaction history across wallet recharges, mentor subscriptions, and pay-per-minute sessions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 overflow-x-auto whitespace-nowrap">
          {[
            { label: "All Records", value: "ALL" },
            { label: "Wallet Ledger", value: "WALLET" },
            { label: "Subscriptions", value: "SUBSCRIPTIONS" },
            { label: "Gateway Payments", value: "GATEWAY" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Receipt className="mx-auto text-4xl text-slate-400" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No transactions found</h3>
          <p className="text-xs text-slate-500">There are no records matching your current filter on this page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((tx) => {
            const isCredit = tx.type === "WALLET_LEDGER" && tx.purpose?.includes("CREDIT");
            return (
              <div
                key={tx.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 font-bold ${
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

                  <div className="space-y-1">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      {tx.purpose?.replace(/_/g, " ") || tx.type}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                        tx.status === "SUCCESS" || tx.status === "ACTIVE"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : tx.status === "FAILED"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                      <span>{new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString()}</span>
                      {tx.reference && (
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          Ref: {tx.reference.slice(0, 16)}
                        </span>
                      )}
                    </div>
                    {tx.description && (
                      <p className="text-[11px] text-slate-500 italic">{tx.description}</p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className={`text-lg font-black ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                    {isCredit ? "+" : "-"}₹{tx.amount.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">INR</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
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
