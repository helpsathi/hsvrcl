"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export function HeroActions() {
  const { user, loading } = useAuth();

  const dashboardUrl = (user?.role === "ADMIN" || user?.adminSubRole)
    ? "/admin" 
    : (user?.role === "MENTOR" ? "/mentor-dashboard" : "/dashboard");

  if (loading) {
    return (
      <div className="bg-blue-600/50 text-transparent font-semibold px-8 py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-pulse cursor-default">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <a 
        href={dashboardUrl} 
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 group shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98]"
      >
        Go to Dashboard
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </a>
    );
  }

  return (
    <Link href="/login" className="bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98]">
      Find Your Mentor
      <span className="group-hover:translate-x-1 transition-transform">→</span>
    </Link>
  );
}
