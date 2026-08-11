"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/providers/AuthProvider";
import { ArrowLeft, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Suspense } from "react";

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
      // Forcefully clear the zombie cookie in the browser to prevent Next.js client-side router loops
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
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <Link href="/" className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10">
        <ArrowLeft className="text-xl" />
      </Link>

      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-200 dark:border-slate-800 relative z-10 flex flex-col md:flex-row overflow-hidden animate-slide-up">
        
        {/* Left Side: Character & Speech Bubble */}
        <div className="w-full md:w-[45%] bg-slate-100/50 dark:bg-slate-800/30 p-8 md:p-12 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
          
          <div className="relative mb-8 mt-4 group">
            {/* Speech Bubble */}
            <div className="bg-white dark:bg-slate-700 px-6 py-4 rounded-3xl rounded-br-none shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-600 mb-6 transform group-hover:-translate-y-2 group-hover:rotate-2 transition-all duration-300 relative z-10">
              <p className="text-slate-800 dark:text-slate-100 font-bold text-[17px] leading-snug">
                "Hey future topper! 👋 <br/>Ready to study smart today?"
              </p>
              {/* Little triangle for speech bubble */}
              <div className="absolute -bottom-3 right-8 w-6 h-6 bg-white dark:bg-slate-700 border-b border-r border-slate-200 dark:border-slate-600 transform rotate-45 rounded-sm"></div>
            </div>

            {/* Character (Large Emoji) */}
            <div className="text-[120px] leading-none text-center transform group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
              🦉
            </div>
            
            {/* Glowing shadow under character */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-300 dark:bg-slate-950 rounded-[100%] blur-md -z-10 group-hover:w-20 transition-all duration-500"></div>
          </div>
          
          <div className="text-center mt-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Your mentor is waiting.</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Log in to jump right back into your roadmap and crush those goals.</p>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full md:w-[55%] p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          
          <div className="mb-12 text-center md:text-left">
            <div className="inline-block md:hidden mb-4">
              <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tighter">HelpSathi<span className="text-emerald-500">.</span></span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Log in</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Please verify your identity to continue.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-2">
              <WarningCircle weight="bold" className="text-lg shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col items-center justify-center space-y-4 w-full">
            {loading ? (
              <div className="w-full flex items-center justify-center py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">Authenticating...</span>
              </div>
            ) : (
              <div className="w-full [&>div]:w-full [&_iframe]:w-full flex justify-center">
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
          </div>

          <div className="mt-12 text-center md:text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              By logging in, you agree to our <br className="hidden md:block"/>
              <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
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
