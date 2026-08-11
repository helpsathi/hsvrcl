"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/providers/AuthProvider";
import { ArrowLeft, WarningCircle, ShieldCheck } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";

const loadingMessages = [
  "Authenticating your credentials...",
  "Preparing your workspace...",
  "Loading your mentors...",
  "Almost there...",
  "Setting up the magic..."
];

function PremiumLoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-none flex flex-col items-center gap-8 animate-slide-up">
          
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[4px] border-emerald-500/20 border-t-emerald-500 animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-3 rounded-full border-[4px] border-teal-500/20 border-b-teal-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center">
              <span className="text-white font-black text-2xl tracking-tighter">H</span>
            </div>
          </div>
          
          <div className="h-6 flex items-center justify-center relative min-w-[280px]">
            {loadingMessages.map((msg, idx) => (
              <p 
                key={idx}
                className={`absolute w-full text-center text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  idx === messageIndex ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4 scale-95'
                }`}
              >
                {msg}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam === "session_expired") {
      setError("Your session has expired. Please log in again.");
      fetch("/api/auth/logout", { method: "POST" }).catch(console.error);
    } else if (errorParam === "unauthorized") {
      setError("You are not authorized to view that page.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user) {
      if (!user.profileComplete) {
        router.replace("/profile-setup");
      } else if (user.role === "ADMIN" || user.adminSubRole) {
        router.replace("/admin");
      } else if (user.role === "MENTOR") {
        router.replace("/mentor-dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return <PremiumLoadingScreen />;
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[140px] rounded-full pointer-events-none"></div>

      {/* Back button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-2xl transition-all z-20 shadow-xs"
        aria-label="Back to home"
      >
        <ArrowLeft className="text-xl" />
      </Link>

      {/* Main Single Centered Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 relative z-10 flex flex-col items-center animate-slide-up text-center">
        
        {/* Brand Logo */}
        <div className="mb-6">
          <BrandLogo href="/" size="lg" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 mb-8 leading-relaxed max-w-xs">
          Sign in to connect with your mentors and continue your learning.
        </p>

        {/* Error message banner */}
        {error && (
          <div className="w-full mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 text-left">
            <WarningCircle weight="bold" className="text-lg shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Action */}
        <div className="w-full space-y-4">
          {loading ? (
            <div className="w-full flex items-center justify-center py-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
              <span className="ml-3 text-slate-700 dark:text-slate-200 font-bold text-sm">Authenticating...</span>
            </div>
          ) : (
            <div className="w-full [&>div]:w-full [&_iframe]:w-full flex justify-center shadow-xs rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    setLoading(true);
                    setError("");
                    if (credentialResponse.credential) {
                      await login(credentialResponse.credential);
                    }
                  } catch (err: any) {
                    setError(err.message || "Failed to login");
                    setLoading(false);
                  }
                }}
                onError={() => {
                  setError("Google Login Failed");
                  setLoading(false);
                }}
                size="large"
                theme="outline"
                shape="rectangular"
              />
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-2">
            <ShieldCheck weight="fill" className="text-emerald-500 text-sm" />
            <span>Fast, 1-click Google Sign-in</span>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/80 w-full">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Privacy Policy</Link>.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}

