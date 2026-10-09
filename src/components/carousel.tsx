"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const arrow =
  "grid size-10 place-items-center border border-ink/80 transition-colors hover:bg-ink hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-30";

/** Carrossel de arrastar com setas e barra de progresso. Mostra 4 peças no computador e quase 1,5 no celular. */
export function Carousel({ items, label }: { items: React.ReactNode[]; label: string }) {
  const [viewport, api] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [edges, setEdges] = useState({ prev: false, next: true });
  const bar = useRef<HTMLDivElement>(null);

  const sync = useCallback(() => {
    if (!api) return;
    setEdges({ prev: api.canScrollPrev(), next: api.canScrollNext() });
    if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0.08, api.scrollProgress())})`;
  }, [api]);

  useEffect(() => {
    if (!api) return;
    api.on("select", sync).on("scroll", sync).on("reInit", sync);
    return () => {
      api.off("select", sync).off("scroll", sync).off("reInit", sync);
    };
  }, [api, sync]);

  return (
    <div role="region" aria-roledescription="carrossel" aria-label={label}>
      <div ref={viewport} className="overflow-hidden">
        <ul className="flex gap-3">
          {items.map((item, i) => (
            <li key={i} className="min-w-0 flex-[0_0_72%] sm:flex-[0_0_42%] lg:flex-[0_0_calc(25%-0.5625rem)]">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8 flex items-center gap-6">
        <div className="h-px flex-1 bg-ink/15" aria-hidden="true">
          <div
            ref={bar}
            className="h-px origin-left bg-ink transition-transform duration-300"
            style={{ transform: "scaleX(0.08)" }}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Anterior"
            disabled={!edges.prev}
            onClick={() => api?.scrollPrev()}
            className={cn(arrow)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Próximo"
            disabled={!edges.next}
            onClick={() => api?.scrollNext()}
            className={cn(arrow)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
