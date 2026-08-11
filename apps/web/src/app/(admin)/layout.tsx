"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  SquaresFour,
  Users,
  CurrencyInr,
  ChartLineUp,
  SignOut,
  ChalkboardTeacher,
  Gear,
  Ticket,
  Bell,
  Star,
  FileText,
  Sun,
  Moon,
  ListDashes,
  Megaphone,
  List,
  X,
  CreditCard,
  Wallet,
  ChatCircleDots,
  CalendarCheck,
  UsersThree,
  ClockCounterClockwise,
  Receipt,
  Plug
} from "@phosphor-icons/react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login?error=session_expired");
      return;
    }

    const isAdminUser = user.role === "ADMIN" || Boolean(user.adminSubRole);
    if (!isAdminUser) {
      const redirectUrl = user.role === "MENTOR" ? "/mentor-dashboard?error=unauthorized" : "/dashboard?error=unauthorized";
      router.replace(redirectUrl);
    }
  }, [user, loading, router]);

  const isAdminUser = Boolean(user && (user.role === "ADMIN" || user.adminSubRole));
  if (loading || !user || !isAdminUser) {
    return null;
  }

  const allNavItems = [
    { name: "Dashboard", href: "/admin", icon: SquaresFour, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] },
    { name: "Users & Mentors", href: "/admin/users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] },
    { name: "Mentor Applications", href: "/admin/applications", icon: ChalkboardTeacher, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] },
    { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] },
    { name: "Payments", href: "/admin/payments", icon: Receipt, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "FINANCE"] },
    { name: "Wallets", href: "/admin/wallets", icon: Wallet, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] },
    { name: "Chat Sessions", href: "/admin/chats", icon: ChatCircleDots, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] },
    { name: "Scheduled Calls", href: "/admin/scheduled-calls", icon: CalendarCheck, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] },
    { name: "Payouts", href: "/admin/payouts", icon: CurrencyInr, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "FINANCE"] },
    { name: "Community Moderation", href: "/admin/community", icon: UsersThree, roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
    { name: "Platform Settings", href: "/admin/config", icon: Gear, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Connected Services", href: "/admin/services", icon: Plug, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Categories", href: "/admin/categories", icon: ListDashes, roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
    { name: "Offers & Banners", href: "/admin/offers", icon: Megaphone, roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Notifications", href: "/admin/notifications", icon: Bell, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] },
    { name: "Review Moderation", href: "/admin/reviews", icon: Star, roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] },
    { name: "Reports & CSV", href: "/admin/reports", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "FINANCE"] },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: ClockCounterClockwise, roles: ["SUPER_ADMIN", "ADMIN"] },
  ];

  const subRole = user?.adminSubRole || "SUPER_ADMIN";
  const navItems = allNavItems.filter((item) => !item.roles || item.roles.includes(subRole) || subRole === "SUPER_ADMIN" || subRole === "ADMIN");

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] md:h-screen md:max-h-screen bg-[#faf8ff] dark:bg-[#0f172a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-[#faf8ff] to-purple-100/40 dark:from-blue-900/20 dark:via-[#0f172a] dark:to-purple-900/20 text-slate-900 dark:text-slate-100 font-sans overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-r border-white/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-300 flex flex-col hidden md:flex shrink-0 shadow-2xl shadow-blue-900/5 z-20">
        <div className="h-20 flex items-center px-6 border-b border-white/50 dark:border-slate-800/50">
          <BrandLogo href="/admin" badge="Admin" size="md" />
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(`${item.href}`));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                    : "hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                <item.icon weight={isActive ? "fill" : "bold"} className="text-xl" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/50 dark:border-slate-800/50 space-y-4">
          <InstallAppButton variant="sidebar" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all" />

          {mounted && (
            <div className="bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-md p-1.5 rounded-2xl flex items-center shadow-inner border border-white/40 dark:border-slate-800/50">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Sun weight={theme === 'light' ? "fill" : "bold"} className="text-base" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Moon weight={theme === 'dark' ? "fill" : "bold"} className="text-base" /> Dark
              </button>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm w-full text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
          >
            <SignOut weight="bold" className="text-xl" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
              <BrandLogo href="/admin" badge="Admin" size="sm" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg"
              >
                <X weight="bold" className="text-2xl" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(`${item.href}`));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <item.icon weight={isActive ? "fill" : "bold"} className="text-xl" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm w-full text-red-500 hover:bg-red-500/10"
              >
                <SignOut weight="bold" className="text-xl" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Mobile Header */}
        <header className="md:hidden h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-white/50 dark:border-slate-800/50 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation"
              className="w-10 h-10 flex items-center justify-center bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-xl border border-white/50 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
            >
              <List weight="bold" className="text-xl" />
            </button>
            <BrandLogo href="/admin" badge="Admin" size="sm" />
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="w-10 h-10 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-xl border border-white/50 dark:border-slate-700"
              >
                {theme === 'dark' ? <Sun weight="bold" /> : <Moon weight="bold" />}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col min-h-0">
          <div className="flex-1">
            {children}
          </div>
          <div className="h-24 md:h-12 shrink-0 w-full pointer-events-none" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
}
