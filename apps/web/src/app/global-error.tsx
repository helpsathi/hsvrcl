"use client";

import { useEffect } from "react";
import { WarningOctagon, ArrowCounterClockwise } from "@phosphor-icons/react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#0f172a] text-slate-100 font-sans min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
            <WarningOctagon weight="duotone" className="text-4xl" />
          </div> 
          
          <h1 className="text-2xl font-black tracking-tight mb-2">
            System Fault Experienced
          </h1>
          
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            A critical system exception was encountered at the application root level. We apologize for the interruption.
          </p>
          
          <button
            onClick={() => reset()}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ArrowCounterClockwise weight="bold" className="text-lg" />
            Reload Platform
          </button>
        </div>
      </body>
    </html>
  );
}
