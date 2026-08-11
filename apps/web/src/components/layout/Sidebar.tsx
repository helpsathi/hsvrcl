"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  House, 
  UsersThree, 
  Wallet, 
  ChatCircleDots, 
  User, 
  SignOut, 
  ChalkboardTeacher, 
  SealCheck, 
  CalendarBlank, 
  Sparkle,
  Megaphone,
  VideoCamera,
  Receipt,
  ClockCounterClockwise,
  CalendarCheck
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: "/dashboard", label: "Home", icon: House },
    { href: "/explore", label: "Mentors", icon: ChalkboardTeacher },
    ...(user?.role === "STUDENT" ? [{ href: "/my-mentors", label: "My Mentors", icon: SealCheck }] : []),
    { href: "/community", label: "Community", icon: UsersThree },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/payment-history", label: "Payment History", icon: Receipt },
    { href: "/chats", label: "Chats", icon: ChatCircleDots, badge: true },
    { href: "/chat-history", label: "Chat History", icon: ClockCounterClockwise },
    ...(user?.role !== "MENTOR" ? [{ href: "/scheduled-calls", label: "Scheduled Calls", icon: CalendarBlank }] : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full z-40 shrink-0 relative transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <BrandLogo href="/dashboard" badge={user?.role === "MENTOR" ? "Mentor" : undefined} size="md" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors relative",
                isActive ? "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <Icon weight={isActive ? "fill" : "regular"} className="text-xl" />
              {link.label}
              {link.badge && (
                <span className="absolute top-3.5 right-4 w-2 h-2 bg-danger rounded-full"></span>
              )}
            </Link>
          );
        })}

        <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Account</div>
        {user?.role === "MENTOR" && (
          <>
            <Link
              href="/mentor-dashboard"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                pathname === "/mentor-dashboard" ? "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <User weight={pathname === "/mentor-dashboard" ? "fill" : "regular"} className="text-xl" />
              Mentor Panel
            </Link>
            <Link
              href="/mentor-dashboard/group-meetings"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                pathname.startsWith("/mentor-dashboard/group-meetings") ? "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <VideoCamera weight={pathname.startsWith("/mentor-dashboard/group-meetings") ? "fill" : "regular"} className="text-xl" />
              Group Sessions
            </Link>
            <Link
              href="/mentor-dashboard/proposals"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                pathname.startsWith("/mentor-dashboard/proposals") ? "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <Sparkle weight={pathname.startsWith("/mentor-dashboard/proposals") ? "fill" : "regular"} className="text-xl" />
              Session Proposals
            </Link>
            <Link
              href="/mentor-dashboard/availability"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                pathname.startsWith("/mentor-dashboard/availability") ? "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <CalendarBlank weight={pathname.startsWith("/mentor-dashboard/availability") ? "fill" : "regular"} className="text-xl" />
              Availability
            </Link>
            <Link
              href="/scheduled-calls"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                pathname === "/scheduled-calls" ? "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <CalendarCheck weight={pathname === "/scheduled-calls" ? "fill" : "regular"} className="text-xl" />
              Upcoming Calls
            </Link>
          </>
        )}
        <Link
          href="/profile"
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
            pathname === "/profile" ? "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          )}
        >
          <User weight={pathname === "/profile" ? "fill" : "regular"} className="text-xl" />
          Profile
        </Link>
        <InstallAppButton variant="sidebar" />
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-danger hover:bg-danger/5 dark:hover:bg-danger/10 transition-colors mt-4"
        >
          <SignOut className="text-xl" />
          Logout
        </button>
      </nav>

      {user?.role === "STUDENT" && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/onboarding/mentor"
            className="w-full flex justify-center bg-slate-900 dark:bg-brand-600 text-white rounded-xl py-3 text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-brand-500 transition-colors"
          >
            Become a Mentor
          </Link>
        </div>
      )}
    </aside>
  );
}
