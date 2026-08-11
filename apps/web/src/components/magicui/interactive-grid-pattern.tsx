"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function InteractiveGridPattern({
  className = "",
  squares = 50,
}: {
  className?: string;
  squares?: number;
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div 
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.4) 0%, transparent 20%), linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
          transition: "background-image 0.1s ease",
        }}
      />
    </div>
  );
}
