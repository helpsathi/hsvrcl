"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Camera, Crown, Wallet, Bell, CaretRight, SignOut, ShieldCheck, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading, updateUser, logout } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const upRes = await fetch("/api/upload", { method: "POST", body: formData });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || "Image upload failed");

      const newUrl = upData.url;
      const patchRes = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: newUrl })
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchData.error || "Profile update failed");

      updateUser({ avatar: newUrl });
      setMessage("✅ Profile photo updated successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setMessage(""), 5000);
    }
  };

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch("/api/wallet");
        const data = await res.json();
        if (res.ok) setBalance(data.wallet.balance);
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchWallet();
  }, [user]);

  if (loading) {
    const { ProfileSkeleton } = require("@/components/ui/Skeleton");
    return <ProfileSkeleton />;
  }

  return (
    <div className="w-full min-h-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-12 bg-transparent transition-colors animate-in fade-in">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
        
        {/* Header Profile Section */}
        <div className="p-8 sm:p-10 flex flex-col items-center bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 text-center transition-colors relative">
          <div className="relative mb-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleAvatarUpload} 
              className="hidden" 
            />
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user?.name || "User Avatar"}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=0D8ABC&color=fff`; }}
                className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 object-cover shadow-xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl text-4xl font-bold">
                <UserCircle weight="fill" className="w-24 h-24" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-slate-900/70 rounded-full flex flex-col items-center justify-center backdrop-blur-2xs border-4 border-white dark:border-slate-800">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-1"></div>
                <span className="text-[9px] font-extrabold text-white tracking-widest uppercase">Saving</span>
              </div>
            )}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Change Avatar"
              className="absolute bottom-1 right-1 w-9 h-9 bg-brand-main dark:bg-brand-500 text-brand-950 dark:text-slate-950 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 hover:scale-110 active:scale-95 transition-all font-bold disabled:opacity-50 cursor-pointer z-10"
            >
              <Camera weight="bold" className="text-lg" />
            </button>
          </div>

          {message && (
            <div className="mb-3 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 animate-in fade-in shadow-xs">
              {message}
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {user?.name || "My Profile"}
            <span title="Verified Account" className="inline-flex">
              <ShieldCheck weight="fill" className="text-brand-500 text-2xl" />
            </span>
          </h2>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>

          <div className="mt-4">
            <span className="bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 px-4 py-1.5 rounded-full text-xs font-black border border-brand-200 dark:border-brand-400/40 uppercase tracking-widest shadow-xs">
              {user?.role || "STUDENT"}
            </span>
          </div>
        </div>

        {/* Menu Options Section */}
        <div className="p-6 sm:p-8 space-y-3.5">
          <Link 
            href="/my-mentors" 
            className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-200/50 dark:border-indigo-800/40">
                <Crown weight="fill" className="text-2xl" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">Active Subscriptions & Mentors</h4>
                <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400">View your connected mentors and active monthly passes</p>
              </div>
            </div>
            <CaretRight weight="bold" className="text-slate-400 dark:text-slate-500 text-xl" />
          </Link>
          
          <Link 
            href="/wallet" 
            className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-green-200/50 dark:border-green-800/40">
                <Wallet weight="fill" className="text-2xl" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">Wallet & Transactions</h4>
                <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Current Balance: ₹{balance.toFixed(2)}</p>
              </div>
            </div>
            <CaretRight weight="bold" className="text-slate-400 dark:text-slate-500 text-xl" />
          </Link>

          <Link 
            href="/notifications?view=settings"
            className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-slate-200 dark:border-slate-700/60">
                <Bell weight="fill" className="text-2xl" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">Push Notifications & Alerts</h4>
                <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400">Configure consultation reminders and updates</p>
              </div>
            </div>
            <CaretRight weight="bold" className="text-slate-400 dark:text-slate-500 text-xl" />
          </Link>

          {user?.role === "STUDENT" && (
            <Link 
              href="/onboarding/mentor" 
              className="bg-gradient-to-r from-brand-500/15 via-amber-500/10 to-transparent dark:from-brand-500/20 dark:to-emerald-500/10 rounded-2xl p-4 sm:p-6 border-2 border-brand-500/40 dark:border-brand-400/40 flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all mt-6 shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-main dark:bg-brand-500 text-brand-950 dark:text-slate-950 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                  <Crown weight="bold" className="text-2xl" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">Apply as Mentor</h4>
                  <p className="text-xs font-extrabold text-brand-700 dark:text-brand-300">Monetize your expertise and mentor students globally</p>
                </div>
              </div>
              <CaretRight weight="bold" className="text-brand-700 dark:text-brand-400 text-xl" />
            </Link>
          )}

          <button 
            onClick={logout}
            className="w-full bg-danger/10 dark:bg-red-950/40 text-danger dark:text-red-400 hover:bg-danger dark:hover:bg-red-600 hover:text-white dark:hover:text-white rounded-2xl p-4 sm:p-5 border border-danger/20 dark:border-red-800/60 flex items-center justify-center gap-3 cursor-pointer transition-all mt-8 font-black text-base shadow-sm active:scale-[0.99]"
          >
            <SignOut weight="bold" className="text-2xl" />
            Sign Out of HelpSathi
          </button>
        </div>
      </div>
    </div>
  );
}
