"use client";

import { useState, useEffect } from "react";
import * as PhosphorIcons from "@phosphor-icons/react";
import { 
  Users, 
  CurrencyInr, 
  ChatCircleDots,
  ChalkboardTeacher,
  WarningCircle,
  CalendarCheck,
  CreditCard,
  Wallet,
  ArrowClockwise
} from "@phosphor-icons/react";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface AdminStats {
  adminName?: string;
  totalUsers: number;
  totalMentors: number;
  totalRevenue: number;
  subscriptionRevenue: number;
  chatRevenue: number;
  commissionRevenue: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  activeChats: number;
  pendingMentors: number;
  commissionRate: number;
  activeSubscriptions: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  scheduledCallsCount: number;
  recentUsers: any[];
  recentApplications: any[];
  trendData?: { date: string; day: string; revenue: number; users: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<{ status: string; issues: any[]; totalActiveIssues: number } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (res.ok && data.stats) {
        setStats(data.stats);
      } else {
        setError(data.error || "Failed to load admin stats from server.");
      }
    } catch (err: any) {
      console.error("Failed to fetch admin stats", err);
      setError(err?.message || "Failed to communicate with server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/admin/alerts");
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (e) {
      console.error("Failed to check system health", e);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESOLVE", alertId }),
      });
      // Immediately clear from UI
      setHealthData(prev => prev ? {
        ...prev,
        issues: prev.issues.filter((i: any) => i.id !== alertId),
        totalActiveIssues: Math.max(0, prev.issues.length - 1),
        status: prev.issues.length <= 1 ? "HEALTHY" : "ATTENTION"
      } : null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Skeleton Hero Card */}
        <div className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/40 dark:border-slate-700/50 p-8 rounded-[24px] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-pulse">
          <div className="relative z-10 w-full md:w-2/3">
            <div className="h-10 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg w-1/3"></div>
          </div>
          <div className="relative z-10 bg-white/20 dark:bg-slate-800/30 px-6 py-4 rounded-3xl w-full md:w-48 h-24"></div>
        </div>

        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-sm animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl"></div>
                <div className="w-12 h-6 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg"></div>
              </div>
              <div className="h-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg w-1/2 mb-3"></div>
              <div className="h-8 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-red-500/30 rounded-[28px] shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-3xl">
          <WarningCircle weight="duotone" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Unable to Load Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {error || "An unexpected error occurred while fetching platform statistics."}
          </p>
        </div>
        <button
          onClick={() => fetchStats()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 text-sm"
        >
          <ArrowClockwise weight="bold" className="text-base" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/90 to-purple-700/90 dark:from-blue-600/50 dark:to-purple-800/50 backdrop-blur-3xl border border-white/40 dark:border-slate-700/50 p-8 rounded-[24px] shadow-2xl shadow-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Welcome back, {stats.adminName || "Admin"}!</h1>
            <span className="bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              System Active
            </span>
          </div>
          <p className="text-blue-100 dark:text-blue-200/80 font-medium max-w-xl">
            Here's what's happening on your platform today. You have {stats.pendingMentors} pending applications that require your attention.
          </p>
        </div>
        <div className="relative z-10 bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-3xl flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-blue-200/80 uppercase tracking-wider">Platform Commission</span>
            <span className="text-3xl font-black text-white">{stats.commissionRate}%</span>
          </div>
        </div>
      </div>

      {/* Live System Health & Attention Alerts Widget */}
      {healthData && healthData.issues && healthData.issues.length > 0 && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner ${
              !healthData || healthData.status === "HEALTHY" 
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 animate-pulse"
            }`}>
              {!healthData || healthData.status === "HEALTHY" ? (
                <PhosphorIcons.ShieldCheck weight="duotone" />
              ) : (
                <PhosphorIcons.WarningCircle weight="duotone" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">System Health & Live Alerts</h2>
                <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                  !healthData || healthData.status === "HEALTHY"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-100 text-amber-900 dark:bg-amber-950/90 dark:text-amber-300 border border-amber-500/40 animate-pulse"
                }`}>
                  {!healthData || healthData.status === "HEALTHY" ? "🟢 0 Active Issues" : `⚠️ ${healthData.totalActiveIssues} Attention Needed`}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time automated diagnostics for dashboard categories, promotional offers, database connectivity, and sync logs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => { fetchStats(); fetchHealth(); }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <ArrowClockwise weight="bold" /> Refresh Status
            </button>
            <Link
              href="/admin/notifications"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
            >
              View Notification Log →
            </Link>
          </div>
        </div>

        {!healthData || (healthData.status === "HEALTHY" && healthData.issues.length === 0) ? (
          <div className="py-6 px-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col items-center justify-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500 mb-1">
              <PhosphorIcons.CheckCircle weight="fill" className="text-3xl" />
            </div>
            <p className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">All Platform Systems & Syncs Are Operational</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              Categories, promotional offers, database connection pools, and real-time messaging services are operating normally. Resolved alerts automatically disappear from this list.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {healthData.issues.map((issue: any) => (
              <div key={issue.id} className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-amber-500/15 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xl shrink-0 mt-0.5">
                    <PhosphorIcons.WarningCircle weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
                      {issue.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{issue.message}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      Action Required
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-amber-500/20">
                  {issue.link && (
                    <Link
                      href={issue.link}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition active:scale-95"
                    >
                      Configure & Fix →
                    </Link>
                  )}
                  <button
                    onClick={() => handleResolveAlert(issue.id)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1"
                  >
                    <PhosphorIcons.Check weight="bold" className="text-emerald-500" />
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {stats.pendingMentors > 0 && (
        <div className="bg-orange-500/10 backdrop-blur-xl border border-orange-500/30 p-5 rounded-[24px] flex items-center justify-between shadow-lg shadow-orange-500/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center">
              <WarningCircle weight="fill" className="text-orange-600 dark:text-orange-400 text-3xl" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 dark:text-orange-300 text-lg">Attention Needed</h3>
              <p className="text-sm text-orange-800/80 dark:text-orange-400/80 font-medium">There are {stats.pendingMentors} pending mentor applications awaiting your review.</p>
            </div>
          </div>
          <Link href="/admin/applications" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all">
            Review Now
          </Link>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
              <Users weight="fill" className="text-2xl" />
            </div>
            <span className="bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg">Users</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Students</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalUsers.toLocaleString()}</h3>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shadow-inner">
              <ChalkboardTeacher weight="fill" className="text-2xl" />
            </div>
            <span className="bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg">Mentors</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Active Mentors</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalMentors.toLocaleString()}</h3>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 dark:from-emerald-500/20 dark:to-emerald-600/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
              <CurrencyInr weight="fill" className="text-2xl" />
            </div>
            <span className="bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg">Volume</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Platform Volume</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">₹{stats.totalRevenue.toLocaleString()}</h3>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500/10 to-pink-600/10 dark:from-pink-500/20 dark:to-pink-600/20 border border-pink-500/20 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center shadow-inner">
              <ChatCircleDots weight="fill" className="text-2xl" />
            </div>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg">Live</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Active Chat Sessions</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.activeChats.toLocaleString()}</h3>
        </div>

      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Active Subscriptions</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeSubscriptions.toLocaleString()}</h4>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
            <CreditCard weight="duotone" />
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Pending Withdrawals</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{stats.pendingWithdrawalsAmount.toLocaleString()} <span className="text-sm text-slate-400 font-normal">({stats.pendingWithdrawalsCount})</span>
            </h4>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
            <Wallet weight="duotone" />
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Scheduled Calls</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats.scheduledCallsCount.toLocaleString()}</h4>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl font-bold">
            <CalendarCheck weight="duotone" />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Section */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">Revenue Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Subscription Revenue</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">₹{stats.subscriptionRevenue?.toLocaleString() || "0"}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Chat Revenue</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">₹{stats.chatRevenue?.toLocaleString() || "0"}</p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Platform Commission (Est.)</span>
            <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">₹{stats.commissionRevenue?.toLocaleString() || "0"}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">This Month Recharge</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">₹{stats.monthlyRevenue?.toLocaleString() || "0"}</p>
          </div>
        </div>
      </div>

      {/* 7-Day Performance & Trends Chart */}
      {stats.trendData && stats.trendData.length > 0 && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">7-Day Activity & Growth Trends</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily wallet deposits and new member signups over the last week</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-3 h-3 rounded bg-blue-500"></span> Revenue (₹)
              </span>
              <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <span className="w-3 h-3 rounded bg-purple-500"></span> Signups
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
            {(() => {
              const maxRev = Math.max(...stats.trendData.map((d: any) => d.revenue), 100);
              const maxUsers = Math.max(...stats.trendData.map((d: any) => d.users), 5);
              return stats.trendData.map((day: any) => {
                const revHeightPercent = Math.min(100, Math.max(8, (day.revenue / maxRev) * 100));
                const userHeightPercent = Math.min(100, Math.max(8, (day.users / maxUsers) * 100));
                return (
                  <div key={day.date} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap">
                      {day.day} ({day.date}): ₹{day.revenue} • {day.users} users
                    </div>
                    <div className="flex items-end gap-1 sm:gap-2 w-full justify-center h-full">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeightPercent}%` }}
                        className="w-3 sm:w-6 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all hover:brightness-110 shadow-sm"
                        title={`Revenue: ₹${day.revenue}`}
                      />
                      {/* User Signup Bar */}
                      <div
                        style={{ height: `${userHeightPercent}%` }}
                        className="w-3 sm:w-6 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg transition-all hover:brightness-110 shadow-sm"
                        title={`Users: ${day.users}`}
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 mt-2">{day.day}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">₹{day.revenue}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Recent Activity Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Recent Users */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Recent Registrations</h3>
            <Link href="/admin/users" className="text-sm font-bold text-brand-500 hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {stats.recentUsers?.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <UserAvatar src={user.avatar} name={user.name} size="md" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${user.role === 'MENTOR' ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}>{user.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Mentor Apps */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[24px] border border-white/50 dark:border-slate-800/50 shadow-xl shadow-blue-900/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Recent Applications</h3>
            <Link href="/admin/applications" className="text-sm font-bold text-brand-500 hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {stats.recentApplications?.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <UserAvatar src={app.user?.avatar} name={app.user?.name} size="md" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{app.user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${app.status === 'APPROVED' ? 'bg-success/10 text-success' : app.status === 'PENDING' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-danger/10 text-danger'}`}>{app.status}</span>
              </div>
            ))}
            {(!stats.recentApplications || stats.recentApplications.length === 0) && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent applications.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
