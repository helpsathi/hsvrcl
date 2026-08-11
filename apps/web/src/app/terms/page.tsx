"use client";

import Link from "next/link";
import { 
  FileText, 
  ShieldCheck, 
  Scales, 
  CreditCard, 
  Warning, 
  UserCheck, 
  LockKey, 
  Gavel,
  ArrowRight
} from "@phosphor-icons/react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function TermsOfServicePage() {
  const lastUpdated = "August 2, 2026";

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      icon: Scales,
      content: `By creating an account, accessing, or utilizing the HelpSathi platform (accessible via web, mobile, or APIs), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, you must immediately discontinue use of the platform.`
    },
    {
      id: "eligibility",
      title: "2. Eligibility & Account Responsibilities",
      icon: UserCheck,
      content: `You must be at least 13 years of age (or the legal age of digital consent in your jurisdiction) to use HelpSathi. If you are under 18, you represent that you have received permission from your parent or legal guardian.
      
      You are strictly responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify HelpSathi immediately of any unauthorized access or breach of security.`
    },
    {
      id: "mentorship",
      title: "3. Mentorship & Consultation Nature",
      icon: ShieldCheck,
      content: `HelpSathi operates as an independent matching and communication technology platform connecting students ("Mentees") with experienced professionals and senior peers ("Mentors").
      
      • Mentors act as independent contractors, not employees, partners, or agents of HelpSathi.
      • Mentorship guidance, mock interview reviews, resume feedback, and advice provided during sessions represent the subjective opinions of the individual mentor and do not guarantee academic admissions, employment offers, or examination scores.
      • Mentors and students must conduct all consultations respectfully within the platform's chat or video calling infrastructure.`
    },
    {
      id: "payments",
      title: "4. Wallet, Billing, & Financial Transactions",
      icon: CreditCard,
      content: `All monetary transactions on HelpSathi are processed via authorized payment gateways (e.g., Razorpay) in Indian Rupees (INR) or supported regional currencies.
      
      • **Per-Minute Billing:** 1-on-1 text consultations are billed dynamically per minute based on the mentor's advertised rate. Funds are deducted directly from the student's prepaid wallet balance.
      • **Scheduled Calls:** Scheduled video consultations are booked in advance with an estimated fee escrowed at the time of booking.
      • **Monthly Mentorship Passes:** Subscriptions provide recurring monthly access to designated mentors. Subscriptions renew automatically every 30 days unless cancelled prior to the renewal date.
      • **Taxes & Platform Fees:** All listed prices are inclusive of applicable GST/taxes unless otherwise indicated.`
    },
    {
      id: "refunds",
      title: "5. Refunds & Dispute Resolution",
      icon: Warning,
      content: `HelpSathi is committed to fairness in all consultations. If a session is interrupted due to technical failure, mentor absence, or unverified conduct, students may submit a refund request within 48 hours. Please review our comprehensive [Refund Policy](/refund) for eligibility criteria, processing timelines, and credit reversions.`
    },
    {
      id: "conduct",
      title: "6. Prohibited Activities & Code of Conduct",
      icon: LockKey,
      content: `Users agree NOT to:
      
      1. Engage in harassment, hate speech, defamation, vulgarity, or discrimination of any kind.
      2. Solicit, share, or demand off-platform payments, direct banking details, or bypass platform escrow systems.
      3. Share pirated materials, academic test leaks, copyrighted question banks, or malicious code.
      4. Impersonate another individual, forge educational/work credentials, or misrepresent mentor qualifications.
      5. Scrape, crawl, reverse-engineer, or attempt denial-of-service attacks against platform servers.
      
      Violation of these rules will result in immediate permanent account termination and potential civil or criminal liability.`
    },
    {
      id: "ip",
      title: "7. Intellectual Property Rights",
      icon: FileText,
      content: `All trademarks, logos, system UI, design tokens, software code, and educational frameworks on HelpSathi are the exclusive intellectual property of HelpSathi. Users retain ownership of their personal resumes, code snippets, and review submissions, but grant HelpSathi a worldwide, royalty-free license to transmit and host such content for service delivery.`
    },
    {
      id: "governing-law",
      title: "8. Limitation of Liability & Governing Law",
      icon: Gavel,
      content: `To the maximum extent permitted by applicable law, HelpSathi shall not be liable for any indirect, incidental, punitive, or consequential damages arising from the use of mentorship advice.
      
      These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the competent courts located in New Delhi, India.`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <PublicNav />

      {/* Hero Header */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-50 dark:from-blue-950/20 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
            <Scales weight="fill" /> Legal & Platform Governance
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Please read these terms carefully before accessing or using the HelpSathi platform.
          </p>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
            Last Updated: {lastUpdated} • Effective Date: July 1, 2026
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="flex-1 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Quick Table of Contents Card */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Table of Contents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
              {sections.map((sec) => (
                <a 
                  key={sec.id} 
                  href={`#${sec.id}`}
                  className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <sec.icon weight="fill" className="text-blue-500 shrink-0" />
                  <span className="truncate">{sec.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Detailed Legal Sections */}
          <div className="space-y-6">
            {sections.map((sec) => (
              <div 
                key={sec.id} 
                id={sec.id}
                className="scroll-mt-28 p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold shrink-0">
                    <sec.icon weight="fill" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {sec.title}
                  </h3>
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                  {sec.content}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support Note */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-lg font-black tracking-tight">Have questions regarding our terms?</h4>
              <p className="text-xs text-blue-100 font-medium">Our legal and support compliance team is here to assist you anytime.</p>
            </div>
            <Link 
              href="/contact"
              className="px-6 py-3 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-blue-50 transition shadow-md whitespace-nowrap flex items-center gap-1.5"
            >
              Contact Legal Desk <ArrowRight weight="bold" />
            </Link>
          </div>

        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
