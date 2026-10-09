"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useRef } from "react";

const BASE_SPEED = 1.3; // % da faixa por segundo
const wrap = (v: number) => (((v % 50) + 50) % 50) - 50; // mantém o deslocamento entre -50% e 0%

/** Faixa de marcas que corre na horizontal, acelera com a rolagem e inverte ao rolar para cima. */
export function Marquee({ items }: { items: readonly string[] }) {
  const reduce = useReducedMotion();
  const offset = useMotionValue(0);
  const x = useTransform(offset, (v) => `${wrap(v)}%`);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const direction = useRef(-1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const v = velocity.get();
    if (v > 40) direction.current = -1;
    else if (v < -40) direction.current = 1;
    const boost = 1 + Math.min(Math.abs(v) / 250, 6);
    offset.set(offset.get() + direction.current * BASE_SPEED * boost * (delta / 1000));
  });

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className="flex items-center">
          <span className="display text-[clamp(2rem,6vw,4.25rem)] leading-none whitespace-nowrap">{item}</span>
          <span className="display px-[0.5em] text-[clamp(2rem,6vw,4.25rem)] leading-none text-bone/30">/</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="overflow-hidden">
      <motion.div className="flex w-max will-change-transform" style={{ x }}>
        {row(false)}
        {row(true)}
      </motion.div>
    </div>
  );
}
