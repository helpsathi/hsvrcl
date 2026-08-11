"use client";

import { motion } from "framer-motion";

export function TextAnimate({
  text,
  className = "",
  delay = 0,
  by = "word",
}: {
  text: string;
  className?: string;
  delay?: number;
  by?: "word" | "character";
}) {
  if (by === "character") {
    const words = text.split(" ");
    let globalCharIndex = 0;

    return (
      <span className={`inline max-w-full break-words ${className}`}>
        {words.map((word, wordIdx) => {
          const charSpans = word.split("").map((char) => {
            const currentIndex = globalCharIndex;
            globalCharIndex++;
            return (
              <motion.span
                key={currentIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: delay + currentIndex * 0.008,
                  ease: [0.2, 0.65, 0.3, 0.9],
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            );
          });

          // Increment global index for the space character
          globalCharIndex++;

          return (
            <span key={wordIdx} className="inline-block whitespace-nowrap mr-[0.2em]">
              {charSpans}
            </span>
          );
        })}
      </span>
    );
  }

  const words = text.split(" ");

  return (
    <span className={`inline ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: delay + index * 0.03,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
          className="inline-block mr-[0.25em] whitespace-nowrap"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
