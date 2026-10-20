"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Garment } from "./garment";
import { EASE } from "./motion";
import { Photo } from "./photo";
import { LinkButton } from "./ui/button";

/** Uma linha do título sobe de dentro de uma máscara. */
function Line({ children, delay, outline }: { children: string; delay: number; outline?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="block overflow-hidden pr-[0.1em] pb-[0.06em]">
      <motion.span
        className={outline ? "outline-text block" : "block"}
        initial={reduce ? false : { y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

const fade = (delay: number, reduce: boolean | null) => ({
  initial: reduce ? false : { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay },
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Os dois quadros andam em sentidos opostos ao rolar: profundidade sem imagem pesada
  const up = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const down = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const spin = useTransform(scrollYProgress, [0, 1], [0, -6]);

  return (
    <section ref={ref} className="overflow-hidden bg-ink text-bone" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-[88rem] gap-10 px-(--gutter) py-10 lg:min-h-[34rem] lg:grid-cols-[1.05fr_1fr] lg:gap-6">
        <div className="flex flex-col justify-between gap-12">
          <h1 id="hero-title" className="display text-[clamp(2.5rem,11.5vw,4.5rem)] lg:text-[clamp(3.5rem,6vw,6.5rem)]">
            <Line delay={0.1}>Street</Line>
            <Line delay={0.22} outline>
              Casual
            </Line>
            <Line delay={0.34} outline>
              Trabalho
            </Line>
          </h1>
          <div className="max-w-lg">
            <motion.p className="label text-bone/60" {...fade(0.7, reduce)}>
              Streetwear / original vibe / sempre atual
            </motion.p>
            <motion.h2 className="heading mt-4 text-[clamp(1.5rem,3vw,2.125rem)]" {...fade(0.8, reduce)}>
              As marcas que movem o streetwear, agora em Belém.
            </motion.h2>
            <motion.p className="mt-3 text-sm text-bone/70" {...fade(0.9, reduce)}>
              Moletons, jaquetas, cargo e sneakers com qualidade e autenticidade.
            </motion.p>
            <motion.div className="mt-6 flex flex-wrap gap-3" {...fade(1, reduce)}>
              <LinkButton href="/colecao/street" variant="light">
                Ver coleção Street
              </LinkButton>
              <a
                href="#lookbook"
                className="inline-flex h-11 items-center justify-center border border-bone/70 px-5 text-[0.8125rem] font-semibold hover:border-bone hover:bg-bone/10"
              >
                Ver looks
              </a>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div style={reduce ? undefined : { y: up }} className="aspect-[3/5] lg:aspect-auto">
            <Photo slot="Hero 01" className="size-full" priority>
              <motion.div style={reduce ? undefined : { rotate: spin }} className="grid size-full place-items-center">
                <Garment kind="jacket" color="#262626" className="size-[78%]" />
              </motion.div>
            </Photo>
          </motion.div>
          <motion.div style={reduce ? undefined : { y: down }} className="aspect-[3/5] lg:aspect-auto">
            <Photo slot="Hero 02" className="size-full" priority>
              <motion.div style={reduce ? undefined : { rotate: spin }} className="grid size-full place-items-center">
                <Garment kind="hoodie" color="#8f8f8a" className="size-[78%]" />
              </motion.div>
            </Photo>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
