"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  CurrencyInr, 
  Gift, 
  Tag, 
  Bell, 
  UsersThree, 
  Link as LinkIcon, 
  ShieldCheck, 
  FloppyDisk, 
  ArrowSquareOut, 
  Sparkle, 
  Gear, 
  SlidersHorizontal,
  ListDashes,
  Megaphone,
  ChatCircleDots,
  PhoneCall,
  ArrowsClockwise
} from "@phosphor-icons/react";

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  description?: string;
  type: string;
}

// Keys mapped into specialized visual sections
const STRUCTURED_KEYS = {
  // Financial
  PLATFORM_COMMISSION_RATE: "platform_commission_rate",
  MIN_WALLET_RECHARGE: "min_wallet_recharge",
  MIN_WITHDRAWAL_AMOUNT: "min_withdrawal_amount",
  MAX_WITHDRAWAL_REQUESTS: "max_withdrawal_requests",
  
  // Free Trial
  FREE_TRIAL_ENABLED: "free_trial_enabled",
  FREE_TRIAL_MAX_CHATS: "free_trial_max_chats",
  FREE_TRIAL_MAX_MINUTES: "free_trial_max_minutes",
  
  // Pricing
  DEFAULT_MONTHLY_PRICE: "default_monthly_price",
  DEFAULT_PER_MINUTE_PRICE: "default_per_minute_price",
  DEFAULT_CALL_PRICE: "default_call_price",
  
  // System Toggles
  NOTIFICATIONS_ENABLED: "notifications_enabled",
  COMMUNITY_ENABLED: "community_enabled",
  
  // Support
  CONTACT_FORM_URL: "contact_form_url",
  
  // Handled by dedicated visual managers (excluded from generic raw inputs)
  DASHBOARD_CATEGORIES: "DASHBOARD_CATEGORIES",
  DASHBOARD_OFFERS: "DASHBOARD_OFFERS",
};

