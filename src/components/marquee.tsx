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
import { cn } from "@/lib/utils";

const BASE_SPEED = 2.2; // % da faixa (duas cópias) por segundo
const wrap = (v: number) => (((v % 50) + 50) % 50) - 50; // mantém o deslocamento entre -50% e 0%

function Row({
  items,
  direction,
  outline,
  velocity,
}: {
  items: readonly string[];
  /** -1 corre para a esquerda, 1 para a direita. */
  direction: 1 | -1;
  outline?: boolean;
  velocity: { get: () => number };
}) {
  const reduce = useReducedMotion();
  const offset = useMotionValue(0);
  const x = useTransform(offset, (v) => `${wrap(v)}%`);
  const hovered = useRef(false);
  const sign = useRef<1 | -1>(direction);

  useAnimationFrame((_, delta) => {
    if (reduce || hovered.current) return;
    const v = velocity.get();
    // Rolar para baixo mantém o sentido natural da fileira; rolar para cima inverte
    if (v > 40) sign.current = direction;
    else if (v < -40) sign.current = (direction * -1) as 1 | -1;
    const boost = 1 + Math.min(Math.abs(v) / 250, 6);
    offset.set(offset.get() + sign.current * BASE_SPEED * boost * (delta / 1000));
  });

  const copy = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className="flex items-center">
          <span
            className={cn(
              "display text-[clamp(2rem,6vw,4.25rem)] leading-none whitespace-nowrap",
              outline && "outline-text",
            )}
          >
            {item}
          </span>
          <span className="display px-[0.5em] text-[clamp(2rem,6vw,4.25rem)] leading-none text-bone/30">/</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="overflow-hidden"
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
    >
      <motion.div className="flex w-max will-change-transform" style={{ x }}>
        {copy(false)}
        {copy(true)}
      </motion.div>
    </div>
  );
}

/**
 * Carrossel infinito com o nome das marcas: duas fileiras em sentidos opostos.
 * Acelera com a rolagem, inverte ao rolar para cima e pausa com o mouse em cima.
 */
export function Marquee({ items }: { items: readonly string[] }) {
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const reversed = [...items].reverse();

  return (
    <div className="space-y-3" role="group" aria-label={`Marcas na loja: ${items.join(", ")}`}>
      <Row items={items} direction={-1} velocity={velocity} />
      <Row items={reversed} direction={1} outline velocity={velocity} />
    </div>
  );
}
