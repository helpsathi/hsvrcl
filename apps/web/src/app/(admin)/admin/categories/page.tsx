"use client";

import { useEffect, useState } from "react";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { useToast } from "@/components/providers/ToastProvider";
import * as PhosphorIcons from "@phosphor-icons/react";

interface Category {
  id: string;
  name: string;
  iconName: string;
  colorClass: string;
  customIconUrl?: string;
}

function createClientId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `category-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "default-upsc-bpsc", name: "UPSC / BPSC", iconName: "BookOpenText", colorClass: "text-indigo-600 group-hover:border-indigo-400" },
  { id: "default-jee-neet", name: "JEE / NEET", iconName: "Atom", colorClass: "text-teal-600 group-hover:border-teal-400" },
  { id: "default-software-engg", name: "Software Engg", iconName: "Code", colorClass: "text-blue-500 group-hover:border-blue-400" },
  { id: "default-startup-founder", name: "Startup Founder", iconName: "RocketLaunch", colorClass: "text-orange-500 group-hover:border-orange-400" }
];

const ICON_PACK = [
  // Academics & Learning
  "BookOpenText", "Books", "Student", "GraduationCap", "ChalkboardTeacher", "Certificate", "Exam", "BookmarkSimple", "Notebook", "Pencil", "PenNib", "Newspaper", "Library", "Highlighter",
  // Tech & Science
  "Atom", "Code", "TerminalWindow", "Desktop", "Laptop", "DeviceMobile", "Cpu", "Database", "HardDrives", "Globe", "Robot", "RocketLaunch", "Lightning", "Cloud", "ShieldCheck", "Lock", "WifiHigh", "Bug", "CodeBlock", "Browser", "BracketsCurly", "GitBranch",
  // Business, Finance & Management
  "Briefcase", "Buildings", "ChartLineUp", "ChartBar", "PresentationChart", "Target", "Trophy", "CurrencyInr", "Coins", "Wallet", "Bank", "Handshake", "Scales", "TrendUp", "Stamp", "PiggyBank", "Storefront",
  // Medical & Health
  "Stethoscope", "Heart", "Heartbeat", "FirstAid", "Brain", "Pill", "Hospital", "Eyeglasses", "Pulse", "DNA",
  // Law, Civil Services & Society
  "Gavel", "Users", "UserCircle", "GlobeStand", "Megaphone", "Crown", "Detective", "Flag", "CourtHouse", "PoliceCar",
  // Creative, Design & Media
  "Palette", "PaintBrush", "Camera", "VideoCamera", "Microphone", "Headphones", "MusicNote", "FilmStrip", "Sparkle", "MagicWand", "Shapes", "Feather", "VectorTwo",
  // General & Communication
  "ChatCircleDots", "PhoneCall", "EnvelopeSimple", "Star", "Fire", "Tag", "Gift", "Compass", "MapPin", "Calendar", "Hourglass", "Alarm", "Translate", "PuzzlePiece"
];


const COLOR_PACK = [
  { name: "Indigo", class: "text-indigo-600 group-hover:border-indigo-400" },
  { name: "Teal", class: "text-teal-600 group-hover:border-teal-400" },
  { name: "Blue", class: "text-blue-500 group-hover:border-blue-400" },
  { name: "Orange", class: "text-orange-500 group-hover:border-orange-400" },
  { name: "Emerald", class: "text-emerald-500 group-hover:border-emerald-400" },
  { name: "Purple", class: "text-purple-500 group-hover:border-purple-400" },
  { name: "Pink", class: "text-pink-500 group-hover:border-pink-400" },
  { name: "Red", class: "text-red-500 group-hover:border-red-400" },
  { name: "Yellow", class: "text-yellow-500 group-hover:border-yellow-400" }
];

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showIconPackFor, setShowIconPackFor] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState("");
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleIconUpload(categoryId: string, file: File) {
    if (!file) return;
    try {
      setUploadingCategory(categoryId);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, customIconUrl: data.url, iconName: data.url } : c));
        toast.success("Custom icon uploaded and applied successfully!");
        setShowIconPackFor(null);
      } else {
        toast.error(data.error || "Failed to upload icon image");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Network error during icon upload");
    } finally {
      setUploadingCategory(null);
    }
  }

  async function fetchCategories() {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok && data.categories) {
        if (data.categories.length === 0) {
          setCategories([]);
        } else {
          setCategories(data.categories);
          // Auto-resolve alert if data is present and healthy
          fetch("/api/admin/alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "RESOLVE", alertId: "CATEGORIES_EMPTY" }),
          }).catch(() => {});
        }
      } else {
        const errorMsg = data.error || "Server responded with an error loading categories.";
        setFetchError(errorMsg);
        toast.error(errorMsg);
        // Log system alert in Admin Notifications
        fetch("/api/admin/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "LOG_ERROR",
            errorDetails: {
              title: "❌ Categories Sync Error",
              message: errorMsg,
              link: "/admin/categories",
            },
          }),
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error(err);
      const errText = err?.message || "Failed to connect to database or server.";
      setFetchError(errText);
      toast.error("Network or database connection issue loading categories.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCategories(newCategories: Category[]) {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: newCategories }),
      });
      if (res.ok) {
        toast.success("Categories updated successfully! 🏷️");
        setFetchError(null);
        // Automatically mark any open category system alert as resolved!
        fetch("/api/admin/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "RESOLVE", alertId: "CATEGORIES_EMPTY" }),
        }).catch(() => {});
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save categories.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save categories due to network/database error.");
    } finally {
      setSaving(false);
    }
  }

  const handleAdd = () => {
    setCategories([...categories, { id: createClientId(), name: "New Category", iconName: "Star", colorClass: COLOR_PACK[0].class }]);
  };

  const handleRemove = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleChange = (id: string, field: keyof Category, value: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCategories(categories);
  };

  if (loading) return <AdminLoader message="Loading categories..." />;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard Categories</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage the categories displayed on the student dashboard.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow"
        >
          + Add Category
        </button>
      </div>

      {(fetchError || (!loading && categories.length === 0)) && (
        <div className="p-6 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/30 dark:border-amber-500/40 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-3xl shrink-0">
              <PhosphorIcons.WarningCircle weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-amber-900 dark:text-amber-200">
                {fetchError ? "Connection / Sync Issue Detected" : "Dashboard Categories Are Currently Empty"}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                {fetchError || "Students are currently seeing a blank category selection on their dashboard. You can instantly restore our curated default categories (UPSC, NEET, Engineering, Startup) with 1 click."}
              </p>
              <div className="flex items-center gap-2 mt-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <PhosphorIcons.CheckCircle weight="fill" className="text-base" />
                <span>Admin notifications alerted & monitored. This notice will automatically vanish once fixed!</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => { setFetchError(null); fetchCategories(); }}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
            >
              <PhosphorIcons.ArrowClockwise weight="bold" />
              Retry Connection
            </button>
            <button
              type="button"
              onClick={async () => {
                setFetchError(null);
                setCategories(DEFAULT_CATEGORIES);
                await saveCategories(DEFAULT_CATEGORIES);
              }}
              className="flex-1 md:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <PhosphorIcons.Sparkle weight="fill" className="text-sm" />
              Restore Default Categories
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {categories.length === 0 && !loading && !fetchError && (
          <div className="text-center py-16 px-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500">
            <PhosphorIcons.Tag weight="duotone" className="text-5xl mx-auto mb-3 opacity-40" />
            <p className="font-bold text-lg">No Categories Created Yet</p>
            <p className="text-xs text-slate-400 mt-1">Click the + Add Category button above or restore defaults to get started.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = (PhosphorIcons as any)[category.iconName] || PhosphorIcons.Star;
            return (
              <div key={category.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative group flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => handleRemove(category.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition"
                >
                  <PhosphorIcons.Trash weight="fill" size={20} />
                </button>
                
                {/* Preview */}
                <div className="flex flex-col items-center gap-2 cursor-pointer pt-4 group" onClick={() => { setShowIconPackFor(showIconPackFor === category.id ? null : category.id); setIconSearch(""); }}>
                  <div className={`w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm transition-all overflow-hidden ${category.colorClass}`}>
                    {category.customIconUrl || category.iconName?.startsWith("http") || category.iconName?.startsWith("data:") ? (
                      <img src={category.customIconUrl || category.iconName} alt={category.name} className="w-10 h-10 object-contain p-1" />
                    ) : (
                      <Icon weight="fill" className="text-3xl" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-center leading-tight text-slate-700 dark:text-slate-300">{category.name}</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Name</label>
                    <input type="text" value={category.name} onChange={e => handleChange(category.id, "name", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Color Theme</label>
                    <select value={category.colorClass} onChange={e => handleChange(category.id, "colorClass", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold">
                      {COLOR_PACK.map(c => (
                        <option key={c.class} value={c.class}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1 flex justify-between items-center">
                      <span>Icon</span>
                      <button type="button" onClick={() => { setShowIconPackFor(showIconPackFor === category.id ? null : category.id); setIconSearch(""); }} className="text-brand-600 dark:text-brand-400 font-bold hover:underline">Change Icon</button>
                    </label>
                    
                    {showIconPackFor === category.id && (
                      <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/95 rounded-2xl border-2 border-brand-500/30 shadow-2xl space-y-4 z-20 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <PhosphorIcons.Palette weight="duotone" className="text-brand-600 dark:text-brand-400 text-base" />
                            Select or Upload Icon
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setShowIconPackFor(null)} 
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            Close ✕
                          </button>
                        </div>

                        {/* Custom Icon Upload Box */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center transition hover:border-brand-500">
                          <label className="cursor-pointer flex flex-col items-center justify-center gap-1 py-1 group">
                            <input
                              type="file"
                              accept="image/*,.svg,.ico"
                              className="hidden"
                              disabled={uploadingCategory === category.id}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleIconUpload(category.id, e.target.files[0]);
                                }
                              }}
                            />
                            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                              {uploadingCategory === category.id ? (
                                <PhosphorIcons.CircleNotch weight="bold" className="animate-spin text-xl" />
                              ) : (
                                <PhosphorIcons.UploadSimple weight="bold" className="text-xl" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition mt-1">
                              {uploadingCategory === category.id ? "Uploading custom image..." : "📁 Upload Custom Logo / Icon"}
                            </span>
                            <span className="text-[10px] text-slate-400">Supports PNG, SVG, WEBP, ICO</span>
                          </label>
                        </div>

                        {/* Search Box for 75+ Icons */}
                        <div className="space-y-2">
                          <div className="relative">
                            <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-2.5 text-slate-400 text-sm" />
                            <input
                              type="text"
                              placeholder="Search 75+ professional icons..."
                              value={iconSearch}
                              onChange={(e) => setIconSearch(e.target.value)}
                              className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-inner"
                            />
                            {iconSearch && (
                              <button
                                type="button"
                                onClick={() => setIconSearch("")}
                                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-6 gap-1.5 max-h-52 overflow-y-auto">
                            {ICON_PACK.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())).map(iconName => {
                              const PIcon = (PhosphorIcons as any)[iconName];
                              if (!PIcon) return null;
                              const isSelected = category.iconName === iconName && !category.customIconUrl;
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => {
                                    setCategories(prev => prev.map(c => c.id === category.id ? { ...c, iconName, customIconUrl: undefined } : c));
                                    setShowIconPackFor(null);
                                    setIconSearch("");
                                  }}
                                  className={`p-2 flex items-center justify-center rounded-lg transition-all ${
                                    isSelected 
                                      ? "bg-brand-600 text-white shadow-md shadow-brand-500/25 scale-105" 
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400"
                                  }`}
                                  title={iconName}
                                >
                                  <PIcon weight={isSelected ? "fill" : "duotone"} size={22} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-md hover:bg-brand-700 transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Categories"}
          </button>
        </div>
      </form>
    </div>
  );
}
