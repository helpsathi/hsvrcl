"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { List, X, UserCircle, SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/components/providers/AuthProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";

const NAV_LINKS = [
  { href: "/mentors", label: "Find Mentors" },
  { href: "/categories", label: "Categories" },
  { href: "/pricing", label: "Pricing" },
  { href: "/community", label: "Community" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const dashboardUrl = (user?.role === "ADMIN" || user?.adminSubRole)
    ? "/admin" 
    : (user?.role === "MENTOR" ? "/mentor-dashboard" : "/dashboard");

  return (
    <nav className="sticky top-0 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md z-50 border-b border-slate-200/70 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <BrandLogo href="/" size="md" />

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 lg:px-3.5 lg:py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Actions (Theme toggle + Auth buttons) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          
          {loading ? (
            <div className="w-24 h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
          ) : user ? (
            <>
              <button
                onClick={logout}
                title="Logout"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 px-3.5 py-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-xl transition-colors"
              >
                <SignOut size={18} weight="bold" />
                <span>Logout</span>
              </button>
              <Link
                href={dashboardUrl}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm rounded-xl font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all whitespace-nowrap active:scale-[0.98]"
              >
                <UserCircle size={20} weight="fill" />
                <span>Dashboard</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-bold text-slate-700 dark:text-slate-200 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm rounded-xl font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all whitespace-nowrap active:scale-[0.98]"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            {user ? (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm"
                >
                  <SignOut size={18} weight="bold" />
                  <span>Logout</span>
                </button>
                <Link
                  href={dashboardUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm"
                >
                  <UserCircle size={18} weight="fill" />
                  <span>Dashboard</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
