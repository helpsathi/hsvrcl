"use client";

import { MentorCard, MentorProps } from "@/components/mentors/MentorCard";
import SubscriptionCheckoutModal from "@/components/mentors/SubscriptionCheckoutModal";
import InsufficientBalanceModal from "@/components/wallet/InsufficientBalanceModal";
import { MentorCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/providers/ToastProvider";
import * as PhosphorIcons from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function DashboardHome() {
  const { user } = useAuth();
  const toast = useToast();
  const [mentors, setMentors] = useState<MentorProps[]>([]);
  const [subscribedMentors, setSubscribedMentors] = useState<MentorProps[]>([]);
  const [groupMeetings, setGroupMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentorStatus, setMentorStatus] = useState<any>(null);
  const [hideBanner, setHideBanner] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredCoupons, setFeaturedCoupons] = useState<any[]>([]);
  const [mySubmittedReviews, setMySubmittedReviews] = useState<any[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const [freeTrialMaxChats, setFreeTrialMaxChats] = useState<number>(3);
  const [selectedSubscribeMentor, setSelectedSubscribeMentor] = useState<MentorProps | null>(null);

  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState<{
    isOpen: boolean;
    minRequired: number;
    mentorName: string;
    mentorAvatar?: string;
    mentorMonthlyPrice?: number;
    mentor?: MentorProps;
  }>({
    isOpen: false,
    minRequired: 15,
    mentorName: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("error") === "unauthorized") {
        toast.error("You don't have permission to access the requested page.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [toast]);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch("/api/pricing");
        if (res.ok) {
          const data = await res.json();
          if (data.pricing?.freeTrialMaxChats) {
            setFreeTrialMaxChats(data.pricing.freeTrialMaxChats);
          }
        }
      } catch (err) {
        console.error("Failed to load pricing config", err);
      }
    };

    const fetchMentors = async () => {
      try {
        const res = await fetch("/api/mentors");
        const data = await res.json();
        if (res.ok) {
          setMentors(data.mentors);
        }
        
        const subRes = await fetch("/api/mentors/subscribed");
        const subData = await subRes.json();
        if (subRes.ok) {
          setSubscribedMentors(subData.mentors);
        }

        const meetingsRes = await fetch("/api/mentors/group-meetings?filter=upcoming");
        const meetingsData = await meetingsRes.json();
        if (meetingsRes.ok) {
          setGroupMeetings(meetingsData.meetings);
        }
      } catch (err) {
        console.error("Failed to fetch mentors", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchMyStatus = async () => {
      try {
        const res = await fetch("/api/mentors/my-status");
        if (res.ok) {
          const data = await res.json();
          if (data.hasApplied) setMentorStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch status", err);
      }
    };

    const fetchDashboardContent = async () => {
      try {
        const res = await fetch("/api/dashboard-content");
        if (res.ok) {
          const data = await res.json();
          setOffers(data.offers || []);
          setCategories(data.categories || []);
          setFeaturedCoupons(data.coupons || []);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard content", err);
      }
    };

    const fetchSubmittedReviews = async () => {
      try {
        const res = await fetch("/api/reviews?mySubmitted=true");
        if (res.ok) {
          const data = await res.json();
          setMySubmittedReviews(data.reviews || []);
        }
      } catch (err) {
        console.error("Failed to fetch submitted reviews", err);
      }
    };

    fetchPricing();
    fetchMentors();
    fetchMyStatus();
    fetchDashboardContent();
    fetchSubmittedReviews();
  }, []);

  const activeOffers = offers.filter(offer => {
    if (offer.newUsersOnly) {
      return (user?.freeTrialChatsUsed ?? 0) < freeTrialMaxChats;
    }
    return true;
  });

  const handleChat = async (mentorId: string) => {
    if (mentorId === user?.id) {
      router.push("/mentor-dashboard");
      return;
    }
    const targetMentor = mentors.find(m => m.id === mentorId || m.profileId === mentorId);
    try {
      const res = await fetch("/api/chats/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/chats/${data.chatId}`);
      } else if (data.requireRecharge) {
        setInsufficientBalanceModal({
          isOpen: true,
          minRequired: data.minRequired || targetMentor?.pricePerMinute || 15,
          mentorName: targetMentor?.name || "Mentor",
          mentorAvatar: targetMentor?.avatar,
          mentorMonthlyPrice: data.mentorMonthlyPrice || targetMentor?.monthlyPrice,
          mentor: targetMentor,
        });
      } else {
        toast.error(data.error || "Failed to initiate chat");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleCall = (mentorId: string) => {
    if (mentorId === user?.id) {
      router.push("/mentor-dashboard");
      return;
    }
    router.push(`/book-call/${mentorId}`);
  };

  const handleBook = (mentorId: string) => {
    if (mentorId === user?.id) {
      router.push("/mentor-dashboard");
      return;
    }
    router.push(`/book-call/${mentorId}`);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Review deleted successfully");
        setMySubmittedReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        toast.error("Failed to delete review");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleUpdateReview = async () => {
    if (!editingReviewId) return;
    setIsUpdatingReview(true);
    try {
      const res = await fetch(`/api/reviews`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: editingReviewId, rating: editRating, comment: editComment }),
      });
      if (res.ok) {
        toast.success("Review updated successfully");
        const data = await res.json();
        setMySubmittedReviews(prev => prev.map(r => r.id === editingReviewId ? data.review : r));
        setEditingReviewId(null);
      } else {
        toast.error("Failed to update review");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const handleSubscribe = (mentor: MentorProps) => {
    if (mentor.id === user?.id) {
      router.push("/mentor-dashboard");
      return;
    }
    setSelectedSubscribeMentor(mentor);
    setIsSubscribeModalOpen(true);
  };

  return (
    <div className="flex-col w-full max-w-7xl mx-auto transition-colors">
      {/* Mentor Application Status Banner */}
      {mentorStatus && !hideBanner && (
        <div className="px-4 lg:px-6 pt-4">
          {mentorStatus.status === "PENDING" && (
            <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800/60 text-yellow-800 dark:text-yellow-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-sm">Application Under Review</h3>
                <p className="text-xs mt-0.5 opacity-90">We are reviewing your mentor application. We'll update you soon.</p>
              </div>
              <button onClick={() => setHideBanner(true)} className="text-yellow-600 dark:text-yellow-200 font-bold text-xs px-3 py-1 bg-yellow-100 dark:bg-yellow-900/60 rounded-lg">Dismiss</button>
            </div>
          )}
          {mentorStatus.status === "REJECTED" && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-rose-800 dark:text-rose-300">Application Not Approved</span>
                  <span className="text-[11px] font-bold bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full">Immediate Re-application Allowed</span>
                </div>
                <p className="text-xs text-rose-900 dark:text-rose-200">
                  <span className="font-bold">Reason:</span> &ldquo;{mentorStatus.rejectionReason || "Application details could not be verified."}&rdquo;
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  You can update your verification document or profile details and re-submit immediately.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => router.push("/onboarding/mentor")} 
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all whitespace-nowrap"
                >
                  Update & Re-apply Now
                </button>
                <button 
                  onClick={() => setHideBanner(true)} 
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold text-xs px-3 py-2 bg-slate-200/60 dark:bg-slate-800 rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          {mentorStatus.status === "APPROVED" && (
            <div className="bg-success/10 border border-success/20 text-success p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-sm">You are an approved mentor!</h3>
                <p className="text-xs mt-0.5 opacity-90">Go to your dashboard to manage your profile and availability.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push("/mentor-dashboard")} className="bg-success text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm hover:bg-success/90">Go to Dashboard</button>
                <button onClick={() => setHideBanner(true)} className="text-success font-bold text-xs px-3 py-1 bg-green-100 dark:bg-green-950/60 rounded-lg">Dismiss</button>
              </div>
            </div>
          )}
          {mentorStatus.status === "SUSPENDED" && (
            <div className="bg-slate-800 dark:bg-slate-900 border border-slate-900 dark:border-slate-800 text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-sm">Account Suspended</h3>
                <p className="text-xs mt-0.5 text-slate-300">Your mentor account has been suspended. Please contact support.</p>
              </div>
              <button onClick={() => setHideBanner(true)} className="text-slate-300 hover:text-white font-bold text-xs px-3 py-1 bg-slate-700 rounded-lg">Dismiss</button>
            </div>
          )}
        </div>
      )}

      {/* Banners */}
      {activeOffers.length > 0 && (
        <div className="p-4 lg:p-6 pb-2">
          <div className="flex overflow-x-auto gap-4 snap-x-mandatory no-scrollbar pb-2">
            {activeOffers.map((offer) => {
              const Icon = (PhosphorIcons as any)[offer.iconName] || PhosphorIcons.Star;
              const targetRoute = offer.title?.toLowerCase().includes("wallet") || offer.title?.toLowerCase().includes("recharge")
                ? "/wallet" 
                : "/explore";

              return (
                <div 
                  key={offer.id} 
                  onClick={() => router.push(targetRoute)}
                  className={`min-w-[85%] md:min-w-[400px] h-40 bg-gradient-to-r ${offer.gradientFrom} ${offer.gradientTo} rounded-2xl p-5 text-white flex flex-col justify-between relative overflow-hidden snap-center shrink-0 shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer group`}
                >
                  <div className="relative z-10 w-3/4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-white/20 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block border border-white/30 backdrop-blur-sm tracking-wider uppercase">
                        {offer.newUsersOnly ? "Special Welcome Offer" : "Exclusive Offer"}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xl leading-tight mb-1 drop-shadow-sm">{offer.title}</h3>
                    <p className="text-xs text-white/90 font-medium line-clamp-2">{offer.subtitle}</p>
                  </div>


                  {offer.customIconUrl || offer.iconName?.startsWith("http") || offer.iconName?.startsWith("data:") ? (
                    <img src={offer.customIconUrl || offer.iconName} alt="icon" className="absolute -right-2 -bottom-2 w-32 h-32 opacity-20 z-0 pointer-events-none group-hover:scale-110 transition-transform duration-300 object-contain" />
                  ) : (
                    <Icon weight="fill" className="absolute -right-4 -bottom-4 text-[120px] text-white/20 z-0 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="py-4 mb-2">
          <div className="flex items-center justify-between px-4 lg:px-6 mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Categories</h2>
            <Link href="/explore" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">View All</Link>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 lg:px-6 no-scrollbar pb-2">
            {categories.map((cat) => {
              const Icon = (PhosphorIcons as any)[cat.iconName] || PhosphorIcons.Star;
              return (
                <div key={cat.id} className="flex flex-col items-center gap-2 shrink-0 w-16 md:w-20 cursor-pointer group" onClick={() => router.push(`/mentors?category=${encodeURIComponent(cat.name)}`)}>
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-all overflow-hidden text-slate-800 dark:text-slate-200">
                    {cat.customIconUrl || cat.iconName?.startsWith("http") || cat.iconName?.startsWith("data:") ? (
                      <img src={cat.customIconUrl || cat.iconName} alt={cat.name} className="w-9 h-9 md:w-10 md:h-10 object-contain p-0.5" />
                    ) : (
                      <Icon weight="fill" className="text-2xl md:text-3xl text-brand-600 dark:text-brand-400" />
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold text-center leading-tight text-slate-700 dark:text-slate-300">{cat.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Coupons */}
      {featuredCoupons.length > 0 && (
        <div className="py-2 mb-2">
          <div className="px-4 lg:px-6 mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Available Coupons</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 lg:px-6 no-scrollbar pb-2">
            {featuredCoupons.map((coupon) => (
              <div key={coupon.id} className="min-w-[200px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-xl shadow-sm flex flex-col justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <PhosphorIcons.Ticket weight="fill" className="text-emerald-600 dark:text-emerald-400 text-lg" />
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-widest">{coupon.code}</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT`}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(coupon.code);
                    toast.success(`Coupon code ${coupon.code} copied! 📋`);
                  }}
                  className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/70 hover:bg-emerald-200 dark:hover:bg-emerald-900 py-1.5 px-3 rounded-lg transition text-center"
                >
                  Copy Code
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Group Meetings */}
      {groupMeetings.length > 0 && (
        <div className="py-2 mb-2">
          <div className="px-4 lg:px-6 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Exclusive Group Sessions</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 lg:px-6 no-scrollbar pb-2">
            {groupMeetings.map((meeting) => (
              <div key={meeting.id} className="min-w-[280px] md:min-w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col justify-between shrink-0 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{meeting.title}</h3>
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2">
                    {new Date(meeting.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{meeting.description}</p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <img 
                      src={meeting.mentor?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.mentor?.name || 'M')}`} 
                      className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700" 
                      alt={meeting.mentor?.name} 
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">By {meeting.mentor?.name}</span>
                  </div>
                </div>
                <Link 
                  href={`/group-meetings/${meeting.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 py-2 rounded-lg font-bold text-xs transition text-center flex items-center justify-center gap-2"
                >
                  <PhosphorIcons.VideoCamera weight="fill" className="text-base" /> Join Session
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free Trial Status Card (Student) */}
      {user?.role === "STUDENT" && (freeTrialMaxChats - (user?.freeTrialChatsUsed ?? 0) > 0) && (
        <div className="px-4 lg:px-6 pt-2 pb-2">
          <div className="bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border border-brand-200/80 dark:border-brand-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                <PhosphorIcons.Sparkle weight="fill" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Free Trial 1-on-1 Chats
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  You have <span className="font-bold text-brand-600 dark:text-brand-400">{Math.max(0, freeTrialMaxChats - (user?.freeTrialChatsUsed ?? 0))} of {freeTrialMaxChats}</span> introductory chats remaining to connect with mentors for free!
                </p>
              </div>
            </div>
            <Link
              href="/explore"
              className="self-start sm:self-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
            >
              Find a Mentor
            </Link>
          </div>
        </div>
      )}

      {/* Subscribed Mentors */}
      {subscribedMentors.length > 0 && (
        <>
          <div className="px-4 lg:px-6 py-3 flex items-center justify-between mt-2">
            <h2 className="text-base font-bold text-brand-700 dark:text-brand-400">My Subscribed Mentors</h2>
          </div>
          <div className="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscribedMentors.map((mentor) => (
              <MentorCard 
                key={mentor.id} 
                mentor={mentor} 
                onChat={handleChat}
                onCall={handleCall}
                onBook={handleBook}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        </>
      )}

      {/* My Submitted Reviews Section */}
      {mySubmittedReviews.length > 0 && (
        <div className="py-2 mb-2">
          <div className="px-4 lg:px-6 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <PhosphorIcons.Star weight="fill" className="text-amber-500" />
              My Submitted Ratings & Reviews
            </h2>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 lg:px-6 no-scrollbar pb-2">
            {mySubmittedReviews.map((review) => (
              <div
                key={review.id}
                className="min-w-[280px] md:min-w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between shrink-0"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <PhosphorIcons.Star
                          key={i}
                          weight={i < review.rating ? "fill" : "regular"}
                          className={i < review.rating ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      review.status === "APPROVED" 
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                    }`}>
                      {review.status}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-3 mb-3">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    To: {review.mentor?.user?.name || "Mentor"}
                  </span>
                  <span>•</span>
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingReviewId(review.id);
                        setEditRating(review.rating);
                        setEditComment(review.comment || "");
                      }}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReviewId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Edit Review</h3>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <PhosphorIcons.Star
                  key={star}
                  weight={star <= editRating ? "fill" : "regular"}
                  className={`text-2xl cursor-pointer transition ${star <= editRating ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}
                  onClick={() => setEditRating(star)}
                />
              ))}
            </div>
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
              rows={4}
              placeholder="Your comment (optional)"
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setEditingReviewId(null)}
                className="flex-1 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateReview}
                disabled={isUpdatingReview}
                className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
              >
                {isUpdatingReview ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Feed */}
      <div className="px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/60 mt-2 transition-colors">
        <h2 className="text-base font-bold text-slate-800 dark:text-white">Top Mentors</h2>
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <PhosphorIcons.Faders className="text-sm" /> Filters
        </button>
      </div>

      <div className="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
          </>
        ) : mentors.length > 0 ? (
          mentors.map((mentor) => (
            <MentorCard 
              key={mentor.id} 
              mentor={mentor} 
              onChat={handleChat}
              onCall={handleCall}
              onBook={handleBook}
              onSubscribe={handleSubscribe}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400">
            No mentors available right now. Apply to be a mentor!
          </div>
        )}
      </div>

      {selectedSubscribeMentor && (
        <SubscriptionCheckoutModal
          isOpen={isSubscribeModalOpen}
          onClose={() => setIsSubscribeModalOpen(false)}
          mentor={{
            id: selectedSubscribeMentor.profileId || selectedSubscribeMentor.id,
            name: selectedSubscribeMentor.name,
            avatar: selectedSubscribeMentor.avatar,
            monthlyPrice: selectedSubscribeMentor.monthlyPrice || 1000,
            categories: (selectedSubscribeMentor as any).categories || [],
          }}
          user={user}
          onSubscriptionSuccess={() => {
            setIsSubscribeModalOpen(false);
            fetch("/api/mentors/subscribed")
              .then(res => res.json())
              .then(data => { if (data.mentors) setSubscribedMentors(data.mentors); })
              .catch(() => {});
          }}
        />
      )}

      <InsufficientBalanceModal
        isOpen={insufficientBalanceModal.isOpen}
        onClose={() => setInsufficientBalanceModal(prev => ({ ...prev, isOpen: false }))}
        minRequired={insufficientBalanceModal.minRequired}
        mentorName={insufficientBalanceModal.mentorName}
        mentorAvatar={insufficientBalanceModal.mentorAvatar}
        mentorMonthlyPrice={insufficientBalanceModal.mentorMonthlyPrice}
        onSubscribeMonthly={() => {
          if (insufficientBalanceModal.mentor) {
            handleSubscribe(insufficientBalanceModal.mentor);
          }
        }}
      />
    </div>
  );
}
