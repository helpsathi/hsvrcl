"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from "framer-motion";

export function ScrollBasedVelocity({
  text,
  defaultVelocity = 5,
  className = "",
}: {
  text: string;
  defaultVelocity?: number;
  className?: string;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const x = useTransform(baseX, (v) => `${v}%`);

  const directionFactor = useRef<number>(1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * defaultVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);

    if (baseX.get() < -50) {
      baseX.set(0);
    } else if (baseX.get() > 0) {
      baseX.set(-50);
    }
  });

  return (
    <div className={`overflow-hidden m-0 whitespace-nowrap flex flex-nowrap ${className}`}>
      <motion.div className="font-bold flex whitespace-nowrap flex-nowrap" style={{ x }}>
        <span className="block mr-10">{text}</span>
        <span className="block mr-10">{text}</span>
        <span className="block mr-10">{text}</span>
        <span className="block mr-10">{text}</span>
      </motion.div>
    </div>
  );
}
