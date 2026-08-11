"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Bell, ShieldCheck, ChatCircleDots, CalendarCheck, Wallet, Sliders, Check } from "@phosphor-icons/react";

export function NotificationPreferences() {
  const toast = useToast();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [antiFloodEnabled, setAntiFloodEnabled] = useState(true);
  const [muteChats, setMuteChats] = useState(false);
  const [muteBookings, setMuteBookings] = useState(false);
  const [mutePayments, setMutePayments] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPushEnabled("Notification" in window && Notification.permission === "granted");
      setAntiFloodEnabled(localStorage.getItem("anti_flood_enabled") !== "false");
      setMuteChats(localStorage.getItem("mute_chat_notifs") === "true");
      setMuteBookings(localStorage.getItem("mute_booking_notifs") === "true");
      setMutePayments(localStorage.getItem("mute_payment_notifs") === "true");
    }
  }, []);

  const handleTogglePush = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        setPushEnabled(perm === "granted");
        if (perm === "granted") {
          toast.success("Desktop & mobile push alerts enabled! 🔔");
        } else {
          toast.warning("Push permission was not granted. Check browser settings.");
        }
      } else {
        toast.info("Push notifications are already active for this browser. 🔔");
      }
    } else {
      toast.error("Push notifications are not supported in this browser.");
    }
  };

  const saveSetting = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, String(val));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-main/10 border border-brand-main/20 flex items-center justify-center text-brand-main">
            <Sliders weight="duotone" className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Notification & Anti-Flood Preferences</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Customize how and when you receive real-time updates across your devices</p>
          </div>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-full animate-fade-in">
            <Check weight="bold" className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Master Push Control */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-start gap-3.5">
            <Bell weight="fill" className="w-5 h-5 text-brand-main mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">Device & Desktop Push Alerts</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Receive operating system notifications when your HelpSathi tab is closed or backgrounded.
              </p>
            </div>
          </div>
          <button
            onClick={handleTogglePush}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition shadow-sm shrink-0 ${
              pushEnabled
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default"
                : "bg-brand-main hover:bg-brand-main/90 text-white shadow-brand-main/20"
            }`}
          >
            {pushEnabled ? "Enabled ✓" : "Turn On 🔔"}
          </button>
        </div>

        {/* Anti-Flood Smart Batching */}
        <div className="flex items-center justify-between p-4 bg-orange-500/5 dark:bg-orange-500/10 rounded-2xl border border-orange-500/20">
          <div className="flex items-start gap-3.5">
            <ShieldCheck weight="fill" className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-900 dark:text-white">Anti-Flood & Smart Batching Protection</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500 text-white uppercase tracking-wider">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Automatically consolidates rapid follow-up messages and mass proposal acceptances into clean summary digests to prevent spamming your phone.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={antiFloodEnabled}
              onChange={(e) => saveSetting("anti_flood_enabled", e.target.checked, setAntiFloodEnabled)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {/* Category Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ChatCircleDots weight="fill" className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Chat Messages</span>
            </div>
            <button
              onClick={() => saveSetting("mute_chat_notifs", !muteChats, setMuteChats)}
              className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition ${
                !muteChats ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
              }`}
            >
              {!muteChats ? "Active" : "Muted"}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarCheck weight="fill" className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Call Bookings</span>
            </div>
            <button
              onClick={() => saveSetting("mute_booking_notifs", !muteBookings, setMuteBookings)}
              className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition ${
                !muteBookings ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
              }`}
            >
              {!muteBookings ? "Active" : "Muted"}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wallet weight="fill" className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Payments & Payouts</span>
            </div>
            <button
              onClick={() => saveSetting("mute_payment_notifs", !mutePayments, setMutePayments)}
              className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition ${
                !mutePayments ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
              }`}
            >
              {!mutePayments ? "Active" : "Muted"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
