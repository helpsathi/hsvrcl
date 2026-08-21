"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { MentorCard, MentorProps } from "@/components/mentors/MentorCard";
import SubscriptionCheckoutModal from "@/components/mentors/SubscriptionCheckoutModal";
import { MentorCardSkeleton, Skeleton, DirectoryLoadingSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/providers/ToastProvider";
import InsufficientBalanceModal from "@/components/wallet/InsufficientBalanceModal";
import * as PhosphorIcons from "@phosphor-icons/react";
import { MagnifyingGlass, UsersThree, Faders } from "@phosphor-icons/react";
import { Pagination } from "@/components/ui/Pagination";

function MentorsDirectoryContent() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";
  const initialCategory = searchParams?.get("category") || "All";

  const [mentors, setMentors] = useState<MentorProps[]>([]);
  const [subscribedMentors, setSubscribedMentors] = useState<MentorProps[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetchingMentors, setIsFetchingMentors] = useState(false);
  const [freeTrialMaxChats, setFreeTrialMaxChats] = useState<number>(3);

  // Keep search query and category updated if URL parameters change from navigation
  useEffect(() => {
    const q = searchParams?.get("search") || "";
    const c = searchParams?.get("category");
    setSearchQuery(q);
    if (c) {
      setSelectedCategory(c);
    }
    setPage(1);
  }, [searchParams]);

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
    fetchPricing();
  }, []);

  useEffect(() => {
    const fetchMentorsData = async () => {
      setIsFetchingMentors(true);
      try {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", "16");
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        if (selectedCategory !== "All") params.append("category", selectedCategory);

        const mentorsRes = await fetch(`/api/mentors?${params.toString()}`);
        if (mentorsRes.ok) {
          const mData = await mentorsRes.json();
          setMentors(mData.mentors || []);
          if (mData.pagination) {
            setTotalPages(mData.pagination.totalPages);
          }
        }
      } catch (err) {
        console.error("Failed to fetch mentors", err);
      } finally {
        setIsFetchingMentors(false);
      }
    };
    fetchMentorsData();
  }, [page, searchQuery, selectedCategory]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch Subscribed Mentors
        const subRes = await fetch("/api/mentors/subscribed");
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscribedMentors(subData.mentors || []);
        }
        
        // Fetch Categories and Offers
        const catRes = await fetch("/api/dashboard-content");
        if (catRes.ok) {
          const cData = await catRes.json();
          setCategories(cData.categories || []);
          setOffers(cData.offers || []);
        }
      } catch (err) {
        console.error("Failed to fetch initial data for directory", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const activeOffers = offers.filter(offer => {
    if (offer.newUsersOnly) {
      return (user?.freeTrialChatsUsed ?? 0) < freeTrialMaxChats;
    }
    return true;
  });

  const handleChat = async (mentorId: string) => {
    if (!user) {
      router.push("/login?redirect=/mentors");
      return;
    }
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
    if (!user) {
      router.push("/login?redirect=/mentors");
      return;
    }
    if (mentorId === user?.id) {
      router.push("/mentor-dashboard");
      return;
    }
    router.push(`/book-call/${mentorId}`);
  };

  const handleBook = (mentorId: string) => {
    if (!user) {
      router.push("/login?redirect=/mentors");
      return;
    }
    if (mentorId === user?.id) {
      router.push("/mentor-dashboard");
      return;
    }
    router.push(`/book-call/${mentorId}`);
  };

  const handleSubscribe = (mentor: MentorProps) => {
    if (!user) {
      router.push("/login?redirect=/mentors");
      return;
    }
    if (mentor.id === user?.id) {
      router.push("/mentor-dashboard");
      return;
    }
    setSelectedSubscribeMentor(mentor);
    setIsSubscribeModalOpen(true);
  };

  // We are now doing backend filtering via the API, but we keep this empty fallback just in case
  const filteredMentors = mentors;

  return (
    <div className="flex-col w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6 transition-colors">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UsersThree weight="fill" className="text-brand-main dark:text-brand-400" /> Mentor Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Browse, search, and connect with expert mentors by skills or name.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg" />
          <input 
            type="text" 
            placeholder="Search by mentor name, skills..."
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              setPage(1);
              if (!val) {
                router.replace("/explore");
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => { setSelectedCategory("All"); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
            selectedCategory === "All" 
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" 
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          All Mentors
        </button>
        {loading && categories.length === 0 ? (
          <>
            <Skeleton className="h-8 w-24 rounded-xl shrink-0" />
            <Skeleton className="h-8 w-28 rounded-xl shrink-0" />
            <Skeleton className="h-8 w-20 rounded-xl shrink-0" />
            <Skeleton className="h-8 w-32 rounded-xl shrink-0" />
          </>
        ) : (
          categories.map((cat) => {
            const IconComponent = (PhosphorIcons as any)[cat.iconName];
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${
                  selectedCategory === cat.name
                    ? "bg-brand-500 dark:bg-brand-600 text-white border-transparent"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {IconComponent && <IconComponent weight={selectedCategory === cat.name ? "fill" : "regular"} className="text-sm shrink-0" />}
                {cat.name}
              </button>
            );
          })
        )}
        {!loading && !categories.some(c => c.name?.toLowerCase() === "other") && (
          <button
            onClick={() => { setSelectedCategory("Other"); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === "Other" 
                ? "bg-brand-500 dark:bg-brand-600 text-white border-transparent" 
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <PhosphorIcons.SquaresFour weight={selectedCategory === "Other" ? "fill" : "regular"} className="text-sm shrink-0" />
            Other
          </button>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center h-5">
          {loading ? (
            <Skeleton className="h-4 w-32 rounded-full" />
          ) : (
            `${filteredMentors.length} mentor${filteredMentors.length === 1 ? '' : 's'} found${searchQuery ? ` for "${searchQuery}"` : ''}`
          )}
        </h2>

      </div>

      {/* Mentor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading || isFetchingMentors ? (
          <>
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
            <MentorCardSkeleton />
          </>
        ) : filteredMentors.length > 0 ? (
          filteredMentors.map((mentor) => (
            <MentorCard 
              key={mentor.id} 
              mentor={mentor} 
              onChat={handleChat}
              onCall={handleCall}
              onBook={handleBook}
              onSubscribe={handleSubscribe}
              isSubscribed={subscribedMentors.some(sm => (sm.id === mentor.id || sm.profileId === mentor.id) && !sm.subscription?.isExpired)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed transition-colors">
            <UsersThree className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Mentors Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No mentors matched your search for skills or name. Try adjusting your search query or category filter.</p>
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                router.replace("/explore");
              }}
              className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {!loading && !isFetchingMentors && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

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

export default function MentorsDirectoryPage() {
  return (
    <Suspense fallback={<DirectoryLoadingSkeleton />}>
      <MentorsDirectoryContent />
    </Suspense>
  );
}
