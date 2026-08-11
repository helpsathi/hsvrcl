"use client";

import { useState, useEffect, Suspense } from "react";
import { MagnifyingGlass, Translate, Wallet, X, Sun, Moon, Bell } from "@phosphor-icons/react";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-50 shrink-0" />;
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500"
      aria-label="Toggle Theme"
      title="Toggle Light / Dark Mode"
    >
      {isDark ? (
        <Sun weight="fill" className="text-base sm:text-lg text-amber-400 animate-in spin-in-12 duration-300" />
      ) : (
        <Moon weight="fill" className="text-base sm:text-lg text-slate-700 animate-in spin-in-12 duration-300" />
      )}
    </button>
  );
}

function DesktopSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (pathname?.startsWith("/mentors")) {
      const q = searchParams.get("search") || "";
      setQuery(q);
    }
  }, [pathname, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (clean || pathname?.startsWith("/mentors")) {
      router.push(`/mentors?search=${encodeURIComponent(clean)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
      <div className="relative w-full">
        <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 text-lg" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search mentors by name, skill, or exam..." 
          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-full py-2.5 pl-10 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-400 shadow-2xs"
        />
        {query && (
          <button 
            type="button" 
            onClick={() => {
              setQuery("");
              if (pathname?.startsWith("/mentors")) {
                router.push("/mentors");
              }
            }} 
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm"
            aria-label="Clear search"
          >
            <X weight="bold" />
          </button>
        )}
      </div>
    </form>
  );
}

function MobileSearchAction() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/mentors")) {
      const q = searchParams.get("search") || "";
      setQuery(q);
    }
  }, [pathname, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (clean || pathname?.startsWith("/mentors")) {
      router.push(`/mentors?search=${encodeURIComponent(clean)}`);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500"
        aria-label="Open global search"
        title="Search mentors and skills"
      >
        <MagnifyingGlass weight="bold" className="text-base sm:text-lg text-slate-700 dark:text-slate-200" />
      </button>

      {/* Expandable Mobile Search Bar Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-3.5 shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input 
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by skill, mentor name..." 
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              {query && (
                <button 
                  type="button" 
                  onClick={() => setQuery("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label="Clear search"
                >
                  <X weight="bold" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity shrink-0"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              aria-label="Close search"
            >
              <X weight="bold" className="text-lg" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchNotifCount = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok && isMounted) {
          const data = await res.json();
          const unread = (data.notifications || []).filter((n: any) => !n.isRead).length;
          setUnreadNotifCount(unread);
        }
      } catch (err) {
        // Silently ignore background polling / abort errors
      }
    };
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/wallet");
        if (res.ok && isMounted) {
          const data = await res.json();
          setBalance(data.wallet?.balance ?? 0);
        }
      } catch (err) {
        // Silently ignore background polling / abort errors
      }
    };
    fetchBalance();
    
    // Poll every 30s to keep it fresh
    const interval = setInterval(fetchBalance, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  if (pathname?.startsWith("/chats/") && pathname !== "/chats") {
    return null;
  }

  return (
    <header className="bg-surface dark:bg-slate-900 px-2.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-30 shrink-0 lg:px-8 relative transition-colors shadow-2xs">
      {/* Mobile Logo */}
      <div className="flex items-center gap-1.5 md:hidden shrink-0">
        <img src="/logo.png" alt="Help Sathi" className="h-7 w-auto drop-shadow-sm" />
        <span className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight leading-none">Help Sathi</span>
      </div>

      {/* Desktop Search Center */}
      <Suspense fallback={<div className="hidden md:flex flex-1 max-w-md mx-4 h-9 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />}>
        <DesktopSearchBar />
      </Suspense>
      
      {/* Right Actions Group */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 ml-auto shrink-0">
        <button className="hidden md:flex items-center gap-1 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <Translate className="text-sm" /> EN
        </button>

        {/* Mobile Search Action inside Right Actions beside Wallet */}
        <Suspense fallback={<div className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />}>
          <MobileSearchAction />
        </Suspense>

        {/* Persistent Theme Toggle */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {/* Notifications Bell Link */}
        <Link
          href="/notifications"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs shrink-0 relative focus:outline-none focus:ring-2 focus:ring-brand-500"
          title="Notification Center"
          aria-label="View notifications"
        >
          <Bell weight="fill" className="text-base sm:text-lg text-slate-700 dark:text-slate-200" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-main text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
              {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
            </span>
          )}
        </Link>

        {/* Wallet Badge Button */}
        <Link 
          href="/wallet" 
          className="h-8 sm:h-9 flex items-center gap-1 sm:gap-1.5 bg-brand-main/15 dark:bg-brand-500/20 border border-brand-500 text-brand-800 dark:text-brand-300 px-2.5 sm:px-3 py-1 rounded-full font-bold text-xs sm:text-sm shadow-2xs hover:bg-brand-main/25 transition-colors shrink-0"
        >
          <Wallet weight="fill" className="text-sm sm:text-base text-brand-600 dark:text-brand-400" /> 
          <span>₹{balance !== null ? (balance % 1 === 0 ? balance : balance.toFixed(2)) : "..."}</span>
        </Link>

        {/* User Profile Avatar */}
        <Link href="/profile" className="flex items-center justify-center shrink-0">
          <UserAvatar src={user?.avatar} name={user?.name} size="sm" />
        </Link>
      </div>
    </header>
  );
}
