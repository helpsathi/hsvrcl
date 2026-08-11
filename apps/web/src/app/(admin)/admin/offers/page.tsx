"use client";

import { useEffect, useState } from "react";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { useToast } from "@/components/providers/ToastProvider";
import * as PhosphorIcons from "@phosphor-icons/react";
import { 
  Plus, 
  Trash, 
  FloppyDisk, 
  PaintBrushBroad, 
  Sparkle, 
  Eye, 
  Palette, 
  Check, 
  Info,
  Gift,
  Tag,
  Star,
  Flame,
  Lightning,
  Crown,
  Rocket,
  FileText,
  CheckCircle,
  GraduationCap,
  ChatCircleDots,
  Wallet,
  Heart,
  ShieldCheck,
  Trophy
} from "@phosphor-icons/react";

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  iconName: string;
  newUsersOnly: boolean;
}

function createClientId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `offer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Predefined Themes with curated gradient pairings and icons
const PREDEFINED_THEMES = [
  { 
    id: "brand-gold", 
    name: "HelpSathi Gold", 
    from: "from-amber-500", 
    to: "to-orange-600", 
    icon: "Sparkle", 
    previewBg: "from-amber-500 to-orange-600" 
  },
  { 
    id: "ocean-breeze", 
    name: "Ocean Breeze", 
    from: "from-blue-600", 
    to: "to-cyan-500", 
    icon: "ChatCircleDots", 
    previewBg: "from-blue-600 to-cyan-500" 
  },
  { 
    id: "royal-indigo", 
    name: "Royal Indigo", 
    from: "from-indigo-600", 
    to: "to-purple-600", 
    icon: "Tag", 
    previewBg: "from-indigo-600 to-purple-600" 
  },
  { 
    id: "emerald-mint", 
    name: "Emerald Mint", 
    from: "from-emerald-500", 
    to: "to-teal-600", 
    icon: "CheckCircle", 
    previewBg: "from-emerald-500 to-teal-600" 
  },
  { 
    id: "sunset-glow", 
    name: "Sunset Glow", 
    from: "from-rose-500", 
    to: "to-amber-500", 
    icon: "Flame", 
    previewBg: "from-rose-500 to-amber-500" 
  },
  { 
    id: "cyber-neon", 
    name: "Cyber Neon", 
    from: "from-violet-600", 
    to: "to-fuchsia-600", 
    icon: "Lightning", 
    previewBg: "from-violet-600 to-fuchsia-600" 
  },
  { 
    id: "deep-crimson", 
    name: "Deep Crimson", 
    from: "from-red-600", 
    to: "to-pink-600", 
    icon: "Gift", 
    previewBg: "from-red-600 to-pink-600" 
  },
  { 
    id: "aurora-night", 
    name: "Aurora Night", 
    from: "from-sky-500", 
    to: "to-indigo-700", 
    icon: "Rocket", 
    previewBg: "from-sky-500 to-indigo-700" 
  },
  { 
    id: "midnight-velvet", 
    name: "Midnight Slate", 
    from: "from-slate-800", 
    to: "to-slate-950", 
    icon: "ShieldCheck", 
    previewBg: "from-slate-800 to-slate-950" 
  },
  { 
    id: "sun-shine", 
    name: "Golden Sun", 
    from: "from-yellow-400", 
    to: "to-amber-600", 
    icon: "Star", 
    previewBg: "from-yellow-400 to-amber-600" 
  },
  { 
    id: "forest-sage", 
    name: "Forest Pine", 
    from: "from-teal-600", 
    to: "to-emerald-800", 
    icon: "GraduationCap", 
    previewBg: "from-teal-600 to-emerald-800" 
  },
  { 
    id: "berry-rose", 
    name: "Rose Berry", 
    from: "from-pink-500", 
    to: "to-rose-600", 
    icon: "Heart", 
    previewBg: "from-pink-500 to-rose-600" 
  },
];

// Color palette options for Gradient From and Gradient To
const COLOR_PALETTE = [
  { name: "Amber", fromClass: "from-amber-500", toClass: "to-amber-500", bgClass: "bg-amber-500" },
  { name: "Orange", fromClass: "from-orange-500", toClass: "to-orange-500", bgClass: "bg-orange-500" },
  { name: "Red", fromClass: "from-red-600", toClass: "to-red-600", bgClass: "bg-red-600" },
  { name: "Rose", fromClass: "from-rose-500", toClass: "to-rose-500", bgClass: "bg-rose-500" },
  { name: "Pink", fromClass: "from-pink-500", toClass: "to-pink-500", bgClass: "bg-pink-500" },
  { name: "Fuchsia", fromClass: "from-fuchsia-600", toClass: "to-fuchsia-600", bgClass: "bg-fuchsia-600" },
  { name: "Purple", fromClass: "from-purple-600", toClass: "to-purple-600", bgClass: "bg-purple-600" },
  { name: "Violet", fromClass: "from-violet-600", toClass: "to-violet-600", bgClass: "bg-violet-600" },
  { name: "Indigo", fromClass: "from-indigo-600", toClass: "to-indigo-600", bgClass: "bg-indigo-600" },
  { name: "Blue", fromClass: "from-blue-600", toClass: "to-blue-600", bgClass: "bg-blue-600" },
  { name: "Sky", fromClass: "from-sky-500", toClass: "to-sky-500", bgClass: "bg-sky-500" },
  { name: "Cyan", fromClass: "from-cyan-500", toClass: "to-cyan-500", bgClass: "bg-cyan-500" },
  { name: "Teal", fromClass: "from-teal-600", toClass: "to-teal-600", bgClass: "bg-teal-600" },
  { name: "Emerald", fromClass: "from-emerald-500", toClass: "to-emerald-500", bgClass: "bg-emerald-500" },
  { name: "Green", fromClass: "from-green-600", toClass: "to-green-600", bgClass: "bg-green-600" },
  { name: "Yellow", fromClass: "from-yellow-400", toClass: "to-yellow-400", bgClass: "bg-yellow-400" },
  { name: "Slate", fromClass: "from-slate-800", toClass: "to-slate-900", bgClass: "bg-slate-800" },
  { name: "Brand", fromClass: "from-brand-500", toClass: "to-brand-500", bgClass: "bg-amber-400" },
];

// Popular Icons for one-click selection
const POPULAR_ICONS = [
  { name: "Gift", label: "Gift", Icon: Gift },
  { name: "Tag", label: "Discount", Icon: Tag },
  { name: "Sparkle", label: "Sparkle", Icon: Sparkle },
  { name: "Star", label: "Star", Icon: Star },
  { name: "Flame", label: "Trending", Icon: Flame },
  { name: "Lightning", label: "Flash", Icon: Lightning },
  { name: "Crown", label: "VIP", Icon: Crown },
  { name: "Rocket", label: "Launch", Icon: Rocket },
  { name: "FileText", label: "Resume", Icon: FileText },
  { name: "CheckCircle", label: "Verified", Icon: CheckCircle },
  { name: "GraduationCap", label: "Learn", Icon: GraduationCap },
  { name: "ChatCircleDots", label: "Chat", Icon: ChatCircleDots },
  { name: "Wallet", label: "Wallet", Icon: Wallet },
  { name: "Heart", label: "Favorite", Icon: Heart },
  { name: "ShieldCheck", label: "Secure", Icon: ShieldCheck },
  { name: "Trophy", label: "Award", Icon: Trophy },
];

const DEFAULT_OFFERS: Offer[] = [
  {
    id: "default-free-chats",
    title: "First 3 Chats are Free!",
    subtitle: "Talk to any expert mentor for 5 mins.",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-600",
    iconName: "Gift",
    newUsersOnly: true
  },
  {
    id: "default-first-month",
    title: "50% Off First Month",
    subtitle: "Subscribe to any mentor and get half off your first month.",
    gradientFrom: "from-indigo-600",
    gradientTo: "to-purple-600",
    iconName: "Tag",
    newUsersOnly: false
  },
  {
    id: "default-resume-review",
    title: "Free Resume Review",
    subtitle: "Book a 30-min call and get a free resume review.",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-600",
    iconName: "FileText",
    newUsersOnly: false
  }
];

export default function AdminOffersPage() {
  const toast = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  async function fetchOffers() {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch("/api/admin/offers");
      const data = await res.json();
      if (res.ok && data.offers) {
        if (data.offers.length === 0) {
          setOffers([]);
        } else {
          setOffers(data.offers);
          // Auto-resolve alert if data is present and healthy
          fetch("/api/admin/alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "RESOLVE", alertId: "OFFERS_EMPTY" }),
          }).catch(() => {});
        }
      } else {
        const errorMsg = data.error || "Server responded with an error loading promotional offers.";
        setFetchError(errorMsg);
        toast.error(errorMsg);
        // Log system alert in Admin Notifications
        fetch("/api/admin/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "LOG_ERROR",
            errorDetails: {
              title: "❌ Offers Sync Error",
              message: errorMsg,
              link: "/admin/offers",
            },
          }),
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error("Failed to load offers", err);
      const errText = err?.message || "Failed to connect to database or server.";
      setFetchError(errText);
      toast.error("Network or database connection issue loading offers.");
    } finally {
      setLoading(false);
    }
  }

  async function saveOffers(newOffers: Offer[], showFeedback = true) {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offers: newOffers }),
      });
      if (res.ok) {
        if (showFeedback) {
          toast.success("Promotional offers saved successfully!");
        }
        setFetchError(null);
        // Automatically mark any open offers system alert as resolved!
        fetch("/api/admin/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "RESOLVE", alertId: "OFFERS_EMPTY" }),
        }).catch(() => {});
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save offers.");
      }
    } catch (err) {
      console.error("Save offers error", err);
      toast.error("Network error while saving offers.");
    } finally {
      setSaving(false);
    }
  }

  const handleAdd = () => {
    const newOffer: Offer = { 
      id: createClientId(), 
      title: "Special Mentorship Offer", 
      subtitle: "Get personalized guidance from top industry experts today.", 
      gradientFrom: "from-blue-600", 
      gradientTo: "to-cyan-500", 
      iconName: "Sparkle", 
      newUsersOnly: false 
    };
    setOffers([...offers, newOffer]);
  };

  const handleRemove = (id: string) => {
    setOffers(offers.filter(o => o.id !== id));
  };

  const handleChange = (id: string, field: keyof Offer, value: any) => {
    setOffers(offers.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const handleApplyTheme = (offerId: string, theme: typeof PREDEFINED_THEMES[0]) => {
    setOffers(offers.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          gradientFrom: theme.from,
          gradientTo: theme.to,
          iconName: theme.icon
        };
      }
      return o;
    }));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveOffers(offers, true);
  };

  if (loading) {
    return <AdminLoader message="Loading offers and banners..." />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500">
              <PaintBrushBroad weight="fill" className="text-2xl" />
            </div>
            Dashboard Offers & Banners
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Design and customize interactive visual promotional cards displayed on the student dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <Plus weight="bold" className="text-base" /> Add New Offer
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
          >
            <FloppyDisk weight="bold" className="text-lg" />
            {saving ? "Saving Changes..." : "Save All Offers"}
          </button>
        </div>
      </div>

      {/* On-Screen Diagnostic & Recovery Banner */}
      {(fetchError || (!loading && offers.length === 0)) && (
        <div className="p-6 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/30 dark:border-amber-500/40 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-3xl shrink-0">
              <PhosphorIcons.WarningCircle weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-amber-900 dark:text-amber-200">
                {fetchError ? "Connection / Sync Issue Detected" : "Dashboard Promotional Offers Are Currently Empty"}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                {fetchError || "Students currently see no promotional cards or banners on their dashboard. You can instantly restore our curated default banners (Free Trial, 50% Off First Month, Resume Review) with 1 click."}
              </p>
              <div className="flex items-center gap-2 mt-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <PhosphorIcons.CheckCircle weight="fill" className="text-base" />
                <span>Admin notifications alerted & monitored. This alert will automatically vanish once fixed!</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => { setFetchError(null); fetchOffers(); }}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
            >
              <PhosphorIcons.ArrowClockwise weight="bold" />
              Retry Connection
            </button>
            <button
              type="button"
              onClick={async () => {
                setFetchError(null);
                setOffers(DEFAULT_OFFERS);
                await saveOffers(DEFAULT_OFFERS, true);
              }}
              className="flex-1 md:flex-none px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <PhosphorIcons.Sparkle weight="fill" className="text-sm" />
              Restore Default Banners
            </button>
          </div>
        </div>
      )}

      {/* Offers Grid */}
      <form onSubmit={handleSaveAll} className="space-y-8">
        {offers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <Sparkle weight="duotone" className="text-5xl text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No active offers or banners</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Create your first promotional card or click "Restore Default Banners" above to engage students.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-main text-brand-950 font-bold rounded-2xl shadow-sm hover:bg-brand-400 transition"
              >
                <Plus weight="bold" /> Create Offer
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {offers.map((offer, index) => {
              const IconComponent = (PhosphorIcons as any)[offer.iconName] || PhosphorIcons.Star;

              return (
                <div 
                  key={offer.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-md p-6 space-y-6 relative group transition-all"
                >
                  {/* Card Header & Delete Button */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Banner Card
                      </span>
                      {offer.newUsersOnly && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          New Users Only
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(offer.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                      title="Delete Offer"
                    >
                      <Trash weight="bold" className="text-lg" />
                    </button>
                  </div>

                  {/* 1. Live Banner Visualizer Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Eye weight="bold" className="text-slate-400" /> Live Banner Preview
                      </span>
                      <span className="text-[11px] text-slate-400">Exact visual rendering</span>
                    </div>

                    <div 
                      className={`w-full min-h-[140px] bg-gradient-to-r ${offer.gradientFrom} ${offer.gradientTo} rounded-2xl p-5 text-white flex flex-col justify-between relative overflow-hidden shadow-lg transition-all duration-300`}
                    >
                      {/* Background Glow */}
                      <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                      <div className="relative z-10 space-y-1 max-w-[75%]">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black tracking-wider uppercase text-white mb-1 shadow-sm">
                          <IconComponent weight="fill" className="text-xs" />
                          {offer.newUsersOnly ? "Special Welcome Offer" : "Exclusive Offer"}
                        </div>
                        <h3 className="font-extrabold text-lg sm:text-xl leading-tight text-white drop-shadow-sm">
                          {offer.title || "Offer Title Preview"}
                        </h3>
                        <p className="text-xs text-white/90 font-medium leading-snug line-clamp-2">
                          {offer.subtitle || "Offer description and details preview."}
                        </p>
                      </div>


                      {/* Big Background Icon Watermark */}
                      <IconComponent 
                        weight="fill" 
                        className="absolute -right-3 -bottom-3 text-[90px] text-white/15 pointer-events-none transform rotate-6 transition-all" 
                      />
                    </div>
                  </div>

                  {/* 2. Predefined Good-Looking Themes */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkle weight="fill" className="text-amber-500" /> 1-Click Aesthetic Themes
                      </label>
                      <span className="text-[11px] text-slate-400">Click to apply instantly</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {PREDEFINED_THEMES.map((theme) => {
                        const isSelected = offer.gradientFrom === theme.from && offer.gradientTo === theme.to;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => handleApplyTheme(offer.id, theme)}
                            className={`p-2 rounded-2xl border text-left flex items-center gap-2 transition-all group/theme ${
                              isSelected 
                                ? "border-brand-main bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-brand-main/30" 
                                : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full bg-gradient-to-r ${theme.previewBg} shrink-0 shadow-sm flex items-center justify-center text-white text-[10px]`}>
                              {isSelected && <Check weight="bold" />}
                            </span>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                              {theme.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Visual Color Palette for Gradient From & Gradient To */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Gradient From */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300">
                          Gradient From
                        </label>
                        <span className="text-[11px] font-mono text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                          {offer.gradientFrom}
                        </span>
                      </div>

                      {/* Swatches Grid */}
                      <div className="grid grid-cols-6 gap-1.5">
                        {COLOR_PALETTE.map((color) => {
                          const isSelected = offer.gradientFrom === color.fromClass;
                          return (
                            <button
                              key={`from-${color.name}`}
                              type="button"
                              onClick={() => handleChange(offer.id, "gradientFrom", color.fromClass)}
                              title={`${color.name} (${color.fromClass})`}
                              className={`h-7 rounded-xl ${color.bgClass} flex items-center justify-center transition transform active:scale-95 shadow-sm ${
                                isSelected ? "ring-2 ring-slate-950 dark:ring-white scale-105" : "hover:opacity-90 opacity-75"
                              }`}
                            >
                              {isSelected && <Check weight="bold" className="text-white text-xs" />}
                            </button>
                          );
                        })}
                      </div>

                      <input 
                        type="text" 
                        placeholder="Custom class, e.g. from-blue-600"
                        value={offer.gradientFrom} 
                        onChange={e => handleChange(offer.id, "gradientFrom", e.target.value)} 
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-main" 
                      />
                    </div>

                    {/* Gradient To */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300">
                          Gradient To
                        </label>
                        <span className="text-[11px] font-mono text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                          {offer.gradientTo}
                        </span>
                      </div>

                      {/* Swatches Grid */}
                      <div className="grid grid-cols-6 gap-1.5">
                        {COLOR_PALETTE.map((color) => {
                          const isSelected = offer.gradientTo === color.toClass;
                          return (
                            <button
                              key={`to-${color.name}`}
                              type="button"
                              onClick={() => handleChange(offer.id, "gradientTo", color.toClass)}
                              title={`${color.name} (${color.toClass})`}
                              className={`h-7 rounded-xl ${color.bgClass} flex items-center justify-center transition transform active:scale-95 shadow-sm ${
                                isSelected ? "ring-2 ring-slate-950 dark:ring-white scale-105" : "hover:opacity-90 opacity-75"
                              }`}
                            >
                              {isSelected && <Check weight="bold" className="text-white text-xs" />}
                            </button>
                          );
                        })}
                      </div>

                      <input 
                        type="text" 
                        placeholder="Custom class, e.g. to-purple-600"
                        value={offer.gradientTo} 
                        onChange={e => handleChange(offer.id, "gradientTo", e.target.value)} 
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-main" 
                      />
                    </div>
                  </div>

                  {/* 4. Visual Icon Picker */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Tag weight="bold" className="text-slate-400" /> Icon Selection
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">{offer.iconName}</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {POPULAR_ICONS.map(({ name, label, Icon }) => {
                        const isSelected = offer.iconName === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleChange(offer.id, "iconName", name)}
                            title={label}
                            className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition ${
                              isSelected
                                ? "border-brand-main bg-amber-50 dark:bg-amber-950/30 text-brand-600 dark:text-brand-400 ring-2 ring-brand-main/30 font-bold"
                                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            <Icon weight={isSelected ? "fill" : "bold"} className="text-lg" />
                            <span className="text-[10px] leading-tight truncate w-full text-center">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Title & Subtitle Inputs */}
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Offer Title
                      </label>
                      <input 
                        type="text" 
                        value={offer.title} 
                        onChange={e => handleChange(offer.id, "title", e.target.value)} 
                        placeholder="e.g. 50% Off First Month"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-main" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Offer Subtitle / Description
                      </label>
                      <input 
                        type="text" 
                        value={offer.subtitle} 
                        onChange={e => handleChange(offer.id, "subtitle", e.target.value)} 
                        placeholder="e.g. Subscribe to any mentor and get half off your first month."
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-main" 
                      />
                    </div>

                    {/* New Users Only Toggle */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <input
                        type="checkbox"
                        id={`newUsersOnly-${offer.id}`}
                        checked={offer.newUsersOnly}
                        onChange={(e) => handleChange(offer.id, "newUsersOnly", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-brand-main focus:ring-brand-main cursor-pointer"
                      />
                      <label htmlFor={`newUsersOnly-${offer.id}`} className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                        New Users Only
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          Automatically hides this banner once a student consumes their 3 free trial sessions.
                        </span>
                      </label>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {offers.length > 0 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <Plus weight="bold" /> Add Another Offer
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition disabled:opacity-50"
            >
              <FloppyDisk weight="bold" className="text-lg" />
              {saving ? "Saving Changes..." : "Save All Offers"}
            </button>
          </div>
        )}
      </form>

    </div>
  );
}
