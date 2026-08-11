"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl z-[100]">
      <div className="relative w-[320px] h-[220px] flex items-center justify-center">
        {/* Ambient Glow behind the constellation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-brand-500/20 dark:bg-brand-500/10 blur-[60px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        
        <svg width="320" height="220" viewBox="0 0 320 220" className="absolute inset-0 overflow-visible">
          {/* Main Primary Paths (Student -> Core -> Mentor) */}
          <motion.path
            d="M 60 110 C 90 60, 130 60, 160 60"
            fill="transparent"
            stroke="url(#gradientPathLeft)"
            strokeWidth="3.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
          <motion.path
            d="M 160 60 C 190 60, 230 60, 260 110"
            fill="transparent"
            stroke="url(#gradientPathRight)"
            strokeWidth="3.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.15, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />

          {/* Secondary Support Paths (Student -> Goal -> Mentor) */}
          <motion.path
            d="M 60 110 C 100 160, 130 160, 160 160"
            fill="transparent"
            stroke="url(#gradientPathLeftAlt)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
          <motion.path
            d="M 160 160 C 190 160, 220 160, 260 110"
            fill="transparent"
            stroke="url(#gradientPathRightAlt)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ duration: 1.5, delay: 0.45, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />

          {/* --- NODES --- */}
          
          {/* Node 1: Student (Indigo) */}
          <motion.circle
            cx="60"
            cy="110"
            r="7"
            className="fill-indigo-500 dark:fill-indigo-400 shadow-xl"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
          />
          <motion.circle
            cx="60"
            cy="110"
            r="16"
            className="fill-indigo-500/20"
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Node 2: Core/HelpSathi Platform (Brand) */}
          <motion.circle
            cx="160"
            cy="60"
            r="9"
            className="fill-brand-main dark:fill-brand-400 shadow-xl"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.5, delay: 0.15 }}
          />
          <motion.circle
            cx="160"
            cy="60"
            r="20"
            className="fill-brand-main/25"
            animate={{ scale: [1, 1.7, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, delay: 0.15, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Node 3: Mentor (Amber) */}
          <motion.circle
            cx="260"
            cy="110"
            r="7"
            className="fill-amber-500 dark:fill-amber-400 shadow-xl"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          <motion.circle
            cx="260"
            cy="110"
            r="16"
            className="fill-amber-500/20"
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, delay: 0.3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Node 4: The Shared Goal (Slate) */}
          <motion.circle
            cx="160"
            cy="160"
            r="5"
            className="fill-slate-400 dark:fill-slate-500"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.1, 1] }}
            transition={{ duration: 0.5, delay: 0.45 }}
          />
          <motion.circle
            cx="160"
            cy="160"
            r="10"
            className="fill-slate-400/20"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, delay: 0.45, repeat: Infinity, ease: "easeInOut" }}
          />

          <defs>
            {/* Gradients to make the paths pop and feel like data flowing */}
            <linearGradient id="gradientPathLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" /> {/* Indigo */}
              <stop offset="100%" stopColor="#10b981" /> {/* Emerald */}
            </linearGradient>
            <linearGradient id="gradientPathRight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" /> {/* Emerald */}
              <stop offset="100%" stopColor="#f59e0b" /> {/* Amber */}
            </linearGradient>
            
            <linearGradient id="gradientPathLeftAlt" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="gradientPathRightAlt" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        className="mt-6 flex flex-col items-center z-10"
      >
        <h3 className="text-[13px] font-black text-slate-900 dark:text-white tracking-[0.25em] uppercase drop-shadow-sm">
          Connecting
        </h3>
        <div className="flex items-center gap-1.5 mt-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: "0ms" }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" style={{ animationDelay: "150ms" }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: "300ms" }}></div>
        </div>
      </motion.div>
    </div>
  );
}
