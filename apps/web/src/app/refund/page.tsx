import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { 
  ShieldCheck, 
  Wallet, 
  CalendarCheck, 
  ChatCircleDots, 
  ClockCounterClockwise, 
  EnvelopeSimple 
} from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Refund & Cancellation Policy | Help Sathi",
  description: "Help Sathi's official refund and cancellation terms for wallet recharges, monthly subscriptions, and live chat sessions.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <PublicNav />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck weight="fill" className="text-sm" /> Official Platform Policy
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Last Updated: August 2, 2026 • Applies to all users and transactions on the Help Sathi platform.
          </p>
        </div>

        {/* Introduction */}
        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
          <p>
            At <strong>Help Sathi</strong>, our priority is providing transparent, equitable, and top-tier mentorship. We understand that circumstances change and technical glitches occasionally occur. This document explains how cancellations, disputes, and refunds are handled across our service offerings.
          </p>
        </div>

        {/* Policy Sections Grid */}
        <div className="space-y-8">
          {/* Section 1: Wallet Recharges */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                <Wallet weight="fill" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Wallet Recharge Refunds</h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5 leading-relaxed">
              <li>
                <strong>Unused Balance:</strong> You may request a full refund of your unused, unspent wallet balance to your original payment method within <strong>7 calendar days</strong> of the recharge date.
              </li>
              <li>
                <strong>Promotional / Bonus Balances:</strong> Any promotional credits, referral bonuses, or coupon top-ups are non-refundable and cannot be redeemed for cash.
              </li>
              <li>
                <strong>Deductions & Fees:</strong> Third-party payment gateway transaction charges (typically 2–3% incurred via Razorpay) may be deducted from non-dispute wallet refund amounts.
              </li>
            </ul>
          </div>

          {/* Section 2: Pay-Per-Minute Chats */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
                <ChatCircleDots weight="fill" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Live Chat Sessions & Disputes</h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5 leading-relaxed">
              <li>
                <strong>Fair-Start Billing:</strong> Chat timers start only when the mentor sends their first response. No charges accrue during waiting or connection phases.
              </li>
              <li>
                <strong>Technical Interruptions:</strong> If a chat session is terminated prematurely due to server outages, socket disconnects, or proven technical errors on Help Sathi&apos;s infrastructure, the deducted minutes for the affected duration will be promptly credited back to your wallet.
              </li>
              <li>
                <strong>Mentor Misconduct / Inadequate Guidance:</strong> If a mentor fails to engage or engages in inappropriate behavior, report the session within <strong>24 hours</strong>. Our moderation team reviews the chat transcripts and will issue a full wallet adjustment upon validation.
              </li>
            </ul>
          </div>

          {/* Section 3: Monthly Subscriptions */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                <CalendarCheck weight="fill" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Monthly Subscriptions</h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5 leading-relaxed">
              <li>
                <strong>Immediate Cancellation:</strong> You can cancel your monthly mentor subscription anytime from your Student Dashboard under &ldquo;My Mentors&rdquo;. Cancellation stops future auto-renewals.
              </li>
              <li>
                <strong>48-Hour Guarantee:</strong> If a mentor is completely unresponsive or unavailable during the first 48 hours of a newly purchased subscription, you are entitled to a 100% refund.
              </li>
              <li>
                <strong>Active Cycle Access:</strong> If cancelled after 48 hours, your subscription remains active until the end of the current 30-day billing cycle with no pro-rated cash refund.
              </li>
            </ul>
          </div>

          {/* Section 4: Scheduled 1-on-1 Calls */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl">
                <ClockCounterClockwise weight="fill" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Scheduled Calls & Google Meet Sessions</h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5 leading-relaxed">
              <li>
                <strong>Student Cancellation:</strong> Calls cancelled at least <strong>4 hours prior</strong> to the scheduled start time will receive a 100% wallet refund. Cancellations made with less than 4 hours notice are non-refundable to respect mentor schedule commitments.
              </li>
              <li>
                <strong>Mentor No-Show:</strong> If a mentor fails to join the Google Meet session within 10 minutes of the scheduled time, the student receives a full 100% refund plus a priority rebooking credit.
              </li>
            </ul>
          </div>

          {/* Section 5: How to Request */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <EnvelopeSimple weight="bold" className="text-blue-400" /> 5. How to Initiate a Refund Request
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              To request a refund or dispute a session, submit a request via our <Link href="/contact" className="text-blue-400 underline font-semibold">Contact Form</Link> or email us at <a href="mailto:support@helpsathi.com" className="text-blue-400 underline font-semibold">support@helpsathi.com</a> with:
            </p>
            <ol className="text-xs sm:text-sm text-slate-300 list-decimal pl-5 space-y-1.5">
              <li>Your registered student email address</li>
              <li>Payment Order ID or Chat Session ID</li>
              <li>Mentor Name & Date of Session / Transaction</li>
              <li>Clear description of the issue or rationale for refund</li>
            </ol>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
              Approved refunds to original payment methods are initiated within <strong>24–48 hours</strong> and typically reflect in your bank account or card statement within <strong>5–7 business days</strong> as per banking network standards.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
