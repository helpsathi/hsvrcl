"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  CalendarPlus, VideoCamera, Users, Clock, CheckCircle, ArrowSquareOut,
  Sparkle, SealCheck, ArrowsClockwise, WarningCircle, CalendarCheck, CurrencyInr,
  ChatCircleText
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReviewModal from "@/components/mentors/ReviewModal";
import SubscriptionCheckoutModal from "@/components/mentors/SubscriptionCheckoutModal";

interface SubscribedMentor {
  id: string;
  profileId: string;
  name: string;
  avatar: string;
  tagline: string;
  isOnline: boolean;
  languages: string[];
  rating: number;
  monthlyPrice?: number;
  subscription?: {
    id: string;
    endDate: string;
    daysLeft: number;
    isExpired?: boolean;
    status?: string;
    autoRenew?: boolean;
    paymentMethod?: string;
    razorpaySubId?: string | null;
  };
}

interface SessionProposal {
  id: string;
  title: string;
  description: string | null;
  proposedAt: string;
  durationMinutes: number;
  targetType: string;
  expiresAt: string;
  status: string;
  mentor: {
    id: string;
    user: { id: string; name: string; avatar: string | null };
  };
  acceptances: { id: string; acceptedAt: string; scheduledChatId: string | null }[];
}

export default function MyMentorsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [mentors, setMentors] = useState<SubscribedMentor[]>([]);
  const [proposals, setProposals] = useState<SessionProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [initiatingChatMentorId, setInitiatingChatMentorId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reviewingMentor, setReviewingMentor] = useState<{ id: string; name: string } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [togglingAutoPayId, setTogglingAutoPayId] = useState<string | null>(null);
  const [cancelingSub, setCancelingSub] = useState<{ id: string; name: string } | null>(null);
  const [cancelingLoading, setCancelingLoading] = useState(false);
  const [selectedMentorForUpi, setSelectedMentorForUpi] = useState<SubscribedMentor | null>(null);
  const [subFilter, setSubFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [mentorRes, proposalRes] = await Promise.all([
        fetch("/api/mentors/subscribed"),
        fetch("/api/session-proposals"),
      ]);
      const [mentorData, proposalData] = await Promise.all([
        mentorRes.json(),
        proposalRes.json(),
      ]);
      if (mentorRes.ok) {
        setMentors(mentorData.mentors || []);
        if (typeof mentorData.walletBalance === "number") {
          setWalletBalance(mentorData.walletBalance);
        }
      }
      if (proposalRes.ok) setProposals(proposalData.proposals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const handleToggleAutoPay = async (subscriptionId: string, currentAutoRenew: boolean) => {
    setTogglingAutoPayId(subscriptionId);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/subscriptions/toggle-autopay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, autoRenew: !currentAutoRenew }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle AutoPay");
      setSuccessMsg(!currentAutoRenew ? "AutoPay enabled successfully! 🔄" : "AutoPay turned off. Your free calls remain active until expiration. ⏸️");
      setMentors(prev => prev.map(m => m.subscription?.id === subscriptionId ? { ...m, subscription: { ...m.subscription, autoRenew: data.autoRenew } } : m));
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setTogglingAutoPayId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelingSub) return;
    setCancelingLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: cancelingSub.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel subscription");
      setSuccessMsg(`Mentorship subscription with ${cancelingSub.name} has been cancelled.`);
      setCancelingSub(null);
      fetchAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCancelingLoading(false);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    setAcceptingId(proposalId);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/session-proposals/${proposalId}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept proposal");
      setSuccessMsg(`Session booked! ${data.isFree ? "It's FREE as part of your subscription 🎉" : `₹${data.scheduledCall?.estimatedCost} deducted.`} Google Meet invite sent to your email.`);
      // Refresh proposals
      const proposalRes = await fetch("/api/session-proposals");
      const proposalData = await proposalRes.json();
      if (proposalRes.ok) setProposals(proposalData.proposals || []);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleStartChat = async (mentorProfileId: string, name?: string, avatar?: string) => {
    setInitiatingChatMentorId(mentorProfileId);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/chats/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId: mentorProfileId }),
      });
      const data = await res.json();
      if (res.ok && data.chatId) {
        let url = `/chats/${data.chatId}`;
        const params = new URLSearchParams();
        if (name) params.append("name", name);
        if (avatar) params.append("avatar", avatar);
        if (params.toString()) url += `?${params.toString()}`;
        router.push(url);
      } else {
        setErrorMsg(data.error || "Failed to initiate chat session");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate chat session");
    } finally {
      setInitiatingChatMentorId(null);
    }
  };

  const openProposals = proposals.filter(p => p.acceptances.length === 0 && p.status === "OPEN");
  const acceptedProposals = proposals.filter(p => p.acceptances.length > 0);

  if (loading) {
    const { MyMentorsSkeleton } = require("@/components/ui/Skeleton");
    return <MyMentorsSkeleton />;
  }

  return (
    <div className="w-full min-h-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Mentors</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Your subscribed mentors, session proposals, and booking portal</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Users className="text-base" /> Discover More Mentors
          </Link>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
            <CheckCircle weight="fill" className="text-2xl shrink-0 mt-0.5" />
            <p className="font-semibold text-sm">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
            <WarningCircle weight="fill" className="text-2xl shrink-0 mt-0.5" />
            <p className="font-semibold text-sm">{errorMsg}</p>
          </div>
        )}

        {/* === OPEN SESSION PROPOSALS === */}
        {openProposals.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Sparkle weight="fill" className="text-amber-500 text-lg animate-pulse" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Session Proposals from Your Mentors</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold">{openProposals.length} pending</span>
            </div>
            <div className="grid gap-4">
              {openProposals.map((proposal) => {
                const proposedDate = new Date(proposal.proposedAt);
                const expiresDate = new Date(proposal.expiresAt);
                const isExpiringSoon = (expiresDate.getTime() - Date.now()) < 24 * 60 * 60 * 1000;
                return (
                  <div key={proposal.id} className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-200/80 dark:border-amber-700/40 shadow-xl shadow-amber-500/5 p-6">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"></div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Mentor avatar */}
                      <div className="flex items-center gap-3 shrink-0">
                        <img
                          src={proposal.mentor.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(proposal.mentor.user.name)}&background=random`}
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(proposal.mentor.user.name)}&background=random`; }}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-100 dark:border-amber-900"
                          alt={proposal.mentor.user.name}
                        />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">From your mentor</p>
                          <p className="font-bold text-slate-900 dark:text-white">{proposal.mentor.user.name}</p>
                        </div>
                      </div>

                      {/* Proposal details */}
                      <div className="flex-1 space-y-1">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{proposal.title}</h3>
                        {proposal.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{proposal.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                            <CalendarCheck className="text-sm" />
                            {proposedDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at {proposedDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            <Clock className="text-sm" /> {proposal.durationMinutes} min session
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                            <Sparkle weight="fill" className="text-sm" /> FREE for subscribers
                          </span>
                          {isExpiringSoon && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg animate-pulse">
                              <WarningCircle className="text-sm" /> Expires soon!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Accept button */}
                      <button
                        onClick={() => handleAcceptProposal(proposal.id)}
                        disabled={acceptingId === proposal.id}
                        className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100"
                      >
                        {acceptingId === proposal.id ? (
                          <><ArrowsClockwise className="animate-spin text-lg" /> Booking...</>
                        ) : (
                          <><CheckCircle weight="fill" className="text-lg" /> Accept (Free)</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* === YOUR SUBSCRIBED MENTORS === */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <SealCheck weight="fill" className="text-indigo-500 text-lg" />
              </div>
              Your Subscriptions
            </h2>

            {mentors.length > 0 && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
                <button
                  onClick={() => setSubFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    subFilter === "ALL"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All ({mentors.length})
                </button>
                <button
                  onClick={() => setSubFilter("ACTIVE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    subFilter === "ACTIVE"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                >
                  Active ({mentors.filter(m => !m.subscription?.isExpired).length})
                </button>
                <button
                  onClick={() => setSubFilter("EXPIRED")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    subFilter === "EXPIRED"
                      ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                  }`}
                >
                  Expired ({mentors.filter(m => m.subscription?.isExpired).length})
                </button>
              </div>
            )}
          </div>

          {mentors.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
              <Users className="text-5xl text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">No subscribed mentors yet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Subscribe to a mentor to unlock free calls, session proposals, and exclusive group sessions.</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-lg"
              >
                <Users weight="fill" /> Browse Mentors
              </Link>
            </div>
          ) : mentors.filter(m => subFilter === "ALL" || (subFilter === "ACTIVE" && !m.subscription?.isExpired) || (subFilter === "EXPIRED" && m.subscription?.isExpired)).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No {subFilter.toLowerCase()} subscriptions found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {mentors
                .filter(m => subFilter === "ALL" || (subFilter === "ACTIVE" && !m.subscription?.isExpired) || (subFilter === "EXPIRED" && m.subscription?.isExpired))
                .map((mentor) => (
                <div key={mentor.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-shadow p-5 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={mentor.avatar}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100 dark:border-indigo-900/50 shadow"
                        alt={mentor.name}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/mentor-placeholder.png"; }}
                      />
                      {mentor.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{mentor.name}</h3>
                        <SealCheck weight="fill" className="text-indigo-500 text-base" />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">{mentor.tagline}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${mentor.isOnline ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                          {mentor.isOnline ? "● Online" : "○ Offline"}
                        </span>
                        {mentor.subscription?.isExpired ? (
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-200 dark:border-rose-800">
                            <WarningCircle weight="fill" className="text-sm" /> Subscription Expired
                          </span>
                        ) : (
                          <>
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkle weight="fill" className="text-xs" /> Free calls included ({mentor.subscription?.daysLeft ?? 30} days left)
                            </span>
                            {mentor.subscription && (
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${mentor.subscription.autoRenew ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"}`}>
                                <ArrowsClockwise weight="bold" className="text-xs" />
                                AutoPay: {mentor.subscription.autoRenew ? `ON (${mentor.subscription.paymentMethod === "RAZORPAY" ? "UPI/Cards" : "Wallet"})` : "OFF"}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 md:shrink-0 ml-auto">
                    {mentor.subscription?.isExpired ? (
                      <button
                        onClick={() => setSelectedMentorForUpi(mentor)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-extrabold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] animate-pulse"
                      >
                        <ArrowsClockwise weight="bold" className="text-base" />
                        Renew Subscription
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* Primary Action 1: Book Call */}
                        <button
                          onClick={() => router.push(`/book-call/${mentor.profileId}`)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <CalendarPlus weight="fill" className="text-base" />
                          Book <span className="hidden sm:inline">Call</span>
                        </button>

                        {/* Primary Action 2: Chat */}
                        <button
                          onClick={() => handleStartChat(mentor.profileId || mentor.id, mentor.name, mentor.avatar || '')}
                          disabled={initiatingChatMentorId === (mentor.profileId || mentor.id)}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-sm font-bold border border-indigo-200/60 dark:border-indigo-800/40 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
                        >
                          <ChatCircleText weight="bold" className={`text-base ${initiatingChatMentorId === (mentor.profileId || mentor.id) ? "animate-spin" : ""}`} />
                          {initiatingChatMentorId === (mentor.profileId || mentor.id) ? "Connecting" : "Chat"}
                        </button>
                      </div>
                    )}

                    {/* Manage Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === mentor.id ? null : mentor.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold border border-slate-200/60 dark:border-slate-700/60 transition-all hover:-translate-y-0.5"
                      >
                        Manage
                        <svg className={`w-4 h-4 transition-transform ${openDropdownId === mentor.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>

                      {/* Dropdown Menu Overlay */}
                      {openDropdownId === mentor.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            
                            <Link
                              href={`/mentors/${mentor.profileId}`}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors w-full text-left"
                            >
                              <ArrowSquareOut weight="bold" className="text-slate-400" /> View Profile
                            </Link>

                            <button
                              onClick={() => { setReviewingMentor({ id: mentor.profileId, name: mentor.name }); setOpenDropdownId(null); }}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-amber-600 dark:text-amber-500 transition-colors w-full text-left"
                            >
                              <Sparkle weight="fill" className="text-amber-500" /> Rate Mentor
                            </button>

                            {!mentor.subscription?.isExpired && mentor.subscription && (
                              <>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-3"></div>
                                
                                <button
                                  onClick={() => { handleToggleAutoPay(mentor.subscription!.id, !!mentor.subscription!.autoRenew); setOpenDropdownId(null); }}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors w-full text-left"
                                >
                                  <ArrowsClockwise weight="bold" className="text-slate-400" />
                                  {mentor.subscription.autoRenew ? "Disable AutoPay" : "Enable AutoPay"}
                                </button>

                                {(mentor.subscription?.daysLeft ?? 30) <= 5 && (
                                  <button
                                    onClick={() => { setSelectedMentorForUpi(mentor); setOpenDropdownId(null); }}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-emerald-600 dark:text-emerald-500 transition-colors w-full text-left"
                                  >
                                    <CurrencyInr weight="bold" className="text-emerald-500" /> Renew Early
                                  </button>
                                )}

                                <button
                                  onClick={() => { setCancelingSub({ id: mentor.subscription!.id, name: mentor.name }); setOpenDropdownId(null); }}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-rose-600 dark:text-rose-500 transition-colors w-full text-left"
                                >
                                  <WarningCircle weight="fill" className="text-rose-500" /> Cancel Subscription
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* === ACCEPTED PROPOSALS === */}
        {acceptedProposals.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <CalendarCheck weight="fill" className="text-emerald-500 text-lg" />
              </div>
              Accepted Sessions
            </h2>
            <div className="grid gap-3">
              {acceptedProposals.map((proposal) => (
                <div key={proposal.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <CheckCircle weight="fill" className="text-2xl text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{proposal.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {new Date(proposal.proposedAt).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST • {proposal.durationMinutes} min • with {proposal.mentor.user.name}
                    </p>
                  </div>
                  {proposal.acceptances[0]?.scheduledChatId && (
                    <Link
                      href={`/scheduled-calls`}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <VideoCamera className="text-sm" /> View in Schedule
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ReviewModal
        mentorId={reviewingMentor?.id || ""}
        mentorName={reviewingMentor?.name || ""}
        isOpen={!!reviewingMentor}
        onClose={() => setReviewingMentor(null)}
        onSuccess={() => {}}
      />

      {selectedMentorForUpi && (
        <SubscriptionCheckoutModal
          isOpen={!!selectedMentorForUpi}
          onClose={() => setSelectedMentorForUpi(null)}
          mentor={{
            id: selectedMentorForUpi.profileId,
            name: selectedMentorForUpi.name,
            avatar: selectedMentorForUpi.avatar,
            monthlyPrice: selectedMentorForUpi.monthlyPrice || 999,
            categories: selectedMentorForUpi.languages || ["Mentorship"],
          }}
          user={user ? { name: user.name, email: user.email } : null}
          onSubscriptionSuccess={() => {
            setSelectedMentorForUpi(null);
            setSuccessMsg("Subscription renewed and AutoPay set up successfully! 🎉");
            fetchAll();
          }}
          defaultPaymentMethod="RAZORPAY"
        />
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {cancelingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-500 shrink-0">
                <WarningCircle weight="fill" className="text-3xl" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg">Cancel Mentorship Subscription?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">With {cancelingSub.name}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Are you sure you want to cancel your ongoing subscription? You will immediately lose access to included free calls, priority session proposals, and active benefits.
            </p>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5 font-semibold">
              <span>💡 Tip: If you only want to stop next month&apos;s automatic renewal without losing today&apos;s active free calls, close this window and use the <b>Disable AutoPay</b> button instead!</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelingSub(null)}
                disabled={cancelingLoading}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelingLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-lg shadow-rose-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {cancelingLoading ? "Cancelling..." : "Yes, Cancel Immediately"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
