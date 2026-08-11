"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  LockKey, 
  Eye, 
  Database, 
  Cookie, 
  UserCircleGear, 
  ShareNetwork, 
  EnvelopeSimple,
  ArrowRight
} from "@phosphor-icons/react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 2, 2026";

  const sections = [
    {
      id: "information-collected",
      title: "1. Information We Collect",
      icon: Database,
      content: `HelpSathi collects information to deliver tailored mentorship experiences and protect platform integrity:
      
      • **Account & Profile Data:** Full name, email address, password hash, phone number, academic background, target colleges, fields of interest, and avatar picture.
      • **Mentor Verification Data:** Educational credentials, degree certificates, employer history, LinkedIn profile links, and government ID for KYC compliance.
      • **Consultation & Messaging Data:** Timestamps, session duration, encrypted chat transcripts, consultation notes, and audio/video connection metadata.
      • **Billing & Payment Records:** Transaction amounts, Razorpay order/payment identifiers, wallet balance ledgers, and coupon usage records (we do not store raw credit/debit card numbers or CVVs on our servers).
      • **Technical & Device Telemetry:** IP address, browser type, operating system, device identifiers, and error diagnostics.`
    },
    {
      id: "usage",
      title: "2. How We Use Your Information",
      icon: Eye,
      content: `We utilize personal data strictly for legitimate operational purposes:
      
      • Facilitating real-time socket chats, video meeting links, and calendar invitations between students and mentors.
      • Processing secure wallet recharges, escrow disbursements, mentor payout settlements, and refunds.
      • Personalizing mentor recommendations, search filters, and subject discovery.
      • Preventing fraudulent transactions, spam posts, unauthorized account takeovers, and harassment.
      • Communicating critical service updates, booking confirmations, and push/in-app notifications.`
    },
    {
      id: "sharing",
      title: "3. Data Sharing & Third-Party Processors",
      icon: ShareNetwork,
      content: `We do not sell, rent, or monetize your personal data to advertisers. Information is shared strictly with authorized service providers under confidentiality agreements:
      
      • **Payment Gateways:** Razorpay for secure payment authorization, subscription billing, and fraud mitigation.
      • **Communication & Infrastructure Providers:** Google Cloud / Google Meet API for calendar scheduling and video room generation; ImageKit for optimized CDN asset delivery.
      • **Legal & Regulatory Authorities:** When compelled by lawful subpoena, court order, or governmental compliance under the Information Technology Act (India).`
    },
    {
      id: "cookies",
      title: "4. Cookies & Tracking Technologies",
      icon: Cookie,
      content: `HelpSathi uses essential session cookies and local storage tokens to maintain user authentication, preserve theme preferences (Dark / Light mode), and safeguard against cross-site request forgery (CSRF). You can manage cookie permissions through your browser settings, though disabling essential cookies may impact platform functionality.`
    },
    {
      id: "security",
      title: "5. Data Security & Storage",
      icon: LockKey,
      content: `We enforce industry-standard security measures to safeguard personal data:
      
      • All communication is encrypted via TLS 1.3 in transit and stored in protected databases with role-based access control.
      • Password hashes are generated using cryptographic Argon2/Bcrypt salts.
      • Regular vulnerability audits, rate-limiting defenses, and strict input sanitization protect against SQL injection and cross-site scripting.`
    },
    {
      id: "rights",
      title: "6. User Rights & Data Portability",
      icon: UserCircleGear,
      content: `In accordance with applicable data protection legislation (including India's DPDP Act and GDPR):
      
      • **Right of Access & Rectification:** You may view and edit your profile information at any time via your account settings.
      • **Right to Erasure (Account Deletion):** You may request complete account deletion and data anonymization by contacting our grievance desk.
      • **Notification Preferences:** You can customize or disable push and in-app alerts directly from your user dashboard.`
    },
    {
      id: "grievance",
      title: "7. Grievance Officer & Contact",
      icon: EnvelopeSimple,
      content: `In accordance with the Information Technology Act 2000 and rules made thereunder, the name and contact details of our Grievance Officer are provided below:
      
      **Grievance Officer:** HelpSathi Data Protection & Compliance Cell  
      **Email:** privacy@helpsathi.com / grievance@helpsathi.com  
      **Location:** New Delhi, India  
      
      We commit to addressing all privacy inquiries and data requests within 30 business days.`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <PublicNav />

      {/* Hero Header */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-emerald-50/50 via-slate-50 to-slate-50 dark:from-emerald-950/20 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck weight="fill" /> Data Privacy & Trust
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Learn how we collect, protect, and handle your data transparently across HelpSathi.
          </p>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
            Last Updated: {lastUpdated} • Compliance: DPDP Act 2023 & IT Act 2000
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
                  className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  <sec.icon weight="fill" className="text-emerald-500 shrink-0" />
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
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold shrink-0">
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
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-lg font-black tracking-tight">Need to request data export or account closure?</h4>
              <p className="text-xs text-emerald-100 font-medium">Reach out directly to our designated data protection team.</p>
            </div>
            <Link 
              href="/contact"
              className="px-6 py-3 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-emerald-50 transition shadow-md whitespace-nowrap flex items-center gap-1.5"
            >
              Contact Grievance Desk <ArrowRight weight="bold" />
            </Link>
          </div>

        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
