"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Warning, ArrowCounterClockwise, House } from "@phosphor-icons/react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service if configured
    console.error("Application Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12 bg-transparent text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-md w-full text-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 shadow-2xl shadow-rose-500/10">
        <div className="w-20 h-20 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-500/20">
          <Warning weight="duotone" className="text-4xl animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-extrabold tracking-tight mb-2">
          Something went wrong!
        </h2>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          An unexpected error occurred while rendering this page. Our engineers have been alerted. Please try again or return home.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
          >
            <ArrowCounterClockwise weight="bold" className="text-lg" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-3 px-6 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-2xl border border-slate-300/50 dark:border-slate-700 transition-all"
          >
            <House weight="bold" className="text-lg" />
            Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
