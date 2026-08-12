import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { 
  ShieldCheck, 
  Lightning, 
  Package, 
  ArrowsLeftRight,
  EnvelopeSimple
} from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Shipping & Exchange Policy | Help Sathi",
  description: "Help Sathi's official shipping and exchange policy for digital mentorship services.",
};

export default function ShippingPolicyPage() {
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
            Shipping & Exchange Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Last Updated: August 2, 2026 • Applies to all users and transactions on the Help Sathi platform.
          </p>
        </div>

        {/* Introduction */}
        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
          <p>
            <strong>Help Sathi</strong> is a platform providing digital mentorship services, including live chats, 1-on-1 scheduled calls, and monthly subscriptions. Because our services are fully digital, our shipping and delivery processes differ from traditional e-commerce platforms selling physical goods.
          </p>
        </div>

        {/* Policy Sections Grid */}
        <div className="space-y-8">
          {/* Section 1: Digital Delivery */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                <Lightning weight="fill" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Instant Digital Delivery</h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5 leading-relaxed">
              <li>
                <strong>No Physical Shipping:</strong> We do not sell or ship physical products. Therefore, there are no shipping charges, delivery delays, or courier tracking requirements associated with your purchases on Help Sathi.
              </li>
              <li>
                <strong>Immediate Fulfillment:</strong> Upon successful payment for a wallet recharge, subscription, or appointment booking, your digital account is updated instantaneously.
              </li>
              <li>
                <strong>Service Access:</strong> Your purchased credits or active subscriptions are immediately available for use within your dashboard upon transaction success.
              </li>
            </ul>
          </div>

          {/* Section 2: No Physical Goods */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
                <Package weight="fill" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Shipping Timeline & Costs</h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5 leading-relaxed">
              <li>
                <strong>Shipping Cost:</strong> ₹0.00 (Not applicable as all services are digital).
              </li>
              <li>
                <strong>Delivery Time:</strong> Instantaneous upon payment confirmation by our payment gateway partners (such as Razorpay).
              </li>
            </ul>
          </div>

          {/* Section 3: Exchange Policy */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
                <ArrowsLeftRight weight="fill" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Exchange Policy</h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5 leading-relaxed">
              <li>
                <strong>No Physical Exchanges:</strong> Because our offerings are digital services, physical exchanges are inherently not applicable.
              </li>
              <li>
                <strong>Service Adjustments:</strong> If you are dissatisfied with a mentorship session or face technical issues, please refer to our <Link href="/refund" className="text-blue-500 hover:underline">Refund & Cancellation Policy</Link>. We resolve disputes via refunds or account credits rather than "exchanges."
              </li>
            </ul>
          </div>

          {/* Section 4: Contact */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <EnvelopeSimple weight="bold" className="text-blue-400" /> 4. Issues with Digital Delivery?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              If you have successfully made a payment but the services (wallet balance, subscription, or appointment) are not reflecting in your dashboard, it may be due to a delay from the banking network. 
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Please contact us immediately via our <Link href="/contact" className="text-blue-400 underline font-semibold">Contact Form</Link> or email us at <a href="mailto:support@helpsathi.com" className="text-blue-400 underline font-semibold">support@helpsathi.com</a> with your Order ID, and our team will resolve it within 24 hours.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
