"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";

/** Rolagem suave (Lenis) na página inteira. Quem prefere menos movimento fica com a rolagem nativa. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: { offset: -64 }, allowNestedScroll: true }}>
      {children}
    </ReactLenis>
  );
}
