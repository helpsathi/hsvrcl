"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function cleanToastMessage(msg: string): string {
  if (!msg) return "An unexpected error occurred.";
  if (
    msg.includes("Transaction API error") ||
    msg.includes("expired transaction") ||
    msg.includes("timed out")
  ) {
    return "The database server was warming up. Please try again.";
  }
  if (msg.includes("Can't reach database") || msg.includes("P1001") || msg.includes("ECONNREFUSED")) {
    return "Database is temporarily reconnecting. Please wait a moment and try again.";
  }
  if (msg.includes("Unique constraint failed") || msg.includes("P2002")) {
    return "A record with this information already exists in the system.";
  }
  return msg;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((rawMessage: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const message = type === "error" ? cleanToastMessage(rawMessage) : rawMessage;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((message: string) => showToast(message, "success"), [showToast]);
  const error = useCallback((message: string) => showToast(message, "error"), [showToast]);
  const warning = useCallback((message: string) => showToast(message, "warning"), [showToast]);
  const info = useCallback((message: string) => showToast(message, "info"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      
      {/* Toast floating container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";
          const isInfo = toast.type === "info";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-xl border animate-in slide-in-from-bottom-5 duration-200 transition-all ${
                isSuccess
                  ? "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                  : isError
                  ? "bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                  : isWarning
                  ? "bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100"
                  : "bg-slate-900/95 dark:bg-slate-800/95 border-slate-700 text-white"
              }`}
            >
              <div className="shrink-0 mt-0.5 text-lg">
                {isSuccess && <CheckCircle weight="fill" className="text-emerald-600 dark:text-emerald-400" />}
                {isError && <XCircle weight="fill" className="text-rose-600 dark:text-rose-400" />}
                {isWarning && <WarningCircle weight="fill" className="text-amber-600 dark:text-amber-400" />}
                {isInfo && <Info weight="fill" className="text-blue-400" />}
              </div>

              <div className="flex-1 min-w-0 text-xs sm:text-sm font-bold leading-snug">
                {toast.message}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X weight="bold" className="text-sm" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showToast: (m: string) => console.log("Toast:", m),
      success: (m: string) => console.log("Success:", m),
      error: (m: string) => console.error("Error:", m),
      warning: (m: string) => console.warn("Warning:", m),
      info: (m: string) => console.info("Info:", m),
    };
  }
  return context;
}
