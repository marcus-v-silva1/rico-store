"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Seção que "prende" na tela e converte a rolagem vertical em deslocamento horizontal (computador).
 * No celular, ou para quem prefere menos movimento, vira um trilho de arrastar com scroll-snap.
 */
export function PinnedGallery({
  id,
  title,
  subtitle,
  items,
}: {
  id: string;
  title: string;
  subtitle: string;
  items: React.ReactNode[];
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  // Quanto o trilho precisa andar: largura total menos o que já cabe na tela
  useEffect(() => {
    const view = viewport.current;
    const strip = track.current;
    if (!view || !strip) return;
    const measure = () => setDistance(Math.max(0, strip.scrollWidth - view.clientWidth));
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    observer.observe(strip);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: wrapper, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  const heading = (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={`${id}-title`} className="heading text-2xl">
        {title}
      </h2>
      <p className="text-xs text-bone/70">{subtitle}</p>
    </div>
  );

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 bg-ink text-bone">
      {/* Computador: seção presa, rolagem vira deslocamento horizontal */}
      <div
        ref={wrapper}
        className="relative hidden lg:block motion-reduce:hidden"
        // altura = distância horizontal + uma tela, que é quanto o usuário rola enquanto a seção está presa
        style={{ height: `calc(100dvh + ${distance}px)` }}
      >
        <div className="sticky top-0 flex h-dvh flex-col justify-center gap-8 overflow-hidden">
          <div className="mx-auto w-full max-w-[88rem] px-(--gutter)">{heading}</div>
          <div ref={viewport} className="overflow-hidden">
            <motion.div
              ref={track}
              style={{ x }}
              className="flex w-max gap-4 px-[max(var(--gutter),calc((100vw-88rem)/2+var(--gutter)))] will-change-transform"
            >
              {items.map((item, i) => (
                <div key={i} className="w-[min(28rem,34vw)] shrink-0">
                  {item}
                </div>
              ))}
            </motion.div>
          </div>
          <div className="mx-auto w-full max-w-[88rem] px-(--gutter)" aria-hidden="true">
            <div className="h-px bg-smoke">
              <motion.div className="h-px origin-left bg-bone" style={{ scaleX: scrollYProgress }} />
            </div>
          </div>
        </div>
      </div>

      {/* Celular e movimento reduzido: trilho nativo */}
      <div className="mx-auto max-w-[88rem] px-(--gutter) py-14 lg:hidden motion-reduce:block">
        {heading}
        <ul className="rail mt-6">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
