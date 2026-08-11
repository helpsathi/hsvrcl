"use client";

import { useState, useMemo } from "react";
import Image from "next/image";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  shape?: "circle" | "rounded";
}

const SIZE_MAP = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
  "2xl": "w-20 h-20 text-2xl",
};

const BG_GRADIENTS = [
  "from-blue-600 to-indigo-600",
  "from-purple-600 to-pink-600",
  "from-emerald-600 to-teal-600",
  "from-amber-600 to-orange-600",
  "from-cyan-600 to-blue-600",
  "from-rose-600 to-pink-600",
];

export function UserAvatar({
  src,
  name,
  size = "md",
  className = "",
  shape = "circle",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const cleanName = (name || "User").trim();
  const initials = useMemo(() => {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (cleanName.slice(0, 2) || "U").toUpperCase();
  }, [cleanName]);

  const gradientClass = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % BG_GRADIENTS.length;
    return BG_GRADIENTS[index];
  }, [cleanName]);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const roundedClass = shape === "circle" ? "rounded-full" : "rounded-2xl";

  const hasValidImage = Boolean(src && !imgError && src.trim() !== "");

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden font-bold select-none border border-slate-200/80 dark:border-slate-700/80 shadow-xs ${sizeClass} ${roundedClass} ${className}`}
    >
      {hasValidImage ? (
        <img
          src={src!}
          alt={cleanName}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradientClass} text-white flex items-center justify-center font-extrabold tracking-tight`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
