"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/currency";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { 
  DownloadSimple, 
  Printer, 
  ArrowsClockwise, 
  Users, 
  UserCheck, 
  Wallet, 
  Clock, 
  Crown,
  ChatCircleText,
  Tag,
  Money,
  FilePdf,
  FunnelSimple
} from "@phosphor-icons/react";

interface ReportSummary {
  totalStudents: number;
  totalMentors: number;
  pendingMentors: number;
  activeSubscriptions: number;
  totalWalletRecharges: number;
  totalChatVolume: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalAmount: number;
}

type ReportType = "transactions" | "chats" | "withdrawals" | "users" | "subscriptions" | "coupons" | "mentor-earnings";

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (res.ok && data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getQueryString(type: ReportType, format: "csv" | "pdf") {
    let url = `/api/admin/reports?export=${format}&type=${type}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    return url;
  }

  function downloadCSV(type: ReportType) {
    window.open(getQueryString(type, "csv"), "_blank");
  }

  function viewPrintablePDF(type: ReportType) {
    window.open(getQueryString(type, "pdf"), "_blank");
  }

  function handlePrintExecutive() {
    window.print();
  }

  const reportCards: { type: ReportType; title: string; subtitle: string; icon: any }[] = [
    {
      type: "transactions",
      title: "Transactions Ledger",
      subtitle: "Credits, Debits, Wallet Top-ups & Gateway Payments",
      icon: Wallet,
    },
    {
      type: "chats",
      title: "Chat Sessions & Consultations",
      subtitle: "Completed Sessions, Durations, Rates & Free Trial Usage",
      icon: ChatCircleText,
    },
    {
      type: "withdrawals",
      title: "Payouts & Settlements",
      subtitle: "Mentor Withdrawal Requests, UPI VPAs & Payment Status",
      icon: Money,
    },
    {
      type: "users",
      title: "Registered Users Directory",
      subtitle: "Students, Mentors, Admins, Phone Numbers & Status",
      icon: Users,
    },
    {
      type: "subscriptions",
      title: "Active & Past Subscriptions",
      subtitle: "Monthly Mentorship Passes, Durations & Revenue",
      icon: Crown,
    },
    {
      type: "coupons",
      title: "Promotional Coupons & Usages",
      subtitle: "Discount Codes, Max Limits, Expiration & Usage Audits",
      icon: Tag,
    },
    {
      type: "mentor-earnings",
      title: "Mentor Pricing & Rates Directory",
      subtitle: "Mentor Hourly/Minute/Monthly Rates & Verified Ratings",
      icon: UserCheck,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12 print:max-w-full print:p-0">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 print:border-b-2 print:border-black">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight print:text-black">
            Platform Executive Metrics & Ledgers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 print:text-slate-600">
            Real-time analytics summary and financial audit report. Generated on {new Date().toLocaleDateString("en-IN")}.
          </p>
        </div>

        <div className="flex items-center gap-3 no-print">
          <button
            onClick={handlePrintExecutive}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer weight="bold" />
            <span>Print Executive Page (PDF)</span>
          </button>
          <button
            onClick={fetchSummary}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Metrics"
          >
            <ArrowsClockwise weight="bold" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12">
          <AdminLoader message="Loading metrics..." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print-card">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Registered Students</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 print:text-black">{summary?.totalStudents ?? 0}</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print-card">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Active Mentors</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 print:text-black">{summary?.totalMentors ?? 0}</p>
              <p className="text-xs font-bold text-amber-500 mt-1">{summary?.pendingMentors ?? 0} Pending Review</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print-card">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Wallet Recharges</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 print:text-black">
                {formatINR(summary?.totalWalletRecharges ?? 0)}
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print-card">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pending Payout Requests</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 print:text-black">
                {formatINR(summary?.pendingWithdrawalAmount ?? 0)}
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{summary?.pendingWithdrawalsCount ?? 0} Pending Requests</p>
            </div>
          </div>

          {/* Export section - hidden when printing PDF report */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs no-print space-y-6 mt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <DownloadSimple weight="bold" className="text-indigo-600 dark:text-indigo-400" /> Export Database Ledgers &amp; Statements
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Download raw CSV spreadsheets or generate printable PDF audit statements for compliance and tax reconciliation.
                </p>
              </div>

              {/* Date Filter */}
              <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <FunnelSimple weight="bold" /> Date:
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Start Date"
                />
                <span className="text-xs text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="End Date"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="text-xs font-bold text-rose-500 hover:underline px-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportCards.map((report) => {
                const IconComponent = report.icon;
                return (
                  <div
                    key={report.type}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                        <IconComponent weight="duotone" className="text-xl" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{report.title}</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{report.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                      <button
                        onClick={() => downloadCSV(report.type)}
                        className="flex-1 px-3 py-2 rounded-xl font-extrabold text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <DownloadSimple weight="bold" className="text-indigo-500" />
                        CSV Ledger
                      </button>
                      <button
                        onClick={() => viewPrintablePDF(report.type)}
                        className="flex-1 px-3 py-2 rounded-xl font-extrabold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <FilePdf weight="bold" className="text-rose-400 dark:text-rose-600" />
                        PDF Audit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
