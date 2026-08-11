"use client";

import React from "react";
import Link from "next/link";
import { Wallet as WalletIcon, ShieldCheck, PlusCircle } from "@phosphor-icons/react";

interface WalletBalanceCardProps {
  balance: number;
  /**
   * "full" is used on the main Wallet page (wide format with trust badges)
   * "compact" is used on the Payment History page (taller, with 'Add Funds' CTA)
   */
  variant?: "full" | "compact";
  className?: string;
}

export function WalletBalanceCard({ balance, variant = "full", className = "" }: WalletBalanceCardProps) {
  if (variant === "compact") {
    return (
      <div className={`bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl border border-indigo-500/20 flex flex-col justify-between space-y-4 ${className}`}>
        {/* Background ambient light */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <WalletIcon weight="fill" className="absolute -right-4 -bottom-4 text-6xl text-white/5 -rotate-12 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Wallet Balance</span>
            <WalletIcon weight="fill" className="text-2xl text-indigo-300" />
          </div>
          <div className="mb-6">
            <div className="text-4xl font-black mb-1">₹{balance.toFixed(2)}</div>
            <span className="text-[11px] text-slate-400 font-medium">Available for 1-on-1 chats & calls</span>
          </div>
          <Link
            href="/wallet"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-slate-900 hover:text-indigo-600 font-extrabold text-xs shadow-sm hover:bg-slate-50 transition border border-transparent hover:border-indigo-100"
          >
            <PlusCircle weight="bold" className="text-lg" /> Add Funds to Wallet
          </Link>
        </div>
      </div>
    );
  }

  // Default "full" variant for the Wallet page
  return (
    <div className={`bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-indigo-500/20 ${className}`}>
      <div className="absolute -right-10 -top-10 w-52 h-52 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="relative z-10">
        <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-400 font-extrabold uppercase tracking-wider mb-2">Available Wallet Balance</p>
        <h2 className="text-4xl sm:text-5xl font-black mb-6 flex items-baseline gap-1 tracking-tight">
          ₹ {balance.toFixed(2)}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-success/20 text-success px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-success/30 flex items-center gap-1.5">
            <ShieldCheck weight="fill" className="text-base" /> 100% Secure Checkout
          </span>
          <span className="bg-white/10 text-white/80 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-white/10">
            Powered by Razorpay
          </span>
        </div>
      </div>
      <WalletIcon weight="fill" className="absolute right-6 bottom-6 text-8xl text-white/5 -rotate-12 pointer-events-none" />
    </div>
  );
}
