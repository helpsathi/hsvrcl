"use client";

import { useGoogleLogin } from "@react-oauth/google";
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
  const [testLoginEnabled, setTestLoginEnabled] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPassword, setTestPassword] = useState("");

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError("");
        await login(tokenResponse.access_token);
      } catch (err: any) {
        setError(err.message || "Failed to login");
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google Login Failed");
      setLoading(false);
    }
  });

  useEffect(() => {
    fetch("/api/auth/test-login").then(res => res.json()).then(data => {
      if (data.enabled) setTestLoginEnabled(true);
    }).catch(() => {});
  }, []);

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: testPassword })
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
      }
    } catch (err: any) {
      setError("Network error");
      setLoading(false);
    }
  };

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
            <button
              onClick={() => googleLogin()}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-slate-700 dark:text-slate-200 font-bold text-[15px]">Sign in with Google</span>
            </button>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-2">
            <ShieldCheck weight="fill" className="text-emerald-500 text-sm" />
            <span>Fast, 1-click Google Sign-in</span>
          </div>
        </div>

        {testLoginEnabled && (
          <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest text-center">Test Access</p>
            <form onSubmit={handleTestLogin} className="space-y-3">
              <input 
                type="email" 
                placeholder="Email" 
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                required
              />
              <input 
                type="password" 
                placeholder="Password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                required
              />
              <button 
                type="submit" 
                disabled={loading || !testEmail || !testPassword}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-xl text-sm font-bold shadow-md shadow-slate-200 dark:shadow-none transition-all disabled:opacity-50 disabled:scale-100 active:scale-[0.98]"
              >
                Login as Test User
              </button>
            </form>
          </div>
        )}

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

