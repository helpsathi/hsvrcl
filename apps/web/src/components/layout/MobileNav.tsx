"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  House, 
  UsersThree, 
  Wallet, 
  ChatCircleDots, 
  ChalkboardTeacher,
  SealCheck,
  CalendarBlank,
  User,
  SignOut,
  Sparkle,
  SquaresFour,
  X,
  CaretRight,
  Megaphone,
  Receipt,
  VideoCamera,
  ClockCounterClockwise,
  CalendarCheck
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-close drawer on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  if ((pathname?.startsWith("/chats/") && pathname !== "/chats") || pathname?.startsWith("/book-call") || pathname?.startsWith("/onboarding")) {
    return null;
  }

  const isMentor = user?.role === "MENTOR";

  const coreLinks = isMentor
    ? [
        { href: "/dashboard", label: "Home", icon: House },
        { href: "/mentor-dashboard", label: "Panel", icon: User },
        { href: "/chats", label: "Chats", icon: ChatCircleDots, badge: true },
        { href: "/scheduled-calls", label: "Calls", icon: CalendarBlank },
      ]
    : [
        { href: "/dashboard", label: "Home", icon: House },
        { href: "/mentors", label: "Mentors", icon: ChalkboardTeacher },
        { href: "/my-mentors", label: "My Mentors", icon: SealCheck },
        { href: "/chats", label: "Chats", icon: ChatCircleDots, badge: true },
      ];

  return (
    <>
      {/* 5-Item Zero-Clutter Bottom Bar */}
      <nav className="md:hidden w-full shrink-0 relative h-[72px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-[40] flex items-center justify-around px-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-colors">
        {coreLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className="relative flex flex-col items-center justify-center w-full h-full gap-1 pt-1"
            >
              <div className={cn(
                "flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200",
                isActive ? "bg-brand-50 dark:bg-brand-950/60 shadow-xs" : "bg-transparent"
              )}>
                <Icon 
                  weight={isActive ? "fill" : "regular"} 
                  className={cn(
                    "text-2xl transition-colors",
                    isActive ? "text-brand-700 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"
                  )} 
                />
              </div>
              <span className={cn(
                "text-[10px] font-bold transition-colors line-clamp-1 text-center px-0.5",
                isActive ? "text-brand-900 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"
              )}>
                {link.label}
              </span>
              
              {link.badge && (
                <span className="absolute top-2 right-[calc(50%-14px)] w-2 h-2 bg-danger rounded-full border border-white dark:border-slate-900"></span>
              )}
            </Link>
          );
        })}

        {/* 5th Tab: Menu / More Drawer Toggle */}
        <button
          key="menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="relative flex flex-col items-center justify-center w-full h-full gap-1 pt-1 focus:outline-none"
        >
          <div className={cn(
            "flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200",
            isMenuOpen ? "bg-brand-50 dark:bg-brand-950/60 shadow-xs" : "bg-transparent"
          )}>
            <SquaresFour 
              weight={isMenuOpen ? "fill" : "regular"} 
              className={cn(
                "text-2xl transition-colors",
                isMenuOpen ? "text-brand-700 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"
              )} 
            />
          </div>
          <span className={cn(
            "text-[10px] font-bold transition-colors line-clamp-1 text-center px-0.5",
            isMenuOpen ? "text-brand-900 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"
          )}>
            More
          </span>
        </button>
      </nav>

      {/* Side Slide-Out Menu Drawer */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-[340px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header / User Info */}
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <UserAvatar src={user?.avatar} name={user?.name} size="sm" />
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">{user?.name || "User Account"}</div>
                  <div className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">{user?.role || "Student"} Role</div>
                </div>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)} 
                className="p-2 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Close menu"
              >
                <X className="text-xl" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* PWA App Install Card in Menu */}
              <InstallAppButton variant="drawer" />

              {/* Explore & Appointments */}
              <div className="space-y-1.5">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Appointments & Community</div>
                {!isMentor && (
                  <Link
                    href="/scheduled-calls"
                    className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarBlank weight="duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
                      <span>Scheduled Calls & Meet Links</span>
                    </div>
                    <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                  </Link>
                )}
                <Link
                  href="/announcements"
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Megaphone weight="duotone" className="text-2xl text-amber-500 dark:text-amber-400" />
                    <span>Announcements & Updates</span>
                  </div>
                  <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                </Link>
                <Link
                  href="/mentors"
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <ChalkboardTeacher weight="duotone" className="text-2xl text-brand-600 dark:text-brand-400" />
                    <span>Discover Mentors Catalog</span>
                  </div>
                  <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                </Link>
                <Link
                  href="/community"
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <UsersThree weight="duotone" className="text-2xl text-indigo-600 dark:text-indigo-400" />
                    <span>Community Forum</span>
                  </div>
                  <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                </Link>
              </div>

              {/* Mentor Tools */}
              {isMentor && (
                <div className="space-y-1.5">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mentor Management</div>
                  <Link
                    href="/mentor-dashboard"
                    className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <User weight="duotone" className="text-2xl text-emerald-600 dark:text-emerald-400" />
                      <span>Mentor Panel</span>
                    </div>
                    <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                  </Link>
                  <Link
                    href="/mentor-dashboard/group-meetings"
                    className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <VideoCamera weight="duotone" className="text-2xl text-purple-600 dark:text-purple-400" />
                      <span>Group Sessions</span>
                    </div>
                    <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                  </Link>
                  <Link
                    href="/mentor-dashboard/proposals"
                    className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkle weight="duotone" className="text-2xl text-amber-500 dark:text-amber-400" />
                      <span>Session Proposals</span>
                    </div>
                    <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                  </Link>
                  <Link
                    href="/mentor-dashboard/availability"
                    className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarBlank weight="duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
                      <span>Manage Availability</span>
                    </div>
                    <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                  </Link>
                  <Link
                    href="/scheduled-calls"
                    className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarCheck weight="duotone" className="text-2xl text-amber-500 dark:text-amber-400" />
                      <span>Upcoming Calls</span>
                    </div>
                    <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                  </Link>
                </div>
              )}

              {/* Account & Finance */}
              <div className="space-y-1.5">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Account & Wallet</div>
                <Link
                  href="/wallet"
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Wallet weight="duotone" className="text-2xl text-brand-600 dark:text-brand-400" />
                    <span>Wallet & Recharge</span>
                  </div>
                  <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                </Link>
                <Link
                  href="/payment-history"
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Receipt weight="duotone" className="text-2xl text-emerald-600 dark:text-emerald-400" />
                    <span>Payment History & Invoices</span>
                  </div>
                  <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                </Link>
                <Link
                  href="/chat-history"
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <ClockCounterClockwise weight="duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
                    <span>Chat History & Logs</span>
                  </div>
                  <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <User weight="duotone" className="text-2xl text-violet-600 dark:text-violet-400" />
                    <span>Profile Settings</span>
                  </div>
                  <CaretRight className="text-slate-400 dark:text-slate-500 text-lg" />
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-danger/5 dark:bg-danger/10 hover:bg-danger/10 dark:hover:bg-danger/20 text-danger font-bold text-sm transition-all mt-1"
                >
                  <div className="flex items-center gap-3">
                    <SignOut weight="duotone" className="text-2xl text-danger" />
                    <span>Logout</span>
                  </div>
                </button>
              </div>

              {/* Become a Mentor CTA (For Students) */}
              {!isMentor && (
                <div className="pt-3">
                  <Link
                    href="/onboarding/mentor"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-brand-600 dark:to-brand-500 text-white rounded-2xl py-4 px-4 text-sm font-extrabold shadow-xl hover:opacity-95 transition-opacity text-center"
                  >
                    <span>🚀 Become a Mentor</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
