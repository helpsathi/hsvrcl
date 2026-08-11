import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-slate-200/80 dark:bg-slate-800/80 rounded-md transition-colors", className)}
      {...props}
    />
  );
}

export function MentorCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-800/80 flex flex-col relative overflow-hidden h-[216px] transition-colors">
      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-20 pt-2 gap-1.5">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <Skeleton className="h-2.5 w-14 rounded-full mt-1" />
          <Skeleton className="h-2 w-12 rounded-full" />
        </div>

        <div className="flex-1 flex flex-col min-w-0 pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded-full" />
          </div>
          <Skeleton className="h-3 w-4/5 rounded-full" />
          <Skeleton className="h-2.5 w-3/5 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-lg mt-1.5" />
        </div>
      </div>

      <div className="flex gap-2.5 mt-auto pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
        <Skeleton className="flex-1 h-9 rounded-xl" />
        <Skeleton className="flex-1 h-9 rounded-xl" />
      </div>
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-3 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="w-full min-h-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-12 bg-transparent transition-colors animate-in fade-in">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-8 sm:p-10 flex flex-col items-center bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800">
          <Skeleton className="w-28 h-28 rounded-full mb-4" />
          <Skeleton className="h-7 w-56 rounded-xl mb-2" />
          <Skeleton className="h-4 w-40 rounded-lg mb-4" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="p-6 sm:p-8 space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-52 rounded-lg" />
                  <Skeleton className="h-3.5 w-72 rounded-md" />
                </div>
              </div>
            </div>
          ))}
          <Skeleton className="h-14 w-full rounded-2xl mt-8" />
        </div>
      </div>
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className="w-full min-h-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-12 animate-in fade-in transition-colors">
      <div className="mb-8">
        <Skeleton className="w-full h-48 rounded-3xl" />
      </div>
      <div className="mb-10">
        <Skeleton className="h-6 w-48 rounded-lg mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-2xl mb-3" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-44 rounded-lg mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3.5 flex-1">
                <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommunityPostSkeleton() {
  return (
    <div className="space-y-4 pb-10">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex gap-4 sm:gap-5 transition-colors">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
            </div>
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex gap-4 mt-3">
              <Skeleton className="h-4 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScheduledCallsSkeleton() {
  return (
    <div className="w-full min-h-full bg-transparent py-6 px-4 sm:px-6 lg:px-8 pb-28 animate-in fade-in transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-8 w-64 sm:w-80 rounded-2xl mb-2" />
          <Skeleton className="h-4 w-80 sm:w-96 rounded-lg" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col md:flex-row gap-5 justify-between items-start md:items-center transition-colors">
              <div className="flex items-center gap-4 w-full md:w-auto min-w-0">
                <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                <div className="space-y-2.5 flex-1 min-w-0">
                  <Skeleton className="h-5 w-48 sm:w-64 rounded-xl" />
                  <Skeleton className="h-3.5 w-60 sm:w-72 rounded-lg" />
                  <Skeleton className="h-3 w-36 sm:w-48 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0 w-full md:w-auto justify-end">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MentorDashboardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 space-y-8 animate-in fade-in transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 sm:w-80 rounded-2xl mb-2" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-48 rounded-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="w-10 h-10 rounded-2xl" />
            </div>
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <Skeleton className="h-80 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    </div>
  );
}

export function MyMentorsSkeleton() {
  return (
    <div className="w-full min-h-full bg-transparent py-8 px-4 sm:px-6 lg:px-8 pb-28 animate-in fade-in transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-8 w-64 rounded-2xl mb-2" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 rounded-xl" />
                  <Skeleton className="h-3.5 w-60 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MentorProfilePageSkeleton() {
  return (
    <div className="w-full min-h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36 lg:pb-16 animate-in fade-in transition-colors">
      <Skeleton className="w-full h-32 sm:h-44 rounded-3xl mb-6" />
      <div className="grid lg:grid-cols-[2fr_1fr] gap-8 items-start">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-24 h-24 rounded-3xl shrink-0 -mt-12 border-4 border-slate-900" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-48 rounded-xl" />
              <Skeleton className="h-4 w-36 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-32 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-4/5 rounded-lg" />
          </div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-5">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl mt-4" />
        </div>
      </div>
    </div>
  );
}

export function BookCallSkeleton() {
  return (
    <div className="w-full min-h-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 animate-in fade-in transition-colors">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-xl" />
            <Skeleton className="h-4 w-36 rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-2xl pt-4" />
      </div>
    </div>
  );
}

export function DirectoryLoadingSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-3 sm:px-6 pb-20 space-y-6 animate-in fade-in transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-60 rounded-2xl mb-2" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2 overflow-hidden py-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <MentorCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ChatRoomSkeleton({ name, avatar }: { name?: string | null, avatar?: string | null } = {}) {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 animate-in fade-in relative overflow-hidden">
      {/* Premium Glass Header */}
      <div className="px-4 md:px-8 py-3.5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full shrink-0 object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-400/20 to-indigo-500/20 border border-slate-200 dark:border-slate-800 animate-pulse shrink-0" />
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping"></span>
          </div>

          <div className="space-y-1">
            {name ? (
              <h3 className="h-5 flex items-center text-slate-900 dark:text-white font-extrabold text-sm">{name}</h3>
            ) : (
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            )}
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>Preparing encrypted room...</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-20 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
        </div>
      </div>

      {/* Messages Thread Skeleton with Gradient Shimmer */}
      <div className="flex-1 p-4 md:p-8 space-y-5 overflow-hidden flex flex-col justify-end pb-28">
        <div className="flex items-center justify-center my-4">
          <div className="px-4 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-400 animate-pulse">
            Loading consultation history...
          </div>
        </div>

        {/* Incoming Bubble */}
        <div className="flex gap-3 w-full max-w-sm sm:max-w-md">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 mt-auto animate-pulse" />
          <div className="flex-1 space-y-2 p-4 rounded-2xl rounded-bl-xs bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="h-3.5 w-4/5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-md animate-pulse" />
            <div className="h-3.5 w-3/5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Outgoing Bubble */}
        <div className="flex gap-3 w-full max-w-xs sm:max-w-sm ml-auto justify-end">
          <div className="flex-1 space-y-2 p-4 rounded-2xl rounded-br-xs bg-brand-600/20 border border-brand-500/20 shadow-sm">
            <div className="h-3.5 w-full bg-brand-500/30 rounded-md animate-pulse" />
            <div className="h-3.5 w-2/3 bg-brand-500/30 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Incoming Bubble 2 */}
        <div className="flex gap-3 w-full max-w-md sm:max-w-lg">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 mt-auto animate-pulse" />
          <div className="flex-1 space-y-2 p-4 rounded-2xl rounded-bl-xs bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="h-3.5 w-11/12 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-md animate-pulse" />
            <div className="h-3.5 w-3/4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Input Composer Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:px-8 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl flex items-center gap-3 shadow-lg">
        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 animate-pulse" />
        <div className="h-12 flex-1 rounded-[28px] bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-brand-600/30 shrink-0 animate-pulse" />
      </div>
    </div>
  );
}
