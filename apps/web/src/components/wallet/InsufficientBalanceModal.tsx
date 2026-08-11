"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Wallet, Sparkle, X, ArrowRight, ShieldCheck, Crown } from "@phosphor-icons/react";

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  minRequired?: number;
  mentorName?: string;
  mentorAvatar?: string;
  mentorMonthlyPrice?: number;
  onSubscribeMonthly?: () => void;
}

export default function InsufficientBalanceModal({
  isOpen,
  onClose,
  minRequired = 15,
  mentorName = "Mentor",
  mentorAvatar,
  mentorMonthlyPrice,
  onSubscribeMonthly,
}: InsufficientBalanceModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleRecharge = () => {
    onClose();
    router.push("/wallet");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="h-28 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
              <Wallet weight="duotone" className="text-2xl" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                Wallet Balance Alert
              </span>
              <h3 className="text-lg font-black text-white drop-shadow-sm mt-0.5">
                Insufficient Balance
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X weight="bold" className="text-base" />
          </button>

          {/* Background decorative shape */}
          <Sparkle weight="fill" className="absolute -right-4 -bottom-4 text-8xl text-white/10" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
            {mentorAvatar ? (
              <img
                src={mentorAvatar}
                alt={mentorName}
                className="w-11 h-11 rounded-xl object-cover border border-amber-300 dark:border-amber-800 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 font-bold flex items-center justify-center shrink-0 text-sm">
                {mentorName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Starting consultation with
              </p>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {mentorName}
              </h4>
            </div>
          </div>

          <div className="text-center space-y-1.5 px-2">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              You need at least <span className="font-extrabold text-amber-600 dark:text-amber-400">₹{minRequired}</span> in your wallet to start this pay-per-minute chat.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Top up your balance instantly or choose a monthly pass for continuous guidance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleRecharge}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Wallet weight="bold" />
              Recharge Wallet Now
              <ArrowRight weight="bold" className="text-xs" />
            </button>

            {onSubscribeMonthly && mentorMonthlyPrice && mentorMonthlyPrice > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onSubscribeMonthly();
                }}
                className="w-full py-3 px-4 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <Crown weight="fill" className="text-amber-500" />
                Subscribe Monthly (₹{mentorMonthlyPrice}/mo)
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Secure Trust Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <ShieldCheck weight="fill" className="text-emerald-500 text-sm" />
            <span>100% Safe & Secure Pay-per-Minute Metering</span>
          </div>
        </div>
      </div>
    </div>
  );
}
