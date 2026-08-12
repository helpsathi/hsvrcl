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
  Clock
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold">
                <EnvelopeSimple weight="fill" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Email Support</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Our dedicated team replies within 24 hours.</p>
                <a
                  href="mailto:support@helpsathi.com"
                  className="mt-3 inline-block font-semibold text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  support@helpsathi.com
                </a>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold">
                <Clock weight="fill" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Operating Hours</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Standard support availability:</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
                  Monday – Saturday <br />
                  <span className="text-xs font-normal text-slate-500">9:00 AM – 8:00 PM IST</span>
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/10 space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Question weight="bold" /> Quick FAQs
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                Looking for answers on wallet recharges, free trial duration, or session refunds? Check our comprehensive guides.
              </p>
              <div className="pt-2">
                <a
                  href="/refund"
                  className="inline-flex items-center gap-1 text-xs font-bold bg-white text-blue-700 px-3.5 py-2 rounded-xl hover:bg-blue-50 transition"
                >
                  Refund & Cancellation Policy <ArrowSquareOut weight="bold" />
                </a>
              </div>
            </div>
          </div>

          {/* Form Embed Column */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Official Inquiry & Feedback Form</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your responses are directly received by the Help Sathi administrative support desk.
                  </p>
                </div>
                {formUrl && (
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
                  >
                    Open Full Form <ArrowSquareOut weight="bold" />
                  </a>
                )}
              </div>

              {loading ? (
                <div className="py-24 text-center text-slate-400 text-sm animate-pulse">
                  Loading contact form...
                </div>
              ) : formUrl ? (
                <div className="w-full min-h-[640px] rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 relative">
                  <iframe
                    src={formUrl}
                    width="100%"
                    height="720"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    className="w-full rounded-2xl bg-white"
                    title="HelpSathi Contact Form"
                  >
                    Loading form...
                  </iframe>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <ChatCircleDots className="mx-auto text-4xl text-slate-400 mb-2" />
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
      </main>

      <PublicFooter />
    </div>
  );
}
