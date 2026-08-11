"use client";

import { useState, useEffect } from "react";
import { ArrowLineDown, DeviceMobile, ShareNetwork, PlusSquare, CheckCircle, X, ArrowSquareOut } from "@phosphor-icons/react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallAppButtonProps {
  variant?: "navbar" | "hero" | "card" | "sidebar" | "drawer" | "menu";
  className?: string;
}

// Module-level early capture — picks up the event before React hydrates
let _modulePrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _modulePrompt = e as BeforeInstallPromptEvent;
    (window as any).deferredPwaPrompt = _modulePrompt;
    window.dispatchEvent(new CustomEvent("pwa-prompt-available"));
  });
}

export function InstallAppButton({ variant = "navbar", className }: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    if (standalone) {
      setIsStandalone(true);
      return;
    }

    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream && !standalone;
    if (isIOSDevice) {
      setIsIOS(true);
    }

    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      (window as any).deferredPwaPrompt = promptEvent;
    };

    const handleGlobalPromptAvailable = () => {
      if ((window as any).deferredPwaPrompt) {
        setDeferredPrompt((window as any).deferredPwaPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("pwa-prompt-available", handleGlobalPromptAvailable);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pwa-installed", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("pwa-prompt-available", handleGlobalPromptAvailable);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pwa-installed", handleAppInstalled);
    };
  }, []);

  if (isStandalone) {
    if (variant === "navbar" || variant === "sidebar" || variant === "drawer" || variant === "menu" || variant === "card") return null;
    return (
      <a
        href="/dashboard"
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all hover:bg-emerald-500/25 text-sm"
      >
        <CheckCircle weight="fill" className="w-5 h-5" />
        <span>App Installed (Open Dashboard)</span>
      </a>
    );
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    const activePrompt = _modulePrompt || deferredPrompt || (window as any).deferredPwaPrompt;
    if (activePrompt) {
      await activePrompt.prompt();
      const { outcome } = await activePrompt.userChoice;
      if (outcome === "accepted") {
        setIsStandalone(true);
        _modulePrompt = null;
        delete (window as any).deferredPwaPrompt;
      }
      setDeferredPrompt(null);
    } else {
      // No browser prompt available yet — show a clean guide modal instead of alert()
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === "navbar" && (
        <button
          suppressHydrationWarning
          onClick={handleInstallClick}
          className={className || "hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-brand-main/15 hover:bg-brand-main/25 dark:bg-brand-500/20 dark:hover:bg-brand-500/30 text-brand-800 dark:text-brand-300 border border-brand-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xs shrink-0"}
          title="Install HelpSathi Free App"
        >
          <DeviceMobile weight="bold" className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <span className="whitespace-nowrap">Install App</span>
        </button>
      )}

      {variant === "hero" && (
        <button
          suppressHydrationWarning
          onClick={handleInstallClick}
          className={className || "inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-md hover:shadow-lg transition-all text-center group"}
        >
          <DeviceMobile weight="bold" className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
          <span suppressHydrationWarning>Install Free App</span>
        </button>
      )}

      {(variant === "sidebar" || variant === "menu") && (
        <button
          suppressHydrationWarning
          onClick={handleInstallClick}
          className={className || "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-brand-700 dark:text-brand-300 bg-brand-50/80 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-all shadow-2xs text-left cursor-pointer my-1"}
          title="Install HelpSathi Free App"
        >
          <DeviceMobile weight="fill" className="text-xl text-brand-600 dark:text-brand-400 shrink-0" />
          <span>Install Free App</span>
        </button>
      )}

      {(variant === "drawer" || variant === "card") && (
        <button
          suppressHydrationWarning
          onClick={handleInstallClick}
          className={className || "w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-brand-main/15 via-brand-main/20 to-brand-500/15 dark:from-brand-900/40 dark:to-brand-800/30 border border-brand-500/30 text-slate-900 dark:text-white font-extrabold text-sm transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] text-left cursor-pointer"}
          title="Install HelpSathi Free App"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-main text-white flex items-center justify-center shrink-0 shadow-md">
              <DeviceMobile weight="bold" className="text-xl" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Install HelpSathi App</div>
              <div className="text-[11px] font-medium text-brand-700 dark:text-brand-300">Fast 1-click home screen access</div>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-brand-main text-white text-xs font-black shadow-xs shrink-0">
            Install
          </span>
        </button>
      )}

      {/* iOS Instructional Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
            <button onClick={() => setShowIOSModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X weight="bold" className="w-4 h-4" />
            </button>
            <img src="/icon-192x192.png" alt="HelpSathi Logo" className="w-16 h-16 mx-auto rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 bg-white" />
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mt-4">Install HelpSathi on iOS</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Add HelpSathi directly to your iPhone or iPad home screen for fast load times and full-screen guidance!
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 my-4 text-left text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                <span className="w-6 h-6 rounded-full bg-brand-main text-white flex items-center justify-center font-black text-xs shrink-0">1</span>
                <span>Tap the <ShareNetwork className="inline w-4 h-4 text-blue-500 mx-0.5" /> <b>Share</b> button in Safari menu below.</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                <span className="w-6 h-6 rounded-full bg-brand-main text-white flex items-center justify-center font-black text-xs shrink-0">2</span>
                <span>Scroll down and select <PlusSquare className="inline w-4 h-4 text-emerald-500 mx-0.5" /> <b>Add to Home Screen</b>.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}

      {/* Desktop/Android guide modal — shown when browser hasn't triggered install prompt yet */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X weight="bold" className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img src="/icon-192x192.png" alt="HelpSathi" className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Install HelpSathi</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Add to your device for instant access</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Chrome / Edge */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
                <p className="font-black text-slate-800 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                  <span className="text-base">🌐</span> Chrome / Edge (Desktop &amp; Android)
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                  <li>Click the <b>⋮</b> menu at the top-right of the browser.</li>
                  <li>Select <b>&quot;Install HelpSathi&quot;</b> or <b>&quot;Add to Home Screen&quot;</b>.</li>
                </ol>
              </div>

              {/* Safari (desktop) */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5">
                <p className="font-black text-slate-800 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                  <span className="text-base">🧭</span> Safari (iPhone / iPad)
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                  <li>Tap <ShareNetwork className="inline w-3.5 h-3.5 text-blue-500" /> <b>Share</b> in the bottom bar.</li>
                  <li>Select <PlusSquare className="inline w-3.5 h-3.5 text-emerald-500" /> <b>Add to Home Screen</b>.</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full mt-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

