"use client";

import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  badge?: string;
  showBadge?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrandLogo({
  href = "/",
  badge,
  showBadge = true,
  size = "md",
  className = "",
}: BrandLogoProps) {
  const textSizes = {
    sm: "text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl",
  };

  const iconSizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  const content = (
    <div className={`flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.01] ${className}`}>
      <img 
        src="/logo.png" 
        alt="Help Sathi Logo" 
        className={`${iconSizes[size]} w-auto object-contain drop-shadow-sm`} 
      />
      <span className={`font-black ${textSizes[size]} text-slate-900 dark:text-white tracking-tight leading-none`}>
        Help<span className="text-blue-600 dark:text-blue-400">Sathi</span>
      </span>
      {showBadge && badge && (
        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 tracking-wider">
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-flex items-center">{content}</Link>;
  }

  return content;
}
