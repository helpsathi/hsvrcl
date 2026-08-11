"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { 
  Sparkle, 
  Check, 
  ChatCircleDots, 
  CalendarCheck, 
  Wallet, 
  Gift, 
  ArrowRight,
  ShieldCheck,
  CaretDown,
  VideoCamera,
  UsersThree,
  Coins,
  ClockCounterClockwise,
  Handshake
} from "@phosphor-icons/react";

interface PricingConfig {
  freeTrialEnabled: boolean;
  freeTrialMaxChats: number;
  freeTrialMaxMinutes: number;
  minWalletRecharge: number;
}

export default function PricingPage() {
  const [pricing, setPricing] = useState<PricingConfig>({
    freeTrialEnabled: true,
    freeTrialMaxChats: 3,
    freeTrialMaxMinutes: 5,
    minWalletRecharge: 100,
  });

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch("/api/pricing");
        if (res.ok) {
          const data = await res.json();
          if (data.pricing) {
            setPricing(data.pricing);
          }
        }
      } catch (e) {
        console.error("Failed to load dynamic pricing:", e);
      }
    }
    loadPricing();
  }, []);

  const faqs = [
    {
      q: "Why does HelpSathi not have standard pricing tiers?",
      a: "Because we believe in a free market. Every mentor brings different value based on their rank, experience, and time. By letting mentors set their own rates, we attract the best talent, and you pay a fair market price for their specific expertise.",
    },
    {
      q: "Is there any platform membership fee to join HelpSathi?",
      a: "No. HelpSathi has 0% platform access fees for students. You can sign up, search verified mentors, browse profiles, read reviews, and explore study resources completely free. You only pay exactly what the mentor charges when you engage with them.",
    },
    {
      q: "How does HelpSathi make money if there are no student fees?",
      a: "We charge the mentors a small commission on their earnings to cover our server costs, payment gateway fees, and platform maintenance. As a student, the price you see on the mentor's profile is exactly what you pay—no extra markup.",
    },
    {
      q: "How does the Free Trial Chat work?",
      a: `New students receive their first ${pricing.freeTrialMaxChats} chat sessions free (up to ${pricing.freeTrialMaxMinutes} minutes each) with mentors who have enabled free trials. No wallet balance is deducted during the trial window.`,
    },
    {
      q: "When does the pay-per-minute chat timer start?",
      a: "The billing timer begins ONLY after your mentor sends their first reply. You are never billed while waiting for a mentor to accept or connect to your chat session.",
    },
    {
      q: "How does the HelpSathi Wallet work and what if a session is cancelled?",
      a: `You can top up your wallet with as little as ₹${pricing.minWalletRecharge}. If a mentor cancels a scheduled call or fails to join, 100% of your payment is automatically refunded back to your wallet instantly.`,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <PublicNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/90 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-wider shadow-sm">
            <ShieldCheck weight="fill" className="text-sm" /> 100% Student-First Mentorship
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            HelpSathi has <span className="text-blue-600 dark:text-blue-400">NO Fixed Pricing.</span>
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            We don't sell overpriced subscription bundles. On HelpSathi, verified mentors set their own rates. You choose your mentor, pay only for what you use, and we take absolutely zero hidden fees from you.
          </p>

          {/* Value Badges Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <ShieldCheck weight="fill" className="text-emerald-500 text-lg" />
              <span>₹0 Platform Access Fee</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <Wallet weight="fill" className="text-amber-500 text-lg" />
              <span>Pay As You Go</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <Handshake weight="fill" className="text-blue-500 text-lg" />
              <span>Mentors Set Their Rates</span>
            </div>
          </div>
        </section>

        {/* Free Trial Banner */}
        {pricing.freeTrialEnabled && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5 text-left">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0">
                  <Gift weight="fill" />
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/25 text-xs font-extrabold uppercase tracking-wide mb-1">
                    New Student Welcome
                  </div>
                  <h3 className="font-extrabold text-xl sm:text-2xl">
                    First {pricing.freeTrialMaxChats} Chat Consultations Are 100% Free!
                  </h3>
                  <p className="text-sm text-white/90 mt-1 max-w-xl">
                    Experience real 1-on-1 mentorship with up to {pricing.freeTrialMaxMinutes} minutes per trial chat. Zero balance deduction.
                  </p>
                </div>
              </div>
              <Link
                href="/mentors"
                className="px-6 py-3.5 rounded-2xl bg-white text-orange-600 font-extrabold text-sm shadow-md hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all shrink-0 whitespace-nowrap"
              >
                Claim Free Chats
              </Link>
            </div>
          </section>
        )}

        {/* 4 Mentorship Service Modes Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Flexible Engagement Modes
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              How You Pay Your Mentor
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Mentors configure their own individual rates for each service mode. You only pay for what you use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* Mode 1: Instant Chat */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 relative">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl">
                  <ChatCircleDots weight="fill" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Pay-Per-Minute</span>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">1:1 Instant Chat</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Ask doubts or get quick advice on test strategies in real time.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-semibold italic">Mentors set their own per-minute rate.</div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-emerald-500 shrink-0 text-sm mt-0.5" />
                    <span>Timer starts <strong>after first mentor reply</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-emerald-500 shrink-0 text-sm mt-0.5" />
                    <span>Per-second wallet deduction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-emerald-500 shrink-0 text-sm mt-0.5" />
                    <span>Instant session end anytime</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/mentors"
                  className="w-full py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-center block text-xs transition"
                >
                  Start Instant Chat
                </Link>
              </div>
            </div>

            {/* Mode 2: 1:1 Scheduled Video Call */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 relative">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl">
                  <VideoCamera weight="fill" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Scheduled Sessions</span>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">1-on-1 Video Call</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Book focused 30-min or 60-min deep dive sessions for timetable reviews or mock interviews.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-semibold italic">Mentors set their own slot rate.</div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-emerald-500 shrink-0 text-sm mt-0.5" />
                    <span>Choose convenient calendar slots</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-emerald-500 shrink-0 text-sm mt-0.5" />
                    <span>HD 1:1 Video/Audio screen share</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-emerald-500 shrink-0 text-sm mt-0.5" />
                    <span>100% refund if mentor misses</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/mentors"
                  className="w-full py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-center block text-xs transition"
                >
                  Book a 1:1 Call
                </Link>
              </div>
            </div>

            {/* Mode 3: Monthly Dedicated Mentorship */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-500 p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-blue-500/10 relative">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm">
                Most Comprehensive
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl">
                  <CalendarCheck weight="fill" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Continuous Guidance</span>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">Monthly Mentorship</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    30-day continuous mentorship with personal schedule tracking and priority chats.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-semibold italic">Mentors set their own monthly fee.</div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-blue-600 shrink-0 text-sm mt-0.5" />
                    <span>30-day continuous direct mentor link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-blue-600 shrink-0 text-sm mt-0.5" />
                    <span>Personalized study schedule & milestones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-blue-600 shrink-0 text-sm mt-0.5" />
                    <span>Cancel or disable autopay anytime</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/mentors"
                  className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-center block text-xs transition shadow-md shadow-blue-500/20"
                >
                  Find a Dedicated Mentor
                </Link>
              </div>
            </div>

            {/* Mode 4: Group Masterclasses */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 relative">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl">
                  <UsersThree weight="fill" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Interactive Masterclasses</span>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">Group Sessions</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Live strategy workshops and Q&A webinars conducted with multiple aspirants.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-semibold italic">Mentors set ticket prices (often free).</div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-emerald-500 shrink-0 text-sm mt-0.5" />
                    <span>Strategy masterclasses by top mentors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-emerald-500 shrink-0 text-sm mt-0.5" />
                    <span>Interactive live Q&A rounds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check weight="bold" className="text-emerald-500 shrink-0 text-sm mt-0.5" />
                    <span>Community peer learning</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/group-meetings"
                  className="w-full py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-center block text-xs transition"
                >
                  View Upcoming Sessions
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Commission Model Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-3xl bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 p-8 sm:p-12 shadow-inner text-center">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4">
              Wait, so how does HelpSathi make money?
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-8">
              Transparency is our core value. We do not charge students any platform fees or markups. Instead, we take a standard commission from the mentor's earnings to maintain the platform, cover secure payment processing, and provide 24/7 support. 
              <br /><br />
              <strong className="text-slate-900 dark:text-slate-200">The rate you see on a mentor's profile is exactly the rate you pay.</strong>
            </p>
          </div>
        </section>

        {/* HelpSathi Wallet & Fair Billing Shield */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-10 shadow-xl border border-slate-800">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                <ShieldCheck weight="fill" /> Student Protection Policy
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">HelpSathi Wallet & Billing Guarantee</h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Safe, instant, and frictionless payments designed with complete student safety in mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">
                  <Coins weight="fill" />
                </div>
                <h4 className="font-bold text-base">Pay-As-You-Go Wallet</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Recharge your account wallet once with any amount (min ₹{pricing.minWalletRecharge}) using UPI or Cards. Use it seamlessly across multiple mentors.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                  <ClockCounterClockwise weight="bold" />
                </div>
                <h4 className="font-bold text-base">Fair Billing Timer</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  For pay-per-minute chats, billing is tracked down to the exact second and starts ONLY when your mentor responds. You never pay for waiting time.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl">
                  <ShieldCheck weight="fill" />
                </div>
                <h4 className="font-bold text-base">100% Escrow & Auto-Refund</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If a scheduled video session is cancelled or a mentor does not show up, 100% of your funds are credited back to your wallet instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Accordion */}
        <section className="py-16 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Got Questions?</h2>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
            </div>

            <div className="space-y-4 pt-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer transition-all"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{faq.q}</h4>
                    <CaretDown
                      weight="bold"
                      className={`text-slate-500 transition-transform ${openFaq === i ? "rotate-180 text-blue-600" : ""}`}
                    />
                  </div>
                  {openFaq === i && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="pt-10 text-center space-y-4">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Ready to connect with a top mentor?</h4>
              <Link
                href="/mentors"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>Find Your Mentor Now</span>
                <ArrowRight weight="bold" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
