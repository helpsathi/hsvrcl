"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShareNetwork, SealCheck, Star, ChatCircleDots, PhoneCall, CheckCircle, WarningCircle, Spinner, ShieldCheck, Lightning, LockKey, Crown, ArrowsClockwise } from "@phosphor-icons/react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import ReviewModal from "@/components/mentors/ReviewModal";
import SubscriptionCheckoutModal from "@/components/mentors/SubscriptionCheckoutModal";
import { getRoleBadge } from "@/lib/roleBadge";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Mentor {
  id: string;
  userId: string;
  username?: string | null;
  name: string;
  avatar: string | null;
  role?: string | null;
  adminSubRole?: string | null;
  bio: string | null;
  categories: string[];
  skills: string[];
  languages: string[];
  experience: number;
  perMinutePrice: number;
  callPricePerMinute?: number;
  monthlyPrice: number;
  isOnline: boolean;
  avgRating: number;
  reviewCount: number;
  freeTrial: boolean;
  isSubscribed: boolean;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "NONE";
  totalSessions: number;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    studentName: string;
    studentAvatar: string | null;
    date: string;
  }[];
}

export default function MentorProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const mentorId = id as string;
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiatingChat, setInitiatingChat] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState("");
  const [chatError, setChatError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "EXPIRED" | "CANCELLED" | "NONE">("NONE");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);

  const fetchMentor = async () => {
    if (!mentorId) return;
    try {
      const res = await fetch(`/api/mentors/${mentorId}`);
      const data = await res.json();
      if (res.ok) {
        setMentor(data.mentor);
        setIsSubscribed(data.mentor.isSubscribed);
        if (data.mentor.subscriptionStatus) setSubStatus(data.mentor.subscriptionStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mentorId) return;
    fetchMentor();

    const fetchWallet = async () => {
      try {
        const res = await fetch("/api/wallet");
        const data = await res.json();
        if (res.ok) setWalletBalance(data.wallet?.balance ?? 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMentor();
    if (user) fetchWallet();
  }, [mentorId, user]);

  const handleChat = async () => {
    if (!mentor || !user) {
      router.push("/login");
      return;
    }
    setInitiatingChat(true);
    setChatError("");
    try {
      const res = await fetch("/api/chats/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId: mentor.userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requireRecharge) {
          throw new Error(`Need ₹${data.minRequired} to chat. Your balance: ₹${(walletBalance ?? 0).toFixed(0)}.`);
        }
        throw new Error(data.error || "Failed to start chat");
      }
      router.push(`/chats/${data.chatId}`);
    } catch (err: any) {
      setChatError(err.message);
      setInitiatingChat(false);
    }
  };

  if (loading) {
    const { MentorProfilePageSkeleton } = require("@/components/ui/Skeleton");
    return <MentorProfilePageSkeleton />;
  }

  if (!mentor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center max-w-xl mx-auto">
        <WarningCircle weight="fill" className="text-6xl text-amber-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Mentor Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">This mentor profile doesn't exist or is not currently active.</p>
        <Link href="/mentors" className="bg-brand-main dark:bg-brand-500 text-brand-950 dark:text-slate-950 px-6 py-3 rounded-2xl font-extrabold shadow-lg">Browse Mentors</Link>
      </div>
    );
  }

  const isSelf = user ? (user.id === mentor.userId || user.id === mentor.id) : false;

  return (
    <div className="w-full min-h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36 lg:pb-16 bg-transparent transition-colors animate-in fade-in">
      
      {/* Mobile Top Bar */}
      <div className="px-0 py-3 flex items-center justify-between sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 lg:hidden mb-4">
        <Link href="/mentors" className="p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="text-xl" />
        </Link>
        <h2 className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px]">
          {mentor.name} {isSelf && "(You)"}
        </h2>
        <button 
          onClick={() => {
            const shareUrl = `${window.location.origin}/mentors/${mentor?.username || mentorId}`;
            navigator.clipboard?.writeText(shareUrl);
            toast.success("Profile link copied to clipboard! 📋");
          }}
          className="p-2 -mr-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
          title="Copy profile link"
        >
          <ShareNetwork className="text-xl" />
        </button>
      </div>

      {/* Desktop Breadcrumb Bar */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <Link href="/mentors" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <ArrowLeft className="text-lg" /> Back to Mentors Directory
        </Link>
        <button 
          onClick={() => {
            const shareUrl = `${window.location.origin}/mentors/${mentor?.username || mentorId}`;
            navigator.clipboard?.writeText(shareUrl);
            toast.success("Profile link copied to clipboard! 📋");
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors" 
          title="Copy mentor link"
        >
          <ShareNetwork className="text-base text-brand-500" /> Share Profile
        </button>
      </div>

      {/* Main Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1.15fr] xl:grid-cols-[2fr_1fr] gap-8 items-start">
        
        {/* Left Column: Mentor Details & Specifications */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* Hero Profile Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 transition-colors">
            <div className="relative shrink-0">
              {mentor.avatar ? (
                <img 
                  src={mentor.avatar} 
                  alt={mentor.name} 
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/mentor-placeholder.png"; }}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-2 border-slate-200 dark:border-slate-700 object-cover shadow-lg" 
                />
              ) : (
                <img src="/mentor-placeholder.png" alt={mentor.name} className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-2 border-slate-200 dark:border-slate-700 object-cover shadow-lg" />
              )}
              {mentor.isOnline && (
                <span title="Online & accepting consultations" className="absolute bottom-2 right-2 w-5 h-5 bg-success rounded-full border-[3px] border-white dark:border-slate-900 shadow-md animate-pulse"></span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-2 tracking-tight">
                    {mentor.name}
                    {(() => {
                      const badge = getRoleBadge(mentor);
                      if (badge) {
                        return (
                          <span title={badge.label} className={`border text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${badge.colorClass} ml-1`}>
                            {badge.label}
                          </span>
                        );
                      } else {
                        return (
                          <span title="Verified HelpSathi Mentor" className="inline-flex">
                            <SealCheck weight="fill" className="text-brand-500 text-2xl shrink-0" />
                          </span>
                        );
                      }
                    })()}
                    {isSelf && (
                      <span className="text-xs font-extrabold bg-brand-100 dark:bg-brand-900/70 text-brand-800 dark:text-brand-300 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-700/60 shrink-0">
                        You
                      </span>
                    )}
                  </h1>
                  {mentor.username && (
                    <p className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 mt-0.5">@{mentor.username}</p>
                  )}
                </div>
                {mentor.isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/15 dark:bg-success/20 text-success text-xs font-bold rounded-full border border-success/30 w-max mx-auto sm:mx-0">
                    <span className="w-2 h-2 rounded-full bg-success animate-ping"></span> Online Now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700 w-max mx-auto sm:mx-0">
                    Offline
                  </span>
                )}
              </div>

              {mentor.categories.length > 0 && (
                <p className="text-sm font-extrabold text-brand-600 dark:text-brand-400 mb-5">{mentor.categories.join(" • ")}</p>
              )}

              <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-slate-50 dark:bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
                <div>
                  <span className="block text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">{mentor.totalSessions > 0 ? `${mentor.totalSessions}+` : "New"}</span>
                  <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sessions</span>
                </div>
                <div className="border-x border-slate-200 dark:border-slate-800 px-1">
                  <span className="flex items-center justify-center gap-1 text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    <Star weight="fill" className="text-orange-400 text-base shrink-0" />
                    {mentor.avgRating > 0 ? mentor.avgRating.toFixed(1) : "New"}
                  </span>
                  <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rating ({mentor.reviewCount})</span>
                </div>
                <div>
                  <span className="block text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">{mentor.experience} Yrs</span>
                  <span className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Experience</span>
                </div>
              </div>
            </div>
          </div>

          {/* About / Bio Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4 transition-colors">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">About Mentor</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
              {mentor.bio || "No biography provided yet."}
            </p>

            {mentor.languages.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Fluent Languages</span>
                <div className="flex flex-wrap gap-2">
                  {mentor.languages.map((lang) => (
                    <span key={lang} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skills & Domains Card */}
          {mentor.skills.length > 0 && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4 transition-colors">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Core Competencies & Skills</h3>
              <div className="flex flex-wrap gap-2.5">
                {mentor.skills.map((skill) => (
                  <span 
                    key={skill} 
                    className="px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 font-extrabold text-xs shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dedicated Monthly Mentorship Plan Card */}
          {mentor.monthlyPrice > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-pink-50/50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xl relative overflow-hidden transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-extrabold tracking-wide">
                    <Crown weight="fill" className="text-amber-500 text-sm" /> Premium Unlimited Plan
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Monthly Dedicated Mentorship
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    Subscribe for 1 month of unlimited priority chats and direct guidance without per-minute billing deductions.
                  </p>
                </div>

                <div className="w-full sm:w-auto shrink-0 flex flex-col sm:items-end bg-white dark:bg-slate-900 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-md">
                  <div className="text-left sm:text-right mb-3">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹{mentor.monthlyPrice}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400"> / month</span>
                  </div>
                  {isSelf ? (
                    <div className="flex flex-col items-stretch sm:items-end gap-2.5 w-full sm:w-auto">
                      <span className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-center border border-slate-200 dark:border-slate-700">
                        Your Public Plan Rate
                      </span>
                      <Link
                        href="/mentor-dashboard"
                        className="text-center text-xs font-bold px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        Edit in Mentor Panel
                      </Link>
                    </div>
                  ) : isSubscribed ? (
                    <div className="flex flex-col items-stretch sm:items-end gap-2.5 w-full sm:w-auto">
                      <span className="w-full sm:w-auto bg-success text-white px-6 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm">
                        <CheckCircle weight="fill" className="text-lg" /> Active Subscriber
                      </span>
                      <Link
                        href="/my-mentors"
                        className="text-center text-xs font-bold px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ArrowsClockwise weight="bold" className="text-sm" /> Manage AutoPay & Cancellation
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSubscribeMsg("");
                        setIsSubscribeOpen(true);
                      }}
                      disabled={!user}
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {subStatus === "EXPIRED" || subStatus === "CANCELLED" ? "Renew Subscription ✦" : "Subscribe Now"}
                    </button>
                  )}
                </div>
              </div>

              {subscribeMsg && (
                <div className="mt-4 flex items-center gap-2 bg-success/15 border border-success/40 text-success p-3 rounded-xl text-xs sm:text-sm font-bold">
                  <CheckCircle weight="fill" className="text-lg shrink-0" /> {subscribeMsg}
                </div>
              )}
            </div>
          )}

          {/* Student Reviews Section */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Student Reviews ({mentor.reviewCount})
              </h3>
              {user?.role === "STUDENT" && !isSelf && (
                <button
                  onClick={() => setIsReviewOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:opacity-95 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-98"
                >
                  <Star weight="fill" className="text-sm text-slate-950" /> Write a Review & Rate
                </button>
              )}
            </div>
            {mentor.reviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-semibold text-sm">
                No verified reviews yet for this mentor. Schedule a session to leave the first review!
              </div>
            ) : (
              <div className="space-y-4">
                {mentor.reviews.map((review) => (
                  <div key={review.id} className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800/80 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-700 dark:text-brand-300 font-extrabold flex items-center justify-center text-sm">
                        {review.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{review.studentName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} weight={s <= review.rating ? "fill" : "regular"} className="text-orange-400 text-xs" />
                          ))}
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold ml-2">{new Date(review.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed pl-12">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Desktop Mentorship Hub Sidebar */}
        <div className="hidden lg:block sticky top-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 transition-colors">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Mentorship Rates</span>
            <div className="flex items-center gap-6 py-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-400 font-bold block">Chat Rate</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">₹{mentor.perMinutePrice}</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ min</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-xs text-slate-400 font-bold block">Call Rate</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">₹{mentor.callPricePerMinute ?? mentor.perMinutePrice}</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ min</span>
                </div>
              </div>
            </div>
            {isSubscribed && !isSelf && (
              <p className="text-xs font-extrabold text-success mt-1.5 flex items-center gap-1">
                <CheckCircle weight="fill" /> Active subscription — Chats are currently free!
              </p>
            )}
          </div>

          {chatError && (
            <div className="bg-danger/10 border border-danger/20 text-danger p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-2"><WarningCircle weight="fill" className="text-base shrink-0" /> {chatError}</span>
              {chatError.includes("Need") && <Link href="/wallet" className="underline whitespace-nowrap font-extrabold ml-2">Recharge →</Link>}
            </div>
          )}

          <div className="space-y-3 pt-2">
            {isSelf ? (
              <>
                <div className="bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-brand-800 dark:text-brand-300 mb-1">Your Public Mentor Profile</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Students view this page to subscribe, initiate chats, or schedule 1-on-1 calls with you.</p>
                </div>
                <Link
                  href="/mentor-dashboard"
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-brand-500 dark:hover:bg-brand-400 text-white dark:text-slate-950 py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.99]"
                >
                  Manage Mentor Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Edit Profile & Bio
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={handleChat}
                  disabled={initiatingChat || !mentor.isOnline}
                  className="w-full bg-brand-main dark:bg-brand-500 hover:bg-brand-400 text-brand-950 dark:text-slate-950 py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-xl hover:opacity-95 transition-all disabled:opacity-60 active:scale-[0.99]"
                >
                  {initiatingChat ? (
                    <><Spinner className="animate-spin text-2xl" /> Starting Chat...</>
                  ) : (
                    <>
                      <ChatCircleDots weight="fill" className="text-2xl" />
                      <span>{mentor.isOnline ? (isSubscribed ? "Start Free Chat" : "Start Live Chat") : "Mentor Offline"}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => user ? router.push(`/book-call/${mentor.id}`) : router.push(`/login?redirect=/mentors/${mentorId}`)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 hover:opacity-95 text-white py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.99]"
                >
                  <PhoneCall weight="fill" className="text-2xl" />
                  <span>Book 1-on-1 Call</span>
                </button>

                {!isSubscribed && mentor.monthlyPrice > 0 && (
                  <button
                    onClick={() => user ? setIsSubscribeOpen(true) : router.push(`/login?redirect=/mentors/${mentorId}`)}
                    className="w-full bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-95 text-white py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.99]"
                  >
                    <Crown weight="fill" className="text-xl text-amber-200" />
                    <span>Monthly Pass (₹{mentor.monthlyPrice}/mo)</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg shrink-0">
                <Lightning weight="fill" />
              </div>
              <span>Instant consultation request & reply notification</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shrink-0">
                <ShieldCheck weight="fill" />
              </div>
              <span>100% Verified Subject Matter Expert</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
                <LockKey weight="fill" />
              </div>
              <span>Safe & encrypted automated billing via Razorpay</span>
            </div>
          </div>
        </div>

        {/* Mobile Fixed Action Footer Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 p-4 z-50 flex gap-3 shadow-2xl backdrop-blur-xl pb-safe">
          {isSelf ? (
            <Link
              href="/mentor-dashboard"
              className="flex-1 bg-slate-900 dark:bg-brand-500 text-white dark:text-slate-950 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md"
            >
              Manage Mentor Dashboard
            </Link>
          ) : (
            <>
              <button
                onClick={handleChat}
                disabled={initiatingChat || !mentor.isOnline}
                className="flex-1 bg-brand-main dark:bg-brand-500 text-brand-950 dark:text-slate-950 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
              >
                <ChatCircleDots weight="fill" className="text-xl" />
                <div className="flex flex-col items-start leading-none">
                  <span>{mentor.isOnline ? (isSubscribed ? "Free Chat" : "Live Chat") : "Offline"}</span>
                  <span className="text-[10px] opacity-80 mt-0.5">{isSubscribed ? "Included" : `₹${mentor.perMinutePrice}/min`}</span>
                </div>
              </button>
              <button
                onClick={() => user ? router.push(`/book-call/${mentor.id}`) : router.push(`/login?redirect=/mentors/${mentorId}`)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <PhoneCall weight="fill" className="text-xl" />
                <div className="flex flex-col items-start leading-none">
                  <span>Book Call</span>
                  <span className="text-[10px] opacity-90 mt-0.5">₹{mentor.callPricePerMinute ?? mentor.perMinutePrice}/min</span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {mentor && (
        <>
          <ReviewModal
            mentorId={mentor.id}
            mentorName={mentor.name}
            isOpen={isReviewOpen}
            onClose={() => setIsReviewOpen(false)}
            onSuccess={() => fetchMentor()}
          />
          <SubscriptionCheckoutModal
            isOpen={isSubscribeOpen}
            onClose={() => setIsSubscribeOpen(false)}
            mentor={{
              id: mentor.id,
              name: mentor.name,
              avatar: mentor.avatar,
              monthlyPrice: mentor.monthlyPrice,
              categories: mentor.categories,
            }}
            user={user}
            onSubscriptionSuccess={() => {
              setIsSubscribed(true);
              setSubscribeMsg("You're now subscribed! Your mentor has been notified.");
              fetchMentor();
            }}
          />
        </>
      )}
    </div>
  );
}
