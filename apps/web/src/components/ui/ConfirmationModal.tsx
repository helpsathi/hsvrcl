"use client";

import React from "react";
import { WarningCircle, X, Trash, Check } from "@phosphor-icons/react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  loading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false,
  loading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger 
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
                : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
            }`}>
              {isDanger ? <Trash weight="duotone" className="text-2xl" /> : <WarningCircle weight="duotone" className="text-2xl" />}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors"
            >
              <X weight="bold" className="text-base" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                isDanger
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/20"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : isDanger ? (
                <Trash weight="bold" />
              ) : (
                <Check weight="bold" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
