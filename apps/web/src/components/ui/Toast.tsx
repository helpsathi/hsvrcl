"use client";

import React, { useState, useCallback } from "react";
import { CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

export interface ToastMessage {
  id: number;
  text: string;
  type: "success" | "error" | "info";
}

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

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((rawText: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now() + Math.random();
    const text = type === "error" ? cleanToastMessage(rawText) : rawText;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-3 transition-all transform duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950/95 text-emerald-200 border-emerald-500/40 shadow-emerald-500/10"
              : toast.type === "error"
              ? "bg-rose-950/95 text-rose-200 border-rose-500/40 shadow-rose-500/10"
              : "bg-slate-900/95 text-slate-200 border-slate-700 shadow-slate-900/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle weight="fill" className="text-2xl text-emerald-400 shrink-0" />
          ) : toast.type === "error" ? (
            <WarningCircle weight="fill" className="text-2xl text-rose-400 shrink-0" />
          ) : (
            <Info weight="fill" className="text-2xl text-blue-400 shrink-0" />
          )}
          <div className="flex-1 text-sm font-extrabold tracking-tight text-white">{toast.text}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <X weight="bold" />
          </button>
        </div>
      ))}
    </div>
  );

  return { addToast, ToastContainer };
}
