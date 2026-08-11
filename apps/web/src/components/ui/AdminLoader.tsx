"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { motion } from "framer-motion";

interface AdminLoaderProps {
  message?: string;
}

export function AdminLoader({ message = "Loading data..." }: AdminLoaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center p-12 text-slate-700 dark:text-slate-300"
    >
      <div className="relative flex items-center justify-center mb-5">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-14 h-14 bg-brand-500/20 rounded-full"
        />
        <CircleNotch weight="bold" className="text-4xl text-brand-600 animate-spin relative z-10" />
      </div>
      <motion.p 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-bold tracking-wide"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
