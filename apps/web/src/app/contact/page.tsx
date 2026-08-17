"use client";

import { useEffect, useState } from "react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { 
  EnvelopeSimple, 
  ChatCircleDots, 
  Question, 
  ArrowSquareOut,
  Sparkle,
  Clock,
  Briefcase,
  Scales,
  ShieldCheck,
  Lifebuoy
} from "@phosphor-icons/react";

export default function ContactPage() {
  const [formUrl, setFormUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchContactConfig() {
      try {
        const res = await fetch("/api/contact-info");
        if (res.ok) {
          const data = await res.json();
          if (data.contactFormUrl) {
            setFormUrl(data.contactFormUrl);
          }
        }
      } catch (err) {
        console.error("Failed to load contact form url:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContactConfig();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <PublicNav />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkle weight="fill" className="text-sm" /> We&apos;re Here to Help
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Get in Touch with Help Sathi
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Have questions about mentorship, billing, platform features, or partnerships? Submit your inquiry through our official contact form below or reach out directly to our support team.
          </p>
        </div>

        {/* Top Section: Info & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Info Column */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-1 flex flex-col justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold">
                <Clock weight="fill" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Operating Hours</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Standard support desk availability:</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
                  Monday – Saturday <br />
                  <span className="text-xs font-normal text-slate-500">9:00 AM – 8:00 PM IST (Replies within 24h)</span>
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-blue-500/10 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Question weight="bold" /> Quick FAQs & Policies
                </h3>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Looking for answers on wallet recharges, free trial duration, or session refunds? Check our guides.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="/refund"
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-50 transition shadow-sm"
                >
                  Refund & Cancellation Policy <ArrowSquareOut weight="bold" />
                </a>
              </div>
            </div>
          </div>

          {/* Form Action Column */}
          <div className="lg:col-span-7">
            <div className="h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-8 sm:p-10 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  <ChatCircleDots weight="bold" className="text-sm" /> Official Support Form
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Official Inquiry & Feedback Form
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                  Please click below to submit your mentorship queries, feedback, or partnership requests. Your responses are directly received and prioritized by the Help Sathi administrative support desk.
                </p>
              </div>

              {loading ? (
                <div className="py-8 text-slate-400 text-sm animate-pulse">
                  Loading contact options...
                </div>
              ) : formUrl ? (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Open Google Form <ArrowSquareOut weight="bold" className="text-xl" />
                  </a>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    Opens securely in a new browser tab.
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Contact form is currently being updated.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Please email us directly at <a href="mailto:support@helpsathi.com" className="text-blue-600 underline">support@helpsathi.com</a>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Department Directory Section */}
        <section className="mt-16 sm:mt-20">
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkle weight="fill" className="text-sm" /> Department Directory
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Reach Our Dedicated Teams
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Get in touch directly with the specialized department relevant to your inquiry for faster resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* General Support */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold">
                  <Lifebuoy weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">General & Student Support</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Assistance with accounts, mentor booking, wallet credits, and general platform help.
                  </p>
                </div>
              </div>
              <a
                href="mailto:support@helpsathi.com"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800"
              >
                <EnvelopeSimple weight="bold" /> support@helpsathi.com
              </a>
            </div>

            {/* Business & Partnerships */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl font-bold">
                  <Briefcase weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Business & Partnerships</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Colleges, institutional partnerships, corporate collaborations, and mentor alliances.
                  </p>
                </div>
              </div>
              <a
                href="mailto:business@helpsathi.com"
                className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800"
              >
                <EnvelopeSimple weight="bold" /> business@helpsathi.com
              </a>
            </div>

            {/* Grievance Redressal */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl font-bold">
                  <ShieldCheck weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Grievance Redressal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Escalation of unresolved issues, trust & safety concerns, and dispute resolution.
                  </p>
                </div>
              </div>
              <a
                href="mailto:grievance@helpsathi.com"
                className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800"
              >
                <EnvelopeSimple weight="bold" /> grievance@helpsathi.com
              </a>
            </div>

            {/* Legal & Compliance */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold">
                  <Scales weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Legal & Compliance</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Terms of service, privacy regulations, intellectual property, and statutory inquiries.
                  </p>
                </div>
              </div>
              <a
                href="mailto:legal@helpsathi.com"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800"
              >
                <EnvelopeSimple weight="bold" /> legal@helpsathi.com
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
