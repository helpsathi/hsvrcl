"use client";

import { useState, useEffect } from "react";
import { X, Download, Zap, Bell, ShieldCheck, Share2, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Module-level variable to capture the event as soon as it fires
let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [snoozed, setSnoozed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 0. Register Service Worker for offline capability & Web Push
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("HelpSathi Service Worker active scope:", reg.scope))
        .catch((err) => console.error("SW Registration failed:", err));
    }

    // 1. Check if user is already running inside an installed standalone PWA app
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 2. Check dismissal flag ("Add Later" snoozed for 14 days)
    const dismissedUntil = localStorage.getItem("pwa_dismissed_until");
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setSnoozed(true);
      return;
    }

    // 3. Check for iOS device Safari (where beforeinstallprompt is not supported)
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream && !isStandalone;
    if (isIOSDevice) {
      setIsIOS(true);
      const iosTimer = setTimeout(() => {
        const checkDismissed = localStorage.getItem("pwa_dismissed_until");
        if (checkDismissed && Number(checkDismissed) > Date.now()) return;
        setShowPrompt(true);
      }, 8000);
      return () => clearTimeout(iosTimer);
    }

    // 4. Trigger prompt for Chrome/Edge/Android
    const checkAndShow = () => {
      const checkDismissed = localStorage.getItem("pwa_dismissed_until");
      if (deferredPrompt && (!checkDismissed || Number(checkDismissed) <= Date.now())) {
        setShowPrompt(true);
      }
    };

    const timer = setTimeout(checkAndShow, 8000);

    // 5. Listen for successful app installation
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      deferredPrompt = null;
      window.dispatchEvent(new CustomEvent("pwa-installed"));
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [snoozed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setShowPrompt(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    deferredPrompt = null;
  };

  const handleAddLater = () => {
    setShowPrompt(false);
    setSnoozed(true);
    // Snooze for 14 days
    localStorage.setItem("pwa_dismissed_until", (Date.now() + 14 * 86400000).toString());
  };

  if (installed || snoozed || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:w-[380px] pointer-events-none animate-in slide-in-from-bottom-5 duration-400">
      <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all">
        {/* Decorative theme accent */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-28 h-28 bg-brand-main/15 dark:bg-brand-main/20 rounded-full blur-xl pointer-events-none" />

        <button
          onClick={handleAddLater}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          aria-label="Close install dialog"
          title="Add Later"
        >
          <X weight="bold" className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <img
            src="/icon-192x192.png"
            alt="HelpSathi App Icon"
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-700/60 object-cover shrink-0 bg-white"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate">
                Install HelpSathi
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shrink-0">
                Free App
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
              Install HelpSathi for faster 1-on-1 mentorship access and offline support!
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-1.5 my-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300 font-bold">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Offline Access</span>
          </div>
          <div className="flex items-center gap-1">
            <Bell className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Instant Alerts</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">1-Click Tap</span>
          </div>
        </div>

        {/* Action Controls */}
        {isIOS ? (
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 text-[11px] text-slate-700 dark:text-slate-200">
            <p className="font-bold flex items-center gap-1.5 text-brand-main">
              <span>📲 How to Install on iOS Safari:</span>
            </p>
            <ol className="mt-1.5 space-y-1 text-slate-600 dark:text-slate-300 list-decimal list-inside font-medium">
              <li>
                Tap <span className="inline-flex items-center font-bold text-slate-900 dark:text-white"><Share2 className="inline w-3 h-3 mx-0.5" /> Share</span> in Safari menu.
              </li>
              <li>
                Select <span className="inline-flex items-center font-bold text-slate-900 dark:text-white"><PlusSquare className="inline w-3 h-3 mx-0.5 text-emerald-500" /> Add to Home Screen</span>.
              </li>
            </ol>
            <button
              onClick={handleAddLater}
              className="w-full mt-2.5 py-1.5 text-center text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Add Later
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 active:scale-[0.98] text-white dark:text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleAddLater}
              className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors shrink-0"
            >
              Add Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
