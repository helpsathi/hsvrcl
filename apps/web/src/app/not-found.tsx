"use client";
import Link from "next/link";
import { Compass, House, MagnifyingGlass } from "@phosphor-icons/react";

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12 bg-transparent text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-lg w-full text-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-10 shadow-2xl shadow-purple-500/10 relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-purple-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-purple-500/20">
          <Compass weight="duotone" className="text-5xl animate-bounce" />
        </div>
        
        <span className="inline-block text-xs font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text tracking-widest uppercase mb-2">
          Error 404
        </span>

        <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">
          Page Not Found
        </h2>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
          The mentorship page or resource you are looking for has either been moved, archived, or simply does not exist.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2.5 py-3.5 px-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
          >
            <House weight="bold" className="text-lg" />
            Return Home
          </Link>
          
          <Link
            href="/categories"
            className="flex items-center justify-center gap-2.5 py-3.5 px-7 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-2xl border border-slate-300/50 dark:border-slate-700 transition-all"
          >
            <MagnifyingGlass weight="bold" className="text-lg" />
            Browse Mentors
          </Link>
        </div>
      </div>
    </div>
  );
}
