"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { EASE } from "./motion";

/** Cabeçalho que some ao rolar para baixo e volta ao rolar para cima. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(y > previous && y > 160);
  });

  return (
    <motion.header
      className="sticky top-0 z-40 bg-ink text-bone"
      // viewTransitionName ancora o cabeçalho: só o conteúdo desliza entre páginas.
      style={{ viewTransitionName: "site-header" }}
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.header>
  );
}
