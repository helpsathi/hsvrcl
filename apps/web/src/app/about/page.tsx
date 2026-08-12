import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { 
  Sparkle, 
  ChalkboardTeacher, 
  Clock, 
  ShieldCheck, 
  UsersThree, 
  CheckCircle, 
  ArrowRight,
  GraduationCap,
  Target,
  Handshake
} from "@phosphor-icons/react/dist/ssr";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | HelpSathi Mentorship",
  description: "Learn about HelpSathi's mission to make personalized 1-on-1 mentorship accessible and impactful. Meet our verified expert mentors.",
  openGraph: {
    title: "About Us | HelpSathi",
    description: "Learn about HelpSathi's mission to make personalized 1-on-1 mentorship accessible.",
    url: "https://helpsathi.com/about",
  }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <PublicNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
          <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkle weight="fill" className="text-sm" /> Our Mission & Story
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
              Democratizing Mentorship for <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Every Student in India
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              We believe high-quality mentorship shouldn&apos;t be a privilege reserved for a few. Help Sathi connects ambitious learners directly with verified rankers, industry leaders, and academic achievers for guidance that turns aspirations into reality.
            </p>
          </div>
        </section>



        {/* How It Works */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Simple & Transparent</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">How Help Sathi Works</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Get the exact guidance you need without locking into restrictive long-term fees or rigid agency packages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap weight="fill" />
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Step 01</div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Discover Top Mentors</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Filter verified mentors across UPSC, JEE, NEET, Software Engineering, Product, and Finance by category, rating, experience, and pricing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold mb-6 group-hover:scale-110 transition-transform">
                <Clock weight="fill" />
              </div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Step 02</div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Choose Your Model</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Recharge your wallet for instant pay-per-minute chats (with first 3 chats free), or subscribe monthly for continuous mentorship and broadcasts.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl font-bold mb-6 group-hover:scale-110 transition-transform">
                <Target weight="fill" />
              </div>
              <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Step 03</div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Achieve Your Goals</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Receive personalized preparation roadmaps, resume critiques, mock interviews, and strategic mindset coaching directly from experts.
              </p>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Core Principles</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Why Students & Mentors Trust Us</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-3">
                <ShieldCheck weight="fill" className="text-3xl text-emerald-500" />
                <h5 className="font-bold text-base text-slate-900 dark:text-white">Thoroughly Vetted</h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Every mentor profile is manually audited and approved by our moderation team before they can take sessions.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-3">
                <Clock weight="fill" className="text-3xl text-blue-500" />
                <h5 className="font-bold text-base text-slate-900 dark:text-white">Fair Pay-Per-Minute</h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Chat timers only start when the mentor sends their first response. No wasted money on inactive sessions.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-3">
                <Handshake weight="fill" className="text-3xl text-indigo-500" />
                <h5 className="font-bold text-base text-slate-900 dark:text-white">Direct Access</h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  No middlemen or sales reps. Communicate 1-on-1 with genuine achievers who understand your exact hurdles.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-3">
                <UsersThree weight="fill" className="text-3xl text-purple-500" />
                <h5 className="font-bold text-base text-slate-900 dark:text-white">Engaged Community</h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Participate in open discussions, join group masterclasses, and exchange study notes with peers across the country.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl shadow-blue-500/20">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Accelerate Your Career & Studies?
            </h3>
            <p className="max-w-xl mx-auto text-blue-100 text-sm sm:text-base leading-relaxed">
              Join thousands of students who are achieving their goals with personalized mentorship. Start with 3 free trial chats today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/mentors"
                className="px-8 py-3.5 rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50 shadow-lg transition-all inline-flex items-center gap-2"
              >
                Browse Mentors <ArrowRight weight="bold" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-xl font-bold bg-blue-700/60 hover:bg-blue-700 text-white border border-white/20 transition-all"
              >
                Become a Mentor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