export default function AdminConfigPage() {
  const toast = useToast();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [offerCount, setOfferCount] = useState<number | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      if (res.ok && data.configs) {
        setConfigs(data.configs);
        
        // Check for counts of visual elements if present
        const catItem = data.configs.find((c: ConfigItem) => c.key === "DASHBOARD_CATEGORIES");
        if (catItem) {
          try {
            const parsed = JSON.parse(catItem.value);
            if (Array.isArray(parsed)) setCategoryCount(parsed.length);
          } catch (e) {}
        }
        const offerItem = data.configs.find((c: ConfigItem) => c.key === "DASHBOARD_OFFERS");
        if (offerItem) {
          try {
            const parsed = JSON.parse(offerItem.value);
            if (Array.isArray(parsed)) setOfferCount(parsed.length);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load platform settings");
    } finally {
      setLoading(false);
    }
  }

  function getValue(key: string, defaultValue: string = ""): string {
    const item = configs.find((c) => c.key === key);
    return item ? item.value : defaultValue;
  }

  function handleValueChange(key: string, newValue: string) {
    setConfigs((prev) => {
      const exists = prev.some((item) => item.key === key);
      if (exists) {
        return prev.map((item) => (item.key === key ? { ...item, value: newValue } : item));
      }
      return [...prev, { id: key, key, value: newValue, type: "string" }];
    });
  }

  async function handleSaveAll(e?: React.FormEvent) {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Platform settings updated successfully! ⚡");
      } else {
        toast.error(data.error || "Failed to update configurations");
      }
    } catch (err) {
      toast.error("Error saving platform configurations");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AdminLoader message="Loading platform configuration..." />;
  }

  // Filter out any other custom keys that aren't part of the structured sections or visual managers
  const knownKeysList = Object.values(STRUCTURED_KEYS);
  const extraConfigs = configs.filter((c) => {
    if (knownKeysList.includes(c.key)) return false;
    // Also ignore any raw serialized JSON arrays
    if (c.value.trim().startsWith("[") || c.value.trim().startsWith("{")) return false;
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <SlidersHorizontal weight="fill" className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Platform Rules & Settings
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Configure commission rates, trial allowances, default pricing, and master feature switches.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchConfigs()}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition flex items-center gap-2"
          >
            <ArrowsClockwise weight="bold" className={`text-sm ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs md:text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <>
                <ArrowsClockwise className="animate-spin text-base" />
                Saving Changes...
              </>
            ) : (
              <>
                <FloppyDisk weight="bold" className="text-base" />
                Save Platform Settings
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-8">
        {/* SECTION 1: VISUAL CONTENT STUDIOS (Categories & Offers) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkle weight="fill" className="text-indigo-600 dark:text-indigo-400 text-base" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Visual Content Builders & Studios
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Manage dynamic homepage categories and promotional banners with dedicated visual designers instead of editing raw code.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Categories Studio Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
                    <ListDashes weight="bold" className="text-2xl" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {categoryCount !== null ? `${categoryCount} Active Categories` : "Live Catalog"}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Dashboard & Search Categories
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Add, reorder, and customize exam categories (e.g. UPSC, JEE, Software, CAT) with Phosphor icon selections and custom gradient badges.
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-indigo-100/60 dark:border-indigo-900/40">
                <Link
                  href="/admin/categories"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all group"
                >
                  <span>Open Category Visual Builder</span>
                  <ArrowSquareOut weight="bold" className="text-sm group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Offers & Banners Studio Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50/70 via-white to-pink-50/70 dark:from-slate-900 dark:via-slate-900/90 dark:to-purple-950/40 border border-purple-100 dark:border-purple-900/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/25">
                    <Megaphone weight="bold" className="text-2xl" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    {offerCount !== null ? `${offerCount} Active Banners` : "Promo Cards"}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Dashboard Offers & Promo Banners
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Create eye-catching student dashboard promo cards with custom gradients, discount subtitles, and &apos;new users only&apos; badges.
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-purple-100/60 dark:border-purple-900/40">
                <Link
                  href="/admin/offers"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all group"
                >
                  <span>Open Promo Banner Visual Studio</span>
                  <ArrowSquareOut weight="bold" className="text-sm group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: FINANCIAL RULES & COMMISSIONS */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CurrencyInr weight="bold" className="text-xl" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Financial Rules & Commissions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage revenue sharing percentages, wallet top-up minimums, and mentor payout constraints.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commission Rate */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Platform Commission Fee (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={getValue(STRUCTURED_KEYS.PLATFORM_COMMISSION_RATE, "20")}
                  onChange={(e) => handleValueChange(STRUCTURED_KEYS.PLATFORM_COMMISSION_RATE, e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Percentage deducted from mentor consultation earnings & monthly subscriptions.
              </p>
            </div>

            {/* Min Wallet Recharge */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Minimum Wallet Recharge (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={getValue(STRUCTURED_KEYS.MIN_WALLET_RECHARGE, "100")}
                  onChange={(e) => handleValueChange(STRUCTURED_KEYS.MIN_WALLET_RECHARGE, e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Lowest balance addition permitted per top-up transaction on the student wallet.
              </p>
            </div>

            {/* Min Withdrawal Amount */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Minimum Mentor Withdrawal Threshold (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={getValue(STRUCTURED_KEYS.MIN_WITHDRAWAL_AMOUNT, "500")}
                  onChange={(e) => handleValueChange(STRUCTURED_KEYS.MIN_WITHDRAWAL_AMOUNT, e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Minimum wallet balance a mentor must accumulate before requesting a bank payout.
              </p>
            </div>

            {/* Max Pending Withdrawal Requests */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Max Active Withdrawal Requests
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={getValue(STRUCTURED_KEYS.MAX_WITHDRAWAL_REQUESTS, "3")}
                  onChange={(e) => handleValueChange(STRUCTURED_KEYS.MAX_WITHDRAWAL_REQUESTS, e.target.value)}
                  className="w-full pl-4 pr-16 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  requests
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Maximum pending payout requests allowed at one time per mentor account.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: FREE TRIAL & ONBOARDING ALLOWANCE */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Gift weight="bold" className="text-xl" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Free Trial & New Student Experience
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control the free trial onboarding program and session duration caps for new signups.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Master Free Trial Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Free Trial Consultations</span>
                  {getValue(STRUCTURED_KEYS.FREE_TRIAL_ENABLED, "true") === "true" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      DISABLED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Allow newly registered students to start free consultation chats with any mentor.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const current = getValue(STRUCTURED_KEYS.FREE_TRIAL_ENABLED, "true");
                  handleValueChange(STRUCTURED_KEYS.FREE_TRIAL_ENABLED, current === "true" ? "false" : "true");
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  getValue(STRUCTURED_KEYS.FREE_TRIAL_ENABLED, "true") === "true"
                    ? "bg-emerald-500 justify-end"
                    : "bg-slate-300 dark:bg-slate-700 justify-start"
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Free Chats */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Free Chats Allowance Per Student
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="1"
                    value={getValue(STRUCTURED_KEYS.FREE_TRIAL_MAX_CHATS, "3")}
                    onChange={(e) => handleValueChange(STRUCTURED_KEYS.FREE_TRIAL_MAX_CHATS, e.target.value)}
                    className="w-full pl-4 pr-16 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    chats
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Number of introductory chat sessions each student receives upon signup.
                </p>
              </div>

              {/* Free Trial Minutes Cap */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Max Duration Per Free Chat
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    step="1"
                    value={getValue(STRUCTURED_KEYS.FREE_TRIAL_MAX_MINUTES, "5")}
                    onChange={(e) => handleValueChange(STRUCTURED_KEYS.FREE_TRIAL_MAX_MINUTES, e.target.value)}
                    className="w-full pl-4 pr-16 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    minutes
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Timer cap before chat prompts the student to recharge wallet or subscribe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: DEFAULT MENTOR PRICING RECOMMENDATIONS */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Tag weight="bold" className="text-xl" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Default Mentor Pricing Guidelines
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recommended baseline prices pre-filled when newly approved mentors set up their profiles.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monthly Subscription Default */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag weight="bold" className="text-indigo-600" />
                Default Monthly Pass Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={getValue(STRUCTURED_KEYS.DEFAULT_MONTHLY_PRICE, "1000")}
                  onChange={(e) => handleValueChange(STRUCTURED_KEYS.DEFAULT_MONTHLY_PRICE, e.target.value)}
                  className="w-full pl-8 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  /mo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Standard monthly mentorship pass price recommendation.
              </p>
            </div>

            {/* Per-Minute Chat Default */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ChatCircleDots weight="bold" className="text-teal-600" />
                Default Per-Minute Chat Rate
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={getValue(STRUCTURED_KEYS.DEFAULT_PER_MINUTE_PRICE, "15")}
                  onChange={(e) => handleValueChange(STRUCTURED_KEYS.DEFAULT_PER_MINUTE_PRICE, e.target.value)}
                  className="w-full pl-8 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  /min
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Baseline pay-as-you-go chat consultation fee per minute.
              </p>
            </div>

            {/* Per-Minute Call Default */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <PhoneCall weight="bold" className="text-purple-600" />
                Default Per-Minute Call Rate
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={getValue(STRUCTURED_KEYS.DEFAULT_CALL_PRICE, "15")}
                  onChange={(e) => handleValueChange(STRUCTURED_KEYS.DEFAULT_CALL_PRICE, e.target.value)}
                  className="w-full pl-8 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  /min
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Baseline rate for audio & video scheduled call consultations.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 5: PLATFORM FEATURE TOGGLES & CONTACT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Feature Switches */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Gear weight="bold" className="text-xl" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Platform Master Toggles
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enable or disable core system modules globally.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Notification System Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell weight="bold" className="text-indigo-600 dark:text-indigo-400" />
                    <span>System Notifications Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Deliver in-app real-time alerts and activity notifications to users.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const current = getValue(STRUCTURED_KEYS.NOTIFICATIONS_ENABLED, "true");
                    handleValueChange(STRUCTURED_KEYS.NOTIFICATIONS_ENABLED, current === "true" ? "false" : "true");
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    getValue(STRUCTURED_KEYS.NOTIFICATIONS_ENABLED, "true") === "true"
                      ? "bg-emerald-500 justify-end"
                      : "bg-slate-300 dark:bg-slate-700 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Community Forum Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <UsersThree weight="bold" className="text-teal-600 dark:text-teal-400" />
                    <span>Community Discussion Board</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enable public community feed, questions, comments, and post creation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const current = getValue(STRUCTURED_KEYS.COMMUNITY_ENABLED, "true");
                    handleValueChange(STRUCTURED_KEYS.COMMUNITY_ENABLED, current === "true" ? "false" : "true");
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    getValue(STRUCTURED_KEYS.COMMUNITY_ENABLED, "true") === "true"
                      ? "bg-emerald-500 justify-end"
                      : "bg-slate-300 dark:bg-slate-700 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Support Form URL */}
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <LinkIcon weight="bold" className="text-xl" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Support & Contact Links
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  External form or embed endpoint used for student feedback & help inquiries.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Contact Us Form Embed URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://docs.google.com/forms/..."
                  value={getValue(STRUCTURED_KEYS.CONTACT_FORM_URL, "")}
                  onChange={(e) => handleValueChange(STRUCTURED_KEYS.CONTACT_FORM_URL, e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Google Forms or Typeform embed URL displayed on the student /contact portal.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 6: ADDITIONAL EXTRA CONFIGS (IF ANY DYNAMIC ONES EXIST) */}
        {extraConfigs.length > 0 && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Additional Platform Parameters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {extraConfigs.map((item) => (
                <div key={item.key} className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 capitalize">
                    {item.key.replace(/_/g, " ")}
                  </label>
                  <input
                    type={item.type === "number" ? "number" : "text"}
                    value={item.value}
                    onChange={(e) => handleValueChange(item.key, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {item.description && (
                    <p className="text-[11px] text-slate-500">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sticky Bottom Save Action Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border border-slate-200/80 dark:border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <ShieldCheck weight="fill" className="text-emerald-500 text-base" />
            <span>Changes take effect immediately across web clients and API endpoints.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <ArrowsClockwise className="animate-spin text-base" />
                Saving Changes...
              </>
            ) : (
              <>
                <FloppyDisk weight="bold" className="text-base" />
                Save Platform Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
