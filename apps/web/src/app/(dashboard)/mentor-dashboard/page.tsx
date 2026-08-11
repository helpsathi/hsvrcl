"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  Wallet, 
  Users, 
  Star, 
  ArrowRight, 
  Bank, 
  ChartLineUp, 
  CalendarCheck, 
  Clock, 
  ShieldCheck, 
  LockSimple, 
  Coins, 
  UserGear, 
  CalendarPlus, 
  VideoCamera, 
  CheckCircle, 
  WarningCircle,
  ArrowSquareOut,
  SlidersHorizontal,
  Camera,
  UserCircle,
  XCircle,
  Flag,
  Sparkle,
  Hourglass,
  ArrowClockwise,
  RocketLaunch,
  HandCoins,
  FileText,
  UploadSimple
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ScheduledMessagesTab from "@/components/mentor/ScheduledMessagesTab";
import { validateUsernameSyntax } from "@/lib/username";
import { MentorDashboardSkeleton } from "@/components/ui/Skeleton";

const usernameCheckCache = new Map<string, { available: boolean; error?: string }>();

export default function MentorDashboard() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading, updateUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("error") === "unauthorized") {
        toast.error("You don't have permission to access the requested page.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [toast]);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [startingChatStudentId, setStartingChatStudentId] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  
  // Application status state for non-approved users
  const [mentorAppStatus, setMentorAppStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Clean navigation tab state
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "broadcasts" | "earnings" | "reviews" | "settings">("overview");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [disputeModalReview, setDisputeModalReview] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeMsg, setDisputeMsg] = useState("");
  
  const handleReportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalReview || !disputeReason.trim()) return;
    setDisputeSubmitting(true);
    setDisputeMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: disputeModalReview.id, removalReason: disputeReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit removal request");
      setDisputeMsg("✅ Removal dispute submitted to Moderation team.");
      setTimeout(() => {
        setDisputeModalReview(null);
        setDisputeReason("");
        setDisputeMsg("");
        fetchProfile();
      }, 1800);
    } catch (err: any) {
      setDisputeMsg("❌ " + err.message);
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState<any>({ totalEarnings: 0, availableBalance: 0, totalSessions: 0, rating: 0, activeSubscribers: 0 });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [paymentTab, setPaymentTab] = useState<"UPI" | "BANK">("UPI");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [originalUsername, setOriginalUsername] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<string[]>([
    "UPSC / BPSC", "Software Engineering", "JEE / NEET", "Govt Exams", "Placement Prep", "Startup / Biz"
  ]);

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const names = data.categories.map((c: any) => c.name).filter(Boolean);
          if (names.length > 0) setCategoriesList(names);
        }
      })
      .catch(e => console.error("Failed to load categories:", e));
  }, []);

  useEffect(() => {
    if (profileData?.username !== undefined && originalUsername === null) {
      setOriginalUsername(profileData.username || "");
    }
  }, [profileData?.username, originalUsername]);

  useEffect(() => {
    const usr = (profileData?.username || "").trim().toLowerCase();
    if (!usr || usr === originalUsername) {
      setUsernameError("");
      setUsernameAvailable(true);
      setUsernameChecking(false);
      return;
    }

    // 1. Instant Synchronous Client-Side Syntax & Blocklist Validation (0 Network overhead)
    const validation = validateUsernameSyntax(usr);
    if (!validation.isValid) {
      setUsernameError(validation.error || "Invalid username format");
      setUsernameAvailable(false);
      setUsernameChecking(false);
      return;
    }

    // 2. Check Session Cache for instant zero-latency UI on previously checked names
    if (usernameCheckCache.has(usr)) {
      const cached = usernameCheckCache.get(usr)!;
      setUsernameAvailable(cached.available);
      setUsernameError(cached.error || "");
      setUsernameChecking(false);
      return;
    }

    setUsernameChecking(true);
    setUsernameError("");

    // 3. Setup AbortController for race-condition immunity and request cancellation
    const abortController = new AbortController();

    // 4. Optimized Debounce (650ms) to eliminate network burst spam while typing
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/mentors/check-username?username=${encodeURIComponent(usr)}&currentMentorId=${profileData?.id || profileData?.userId || ""}`,
          { signal: abortController.signal }
        );
        const data = await res.json();

        if (!res.ok && res.status === 429) {
          setUsernameAvailable(false);
          setUsernameError(data.error || "Too many attempts. Please pause for a moment.");
          return;
        }

        if (data.available) {
          setUsernameAvailable(true);
          setUsernameError("");
          usernameCheckCache.set(usr, { available: true });
        } else {
          setUsernameAvailable(false);
          setUsernameError(data.error || "Username unavailable");
          usernameCheckCache.set(usr, { available: false, error: data.error || "Username unavailable" });
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setUsernameError("Error checking availability");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setUsernameChecking(false);
        }
      }
    }, 650);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [profileData?.username, originalUsername, profileData?.id, profileData?.userId]);

  const handleCopyLink = () => {
    const handle = profileData?.username || profileData?.id || profileData?.userId;
    if (handle) {
      const url = `${window.location.origin}/mentors/${handle}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/mentors/profile");
      const data = await res.json();
      if (res.ok) {
        setProfileData(data.profile);
        setStats(data.stats);
        setRecentSessions(data.recentSessions || []);
        setSubscribers(data.subscribers || []);
        setIsOnline(data.profile.isOnline);
        try {
          const [wRes, rRes] = await Promise.all([
            fetch("/api/mentors/withdraw"),
            fetch(`/api/reviews?mentorId=${data.profile.id || data.profile.userId}`)
          ]);
          if (wRes.ok) {
            const wData = await wRes.json();
            setWithdrawals(wData.withdrawals || []);
          }
          if (rRes.ok) {
            const rData = await rRes.json();
            setReviews(rData.reviews || []);
          }
        } catch (subErr) {
          console.error("Error loading secondary dashboard data:", subErr);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStatusLoading(false);
      setFetching(false);
      return;
    }

    if (user.role === "MENTOR" || user.role === "ADMIN" || user.adminSubRole) {
      fetchProfile();
      setStatusLoading(false);
    } else {
      // Fetch mentor application status for student users
      fetch("/api/mentors/my-status")
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "APPROVED") {
            updateUser({ role: "MENTOR" });
            fetchProfile();
          } else {
            setMentorAppStatus(data.status || "NOT_APPLIED");
            setRejectionReason(data.rejectionReason || null);
            setFetching(false);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch mentor status:", err);
          setFetching(false);
        })
        .finally(() => {
          setStatusLoading(false);
        });
    }
  }, [user, authLoading]);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await fetch("/api/mentors/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: newStatus })
      });
    } catch (e) {
      console.error(e);
      setIsOnline(!newStatus);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploadingAvatar(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const upRes = await fetch("/api/upload", { method: "POST", body: formData });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || "Image upload failed");

      const newUrl = upData.url;
      const patchRes = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: newUrl })
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchData.error || "Profile photo update failed");

      updateUser({ avatar: newUrl });
      setMessage("✅ Professional mentor photo updated successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploadingResume(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const upRes = await fetch("/api/upload", { method: "POST", body: formData });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || "Resume upload failed");

      setProfileData({ ...profileData, resumeUrl: upData.url });
      setMessage("✅ Resume/CV document uploaded. Click 'Save Configuration' to persist changes.");
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileData?.username && (usernameError || !usernameAvailable)) {
      setMessage("❌ Please fix your username error before saving.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/mentors/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profileData.username?.trim().toLowerCase() || null,
          bio: profileData.bio,
          categories: profileData.categories || ["Other"],
          resumeUrl: profileData.resumeUrl,
          linkedinUrl: profileData.linkedinUrl,
          perMinutePrice: profileData.perMinutePrice,
          callPricePerMinute: profileData.callPricePerMinute !== undefined ? profileData.callPricePerMinute : profileData.perMinutePrice,
          monthlyPrice: profileData.monthlyPrice,
          upiId: profileData.upiId,
          bankDetails: profileData.bankDetails,
          freeTrial: profileData.freeTrial,
          subscribedBookingFree: profileData.subscribedBookingFree,
          bookingNoticeHours: profileData.bookingNoticeHours,
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }
      setOriginalUsername(profileData.username?.trim().toLowerCase() || "");
      setMessage("✅ Settings and rate schedules saved successfully.");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const requestWithdrawal = async () => {
    if (!profileData?.upiId && !profileData?.bankDetails?.accountNumber) {
      setMessage("⚠️ Please configure your payment destination in Rate & Profile Settings before requesting a withdrawal.");
      setActiveTab("settings");
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/mentors/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: stats.availableBalance }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal failed");
      setMessage("✅ Withdrawal request submitted successfully. Transfer will process within 24 hours.");
      fetchProfile();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 6000);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to drop this subscriber? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId })
      });
      if (res.ok) {
        toast.success("Subscription cancelled successfully.");
        setSubscribers(prev => prev.filter(s => s.id !== subscriptionId));
      } else {
        toast.error("Failed to cancel subscription.");
      }
    } catch (e) {
      toast.error("An error occurred.");
    }
  };

  const handleMessageStudent = async (studentId: string, name?: string, avatar?: string) => {
    setStartingChatStudentId(studentId);
    try {
      const res = await fetch("/api/chats/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
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
        setMessage(`❌ ${data.error || "Failed to start chat session"}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message || "Failed to initiate chat"}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setStartingChatStudentId(null);
    }
  };

  // 1. Loading Skeleton while initializing
  if (authLoading || (user && (user.role === "MENTOR" || user.role === "ADMIN" || user.adminSubRole) && fetching) || (user && user.role !== "MENTOR" && user.role !== "ADMIN" && !user.adminSubRole && statusLoading)) {
    return <MentorDashboardSkeleton />;
  }

  // 2. Non-Mentor Views (Pending, Rejected, or Not Applied)
  if (user?.role !== "MENTOR" && user?.role !== "ADMIN") {
    if (mentorAppStatus === "PENDING") {
      return (
        <div className="w-full max-w-3xl mx-auto px-4 py-16 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
              <Hourglass weight="duotone" className="text-3xl animate-pulse" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 mb-4 border border-amber-200 dark:border-amber-800/60">
              Application Under Review
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              We&apos;re Verifying Your Mentor Profile
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
              Our academic &amp; safety team is reviewing your verification documents and credentials. Reviews usually take 2 to 24 hours. You&apos;ll receive an in-app notification once approved!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/onboarding/mentor"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 text-white shadow-brand transition-all flex items-center justify-center gap-2"
              >
                <UserGear weight="bold" className="text-base" /> Review Submitted Details
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (mentorAppStatus === "REJECTED") {
      return (
        <div className="w-full max-w-3xl mx-auto px-4 py-16 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-red-200/80 dark:border-red-900/40 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
              <WarningCircle weight="duotone" className="text-3xl" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 mb-4 border border-red-200 dark:border-red-800/60">
              Action Required &bull; Reapply Immediately
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              Application Needs Revision
            </h2>
            <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 rounded-2xl p-4 sm:p-5 max-w-xl mx-auto mb-6 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-1">Feedback from Admin:</p>
              <p className="text-sm font-medium text-red-900 dark:text-red-200 italic">
                &ldquo;{rejectionReason || "Please verify your credentials, experience details, and submit a clear verification document."}&rdquo;
              </p>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              No waiting period required! Update your application details now and submit for rapid re-review.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/onboarding/mentor"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 text-white shadow-brand transition-all flex items-center justify-center gap-2"
              >
                <ArrowClockwise weight="bold" className="text-base" /> Edit &amp; Reapply Now
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Default: Not applied yet
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12 animate-in fade-in">
        <div className="bg-gradient-to-br from-brand-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-brand-500/20">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-400/30 mb-4">
              <Sparkle weight="fill" className="text-brand-400" /> HelpSathi Mentor Program
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
              Empower Students &amp; Monetize Your Expertise
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Join top mentors offering 1-on-1 consultations, monthly subscriptions, and group meetings. Set your own prices, create flexible schedules, and get fast direct payouts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <HandCoins weight="duotone" className="text-2xl text-emerald-400 mb-2" />
                <h4 className="font-bold text-sm text-white">Direct Payouts</h4>
                <p className="text-xs text-slate-400 mt-0.5">UPI &amp; Bank transfers within 24 hours.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <Clock weight="duotone" className="text-2xl text-cyan-400 mb-2" />
                <h4 className="font-bold text-sm text-white">Your Schedule</h4>
                <p className="text-xs text-slate-400 mt-0.5">Accept calls on your preferred weekly hours.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <ShieldCheck weight="duotone" className="text-2xl text-purple-400 mb-2" />
                <h4 className="font-bold text-sm text-white">Verified Badge</h4>
                <p className="text-xs text-slate-400 mt-0.5">Stand out with verified credibility.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/onboarding/mentor"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
              >
                <RocketLaunch weight="fill" className="text-lg" /> Start Mentor Application
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors flex items-center justify-center"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-8 text-slate-900 dark:text-slate-100 animate-in fade-in duration-300">
      
      {/* 1. CLEAN INTEGRATED HEADER & STATUS TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mentor Executive Workspace
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.name}</span>. Oversee your consultations, proposals, and earnings in one place.
          </p>
        </div>

        {/* Minimalist Live Online Button */}
        <div className="flex items-center gap-3 bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shrink-0">
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse' : 'bg-slate-400'}`}></span>
          <span className={`text-xs font-bold uppercase tracking-wider ${isOnline ? 'text-success' : 'text-slate-600 dark:text-slate-400'}`}>
            {isOnline ? "Online & Accepting Calls" : "Offline Status"}
          </span>
          <button 
            onClick={toggleOnline}
            className={`w-11 h-6 rounded-full relative transition-colors shadow-inner ${isOnline ? 'bg-success' : 'bg-slate-300 dark:bg-slate-700'}`}
            title="Toggle Online Consultation Status"
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-xs ${isOnline ? 'left-6' : 'left-1'}`}></div>
          </button>
        </div>
      </div>

      {/* 2. MINIMALIST SEGMENTED NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5 dark:bg-brand-400/5 rounded-t-xl"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
          }`}
        >
          Overview & Activity
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "sessions"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5 dark:bg-brand-400/5 rounded-t-xl"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
          }`}
        >
          Subscribers & Ledger
          {subscribers.length > 0 && (
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              {subscribers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("broadcasts")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "broadcasts"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5 dark:bg-brand-400/5 rounded-t-xl"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
          }`}
        >
          Broadcasts & Messages
        </button>
        <button
          onClick={() => setActiveTab("earnings")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "earnings"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5 dark:bg-brand-400/5 rounded-t-xl"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
          }`}
        >
          Payouts & Earnings
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "reviews"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5 dark:bg-brand-400/5 rounded-t-xl"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
          }`}
        >
          Reviews & Feedback
          {reviews.length > 0 && (
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              {reviews.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "settings"
              ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5 dark:bg-brand-400/5 rounded-t-xl"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
          }`}
        >
          Rate Configuration
        </button>
      </div>

      {/* 3. TAB 1: OVERVIEW & ACTIVITY (Ultra Clean, Clutter-Free) */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Quick Shortcuts Pill Bar (Replaces 4 massive cluttered boxes!) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40 p-3 sm:px-4 sm:py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <SlidersHorizontal weight="bold" className="text-slate-400 text-sm" /> Quick Action Center
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Link 
                href="/mentor-dashboard/proposals"
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <CalendarPlus weight="fill" className="text-purple-500 text-sm" /> + Session Proposal
              </Link>
              <Link 
                href="/mentor-dashboard/availability"
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Clock weight="fill" className="text-indigo-500 text-sm" /> Edit Availability
              </Link>
              <Link 
                href="/mentor-dashboard/group-meetings"
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <VideoCamera weight="fill" className="text-teal-500 text-sm" /> Schedule Group Meeting
              </Link>
              <Link 
                href="/scheduled-calls"
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <CalendarCheck weight="fill" className="text-amber-500 text-sm" /> Upcoming Calls
              </Link>
            </div>
          </div>

          {/* Unified KPI Metrics Ribbon (Replaces 4 bulky independent cards) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
              
              <div className="p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Consultations</span>
                  <Users weight="duotone" className="text-lg text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats.totalSessions || 0}</span>
                  <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Completed video sessions</span>
                </div>
              </div>
              
              <div className="p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Subscribers</span>
                  <ChartLineUp weight="duotone" className="text-lg text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats.activeSubscribers || 0}</span>
                  <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Dedicated monthly students</span>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Student Rating</span>
                  <Star weight="fill" className={stats.rating > 0 ? "text-lg text-orange-400" : "text-lg text-slate-300 dark:text-slate-600"} />
                </div>
                <div>
                  {stats.rating > 0 ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats.rating.toFixed(1)}</span>
                        <span className="text-xs font-bold text-slate-400">/ 5.0</span>
                      </div>
                      <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        From {reviews.length} student {reviews.length === 1 ? "review" : "reviews"}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-400 dark:text-slate-500 tracking-tight">0.0</span>
                        <span className="text-xs font-bold text-slate-400">/ 5.0</span>
                      </div>
                      <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">No reviews yet</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between bg-slate-50/40 dark:bg-slate-950/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Available Balance</span>
                  <Wallet weight="duotone" className="text-lg text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-success tracking-tight">₹{stats.availableBalance || 0}</span>
                    <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Ready for transfer</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab("earnings")} 
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline shrink-0 pb-0.5"
                  >
                    Withdraw →
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Clean Activity Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-950/40">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">Recent Student Consultations</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Latest completed video calls and student interactions</p>
              </div>
              <button 
                onClick={() => setActiveTab("sessions")} 
                className="text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1"
              >
                Full History <ArrowRight />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentSessions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium text-xs sm:text-sm">
                  No recent consultation sessions recorded yet. Promote your profile to start receiving bookings!
                </div>
              ) : (
                recentSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="p-4 sm:px-6 sm:py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700 shrink-0">
                        {session.student.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{session.student}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{session.type} • {session.duration} mins • {session.date}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-extrabold text-sm text-success">+₹{session.earned}</span>
                      <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500">Net Earned</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* 4. TAB 2: SUBSCRIBERS & LEDGER */}
      {activeTab === "sessions" && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">Dedicated Monthly Subscribers ({subscribers.length})</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Students subscribed to your continuous guidance plan</p>
              </div>
              <div className="flex items-center gap-2">
                <Link 
                  href="/mentor-dashboard/proposals"
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                >
                  <CalendarPlus weight="bold" /> Send Slots
                </Link>
                <Link 
                  href="/mentor-dashboard/group-meetings"
                  className="bg-brand-500 text-slate-950 hover:bg-brand-400 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-1.5"
                >
                  <VideoCamera weight="bold" /> Group Meeting
                </Link>
              </div>
            </div>

            {subscribers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                You currently have no dedicated monthly subscribers. Set a competitive Monthly Subscription Rate in Rate Configuration!
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subscribers.map((sub: any) => (
                  <div key={sub.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {sub.avatar ? (
                        <img 
                          src={sub.avatar} 
                          alt={sub.name} 
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.name)}&background=random`; }}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-center border border-slate-300 dark:border-slate-700 shrink-0 text-sm">
                          {sub.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{sub.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Since {sub.startDate || "Recently"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleCancelSubscription(sub.id)} 
                        className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                        title="Drop Subscriber"
                      >
                        <XCircle weight="bold" />
                      </button>
                      <button 
                        onClick={() => handleMessageStudent(sub.studentId || sub.id, sub.student?.name || sub.name, sub.student?.avatar || sub.avatar || '')} 
                        disabled={startingChatStudentId === (sub.studentId || sub.id)}
                        className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        title="Message Student"
                      >
                        <ArrowSquareOut weight="bold" className={startingChatStudentId === (sub.studentId || sub.id) ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">Completed Consultation Ledger</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Full audit history of completed video calls and masterclass payouts</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSessions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium text-xs sm:text-sm">
                  No consultation records in your ledger yet.
                </div>
              ) : (
                recentSessions.map((session) => (
                  <div key={session.id} className="p-4 sm:px-6 sm:py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-extrabold text-sm border border-indigo-200/50 dark:border-indigo-800/50 shrink-0">
                        {session.student.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{session.student}</h4>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 block">
                          {session.type} • {session.duration} mins • {session.date}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-extrabold text-sm text-success">+₹{session.earned}</span>
                      <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500">Net Earned</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

        {/* 4.5. TAB: BROADCASTS & MESSAGES */}
      {activeTab === "broadcasts" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6">
          <ScheduledMessagesTab />
        </div>
      )}

      {/* 5. TAB 3: PAYOUTS & EARNINGS */}
      {activeTab === "earnings" && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Subtle Privacy Notice */}
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-start sm:items-center gap-4 text-slate-700 dark:text-slate-300">
            <ShieldCheck weight="fill" className="text-2xl text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-extrabold text-slate-900 dark:text-white">Confidential Financial Terms: </span>
              Your platform fee ({profileData?.commissionRate || 30}%) and payout banking coordinates are strictly protected and private to your account. Students only see your advertised booking rates.
            </div>
          </div>

          {/* Detailed Earnings Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                1-on-1 Chat/Calls
              </span>
              <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                ₹{stats?.breakdown?.chatEarnings || 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Direct consultations</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Subscriptions
              </span>
              <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                ₹{stats?.breakdown?.subscriptionEarnings || 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Monthly mentees</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Total Withdrawn
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{stats?.breakdown?.totalWithdrawn || 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Transferred to bank/UPI</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Platform Fee
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300">
                {stats?.commissionRate || profileData?.commissionRate || 15}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Standard commission</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Available Payout Balance</span>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">₹{stats.availableBalance || 0}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  Cumulative Lifetime Earned: <span className="font-bold text-slate-800 dark:text-slate-200">₹{stats.totalEarnings || 0}</span>
                </span>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={requestWithdrawal}
                  disabled={loading || !stats.availableBalance || stats.availableBalance <= 0 || (!profileData?.upiId && !profileData?.bankDetails?.accountNumber)}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 py-3 px-6 rounded-xl font-extrabold text-sm transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
                >
                  <Coins weight="bold" className="text-lg" />
                  {loading 
                    ? "Processing Payout Request..." 
                    : (!profileData?.upiId && !profileData?.bankDetails?.accountNumber)
                      ? "Configure Payout Account Below"
                      : "Request Instant Withdrawal"}
                </button>
                {(!profileData?.upiId && !profileData?.bankDetails?.accountNumber) && (
                  <p className="text-center text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    ⚠️ Add your UPI ID or Bank Account in Settings before requesting withdrawals.
                  </p>
                )}
                <p className="text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Withdrawal requests are processed securely within 24 business hours.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Linked Payout Account</span>
                  <button 
                    onClick={() => setActiveTab("settings")}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Edit Destination →
                  </button>
                </div>

                {profileData?.upiId ? (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Registered UPI Virtual Address</span>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                      {profileData.upiId}
                    </p>
                    <span className="text-xs font-semibold text-success flex items-center gap-1 pt-1">
                      <CheckCircle weight="fill" /> Active for automated transfers
                    </span>
                  </div>
                ) : profileData?.bankDetails?.accountNumber ? (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Registered Bank Account</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Holder: {profileData.bankDetails.name}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                      Acct: **** **** {profileData.bankDetails.accountNumber.slice(-4)}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">IFSC: {profileData.bankDetails.ifsc}</p>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-4 text-center space-y-2">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      No bank or UPI coordinates configured. Link your payment destination to receive consultation payouts.
                    </p>
                    <button 
                      onClick={() => setActiveTab("settings")}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      Configure Payout Details
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-400 dark:text-slate-500">
                HelpSathi supports all major UPI apps and Indian bank accounts via NEFT/IMPS.
              </div>
            </div>

          </div>

          {/* WITHDRAWAL HISTORY LEDGER */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mt-8">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Bank weight="fill" className="text-emerald-500 text-lg" />
              </div>
              Withdrawal Status & Audit Ledger
            </h3>

            {withdrawals.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-slate-400 font-medium text-sm">
                No withdrawal transactions requested yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Destination</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Admin Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {new Date(w.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                          ₹{w.amount}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400 text-xs">
                          {w.payoutDetails?.type || (w.payoutDetails?.upiId ? "UPI" : "BANK")} ({w.payoutDetails?.upiId || w.payoutDetails?.accountNumber || "N/A"})
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            w.status === "COMPLETED" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" :
                            w.status === "REJECTED" ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800" :
                            "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          }`}>
                            {w.status === "COMPLETED" && <CheckCircle weight="fill" />}
                            {w.status === "REJECTED" && <WarningCircle weight="fill" />}
                            {w.status === "PENDING" && <Clock weight="fill" className="animate-pulse" />}
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {w.adminNotes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 5: STUDENT REVIEWS & MODERATION */}
      {activeTab === "reviews" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Star weight="fill" className="text-amber-500 text-xl" /> Student Ratings & Feedback
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Monitor your authentic mentorship score, respond to insights, or report policy-violating spam reviews.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Average Rating</p>
                <p className="text-2xl font-black text-amber-500 flex items-center gap-1">
                  {stats.rating > 0 ? stats.rating.toFixed(1) : "0.0"} <Star weight={stats.rating > 0 ? "fill" : "regular"} className="text-lg" />
                </p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Total Reviews</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{reviews.length}</p>
              </div>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-semibold text-sm">
              No verified reviews received yet. Deliver high-value consultations to climb the leaderboard!
            </div>
          ) : (
            <div className="grid gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-700 dark:text-brand-300 font-extrabold flex items-center justify-center text-sm shrink-0">
                        {rev.student?.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{rev.student?.name || "Student"}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} weight={s <= rev.rating ? "fill" : "regular"} className="text-amber-400 text-xs" />
                          ))}
                          <span className="text-xs text-slate-400 ml-1">
                            • {new Date(rev.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {rev.comment ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium pl-13 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    ) : (
                      <p className="text-xs italic text-slate-400 pl-13">No written comment provided.</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {rev.removalRequested ? (
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl">
                        🛡️ Dispute Under Review
                      </span>
                    ) : (
                      <button
                        onClick={() => { setDisputeModalReview(rev); setDisputeMsg(""); setDisputeReason(""); }}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Flag weight="fill" className="text-sm" /> Report & Dispute
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISPUTE REPORT MODAL */}
      {disputeModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Report Review for Moderation</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
              If this review violates HelpSathi community guidelines (e.g. offensive language, extortion, or irrelevant content), explain your reason below for Admin review.
            </p>
            {disputeMsg && (
              <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200">
                {disputeMsg}
              </div>
            )}
            <form onSubmit={handleReportReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Dispute Reason
                </label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why this review should be investigated and removed..."
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                  maxLength={300}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalReview(null)}
                  disabled={disputeSubmitting}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeSubmitting}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition"
                >
                  {disputeSubmitting ? "Submitting..." : "Submit Removal Dispute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TAB 4: RATE & PROFILE CONFIGURATION (Clean & Minimalist) */}
      {activeTab === "settings" && (
        <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 sm:p-8 space-y-8 animate-in fade-in">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                Consultation Rates & Profile Specifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Update your public profile bio and configure your pricing rates for students
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/50 hidden sm:inline-block">
              🔒 Rates are securely synced
            </span>
          </div>

          <div className="space-y-6">
            {/* Professional Branding & Avatar Photo */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="relative shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user?.name || "Mentor Photo"}
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Mentor")}&background=random`; }}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md">
                      <UserCircle weight="fill" className="w-12 h-12" />
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/70 rounded-full flex items-center justify-center backdrop-blur-2xs border-2 border-white dark:border-slate-800">
                      <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Professional Profile Picture</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                    Upload a clean, high-resolution photo to build confidence and trust with prospective students.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs transition-all disabled:opacity-50 shrink-0 flex items-center gap-2"
              >
                <Camera weight="bold" className="text-sm text-brand-600 dark:text-brand-400" />
                {uploadingAvatar ? "Uploading Photo..." : "Change Professional Photo"}
              </button>
            </div>

            {/* Custom Username & Shareable Profile URL */}
            <div className="bg-gradient-to-r from-brand-50 to-slate-50 dark:from-brand-950/30 dark:to-slate-950 p-5 rounded-2xl border border-brand-200/60 dark:border-slate-800 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-100 dark:border-slate-800/80 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Public Mentor Profile Link & Handle</span>
                    <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-brand-500/20">SEO & Sharing</span>
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize your username for a memorable, shareable HelpSathi link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-3.5 py-2 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-2 shrink-0 self-start sm:self-center"
                >
                  <ArrowSquareOut weight="bold" className="text-sm text-brand-600 dark:text-brand-400" />
                  {copiedLink ? "Copied Public Link!" : "Copy Public Link"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex justify-between">
                  <span>Custom Username</span>
                  <span className="text-[11px] font-mono font-normal text-slate-400">helpsathi.com/mentors/{profileData?.username?.trim().toLowerCase() || profileData?.id || "handle"}</span>
                </label>
                <div className="relative max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                  <input 
                    type="text" 
                    value={profileData?.username || ""}
                    onChange={(e) => setProfileData({...profileData, username: e.target.value.toLowerCase()})}
                    placeholder="your_custom_username"
                    maxLength={20}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium transition-all" 
                  />
                  {usernameChecking && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {!usernameChecking && usernameAvailable && profileData?.username && (
                    <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success text-lg" weight="fill" />
                  )}
                  {!usernameChecking && usernameError && profileData?.username && (
                    <WarningCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-danger text-lg" weight="fill" />
                  )}
                </div>
                {usernameError && <p className="text-[11px] font-bold text-danger mt-1.5 flex items-center gap-1"><WarningCircle weight="fill" /> {usernameError}</p>}
                {usernameAvailable && !usernameChecking && profileData?.username && profileData.username !== originalUsername && (
                  <p className="text-[11px] font-bold text-success mt-1.5 flex items-center gap-1"><CheckCircle weight="fill" /> Available! Click Save Configuration below to claim.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Primary Mentorship Category
              </label>
              <select 
                value={(Array.isArray(profileData?.categories) && profileData?.categories[0]) || "Other"}
                onChange={(e) => setProfileData({...profileData, categories: [e.target.value]})}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all font-medium mb-5"
              >
                {categoriesList.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
                {Array.isArray(profileData?.categories) && profileData.categories[0] && !categoriesList.includes(profileData.categories[0]) && profileData.categories[0] !== "Other" && (
                  <option value={profileData.categories[0]}>{profileData.categories[0]}</option>
                )}
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Professional Bio & Specializations
              </label>
              <textarea 
                value={profileData?.bio || ""}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                placeholder="Briefly describe your mentorship background, technical expertise, and career accomplishments..."
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white h-28 resize-none font-medium transition-all" 
              />
            </div>

            {/* Resume / Verification Document Section */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <input
                type="file"
                ref={resumeInputRef}
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <FileText weight="duotone" className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Mentor Resume / Verification CV</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {profileData?.resumeUrl ? "CV / Document attached" : "Upload your latest CV or credential portfolio (PDF, DOCX)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {profileData?.resumeUrl && (
                    <a
                      href={profileData.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <ArrowSquareOut weight="bold" /> View Uploaded CV
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-brand-500 hover:bg-brand-600 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <UploadSimple weight="bold" />
                    {uploadingResume ? "Uploading..." : profileData?.resumeUrl ? "Replace CV" : "Upload Resume (PDF)"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Chat Rate (₹/min)
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={profileData?.perMinutePrice ?? 0}
                  onChange={(e) => setProfileData({...profileData, perMinutePrice: Number(e.target.value)})}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all" 
                />
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">Rate charged for interactive messaging chats.</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Call Consultation Rate (₹/min)
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={profileData?.callPricePerMinute ?? profileData?.perMinutePrice ?? 0}
                  onChange={(e) => setProfileData({...profileData, callPricePerMinute: Number(e.target.value)})}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all" 
                />
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">Rate charged for scheduled video & voice call appointments.</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Monthly Subscription (₹)
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={profileData?.monthlyPrice ?? 0}
                  onChange={(e) => setProfileData({...profileData, monthlyPrice: Number(e.target.value)})}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all" 
                />
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">Allows students to book dedicated continuous mentorship.</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Free Introductory Chats</h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-[250px]">
                    Allow new students to chat with you for free for their first few minutes. Great for building trust.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={profileData?.freeTrial ?? false}
                    onChange={(e) => setProfileData({...profileData, freeTrial: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                </label>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Free Calls for Subscribers</h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-[250px]">
                    Allow students with an active monthly subscription to book calls with you without per-minute charges.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={profileData?.subscribedBookingFree ?? true}
                    onChange={(e) => setProfileData({...profileData, subscribedBookingFree: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
                </label>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Booking Notice Required</h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-[250px]">
                    Minimum advance time required before a student can book a call with you.
                  </p>
                </div>
                <div className="shrink-0">
                  <select
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none min-w-[100px] text-center"
                    value={profileData?.bookingNoticeHours ?? 2}
                    onChange={(e) => setProfileData({...profileData, bookingNoticeHours: Number(e.target.value)})}
                  >
                    <option value={0}>Instant</option>
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                    <option value={4}>4 hours</option>
                    <option value={6}>6 hours</option>
                    <option value={8}>8 hours</option>
                    <option value={12}>12 hours</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <CalendarPlus weight="fill" className="text-9xl text-blue-500" />
                </div>
                <div className="relative z-10 flex-1">
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" alt="Google Calendar" className="w-5 h-5" />
                    Automated Google Meet Scheduling
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Connect your Google Calendar so HelpSathi can automatically generate <strong>Google Meet</strong> links for your booked sessions. Because the meeting is created on your calendar, you are automatically the Host and can admit students without waiting!
                  </p>
                </div>
                <div className="relative z-10 shrink-0">
                  {profileData?.googleCalendarConnected ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-emerald-200/50 dark:border-emerald-500/20">
                        <CheckCircle weight="fill" /> Calendar Connected
                      </div>
                      <a href="/api/auth/google-calendar/connect" className="text-[10px] text-slate-400 hover:text-brand-500 underline underline-offset-2">
                        Reconnect Account
                      </a>
                    </div>
                  ) : (
                    <a
                      href="/api/auth/google-calendar/connect"
                      className="px-5 py-2.5 rounded-xl text-sm font-extrabold bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                      Connect Google Calendar
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                Financial Payout Coordinates
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Configure your Bank Account or UPI Virtual Address for withdrawal payouts
              </p>
            </div>

            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 max-w-sm">
              <button 
                type="button" 
                onClick={() => setPaymentTab("UPI")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${paymentTab === "UPI" ? "bg-white dark:bg-slate-800 shadow-xs text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                UPI VPA ID
              </button>
              <button 
                type="button" 
                onClick={() => setPaymentTab("BANK")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${paymentTab === "BANK" ? "bg-white dark:bg-slate-800 shadow-xs text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Bank Account
              </button>
            </div>

            {paymentTab === "UPI" ? (
              <div className="max-w-md space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  UPI ID (Virtual Payment Address)
                </label>
                <input 
                  type="text" 
                  placeholder="username@okaxis or mobile@upi"
                  value={profileData?.upiId || ""}
                  onChange={(e) => setProfileData({...profileData, upiId: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all" 
                />
              </div>
            ) : (
              <div className="max-w-lg space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Account Holder Full Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="As registered with your bank"
                    value={profileData?.bankDetails?.name || ""}
                    onChange={(e) => setProfileData({...profileData, bankDetails: {...profileData.bankDetails, name: e.target.value}})}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Account Number
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter savings or current bank account number"
                    value={profileData?.bankDetails?.accountNumber || ""}
                    onChange={(e) => setProfileData({...profileData, bankDetails: {...profileData.bankDetails, accountNumber: e.target.value}})}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    IFSC Code
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. SBIN0001234 or HDFC0005678"
                    value={profileData?.bankDetails?.ifsc || ""}
                    onChange={(e) => setProfileData({...profileData, bankDetails: {...profileData.bankDetails, ifsc: e.target.value.toUpperCase()}})}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white transition-all" 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-extrabold px-8 py-3 rounded-xl shadow-xs disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      )}

      {/* Clean Notification Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-5 py-3.5 rounded-xl font-bold text-xs shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 border border-slate-800 dark:border-slate-200 flex items-center gap-2.5">
          {message}
        </div>
      )}
    </div>
  );
}
