"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE } from "./motion";

/**
 * Revela o bloco com uma faixa inclinada no ângulo do itálico da marca:
 * a faixa entra pela esquerda, cobre, e sai pela direita deixando o conteúdo.
 * É o gesto da Rico: use em títulos de seção e fotos de destaque, não em tudo.
 */
export function Wipe({
  children,
  className,
  tone = "ink",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Cor da faixa: `ink` sobre fundo claro, `bone` sobre o preto. */
  tone?: "ink" | "bone";
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn("relative", className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      <motion.div
        className="h-full"
        variants={{
          hidden: { opacity: 0 },
          shown: { opacity: 1, transition: { delay: reduce ? 0 : delay + 0.4, duration: 0 } },
        }}
      >
        {children}
      </motion.div>
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.span
          className={cn("absolute inset-y-0 -right-1/2 -left-1/2", tone === "ink" ? "bg-ink" : "bg-bone")}
          // Faixa com o dobro da largura: inclinada, ainda cobre as quinas de blocos altos.
          // O skew vai no próprio motion; a classe do Tailwind seria sobrescrita pelo transform do `x`.
          style={{ skewX: -12 }}
          variants={{
            hidden: { x: "-100%" },
            shown: {
              x: ["-100%", "0%", "0%", "100%"],
              transition: reduce ? { duration: 0 } : { delay, duration: 0.95, times: [0, 0.42, 0.5, 1], ease: EASE },
            },
          }}
        />
      </span>
    </motion.div>
  );
}
