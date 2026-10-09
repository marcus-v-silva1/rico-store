"use client";

import { useInView } from "motion/react";
import { Fragment, useEffect, useRef, useState } from "react";

const CARET_LINGER_MS = 1400;

/**
 * Escreve o texto letra por letra quando entra na tela. Cada linha da lista vira uma linha do título.
 * Digitar não é movimento de página, então roda mesmo com "reduzir movimento" ligado (senão a frase some).
 * O espaço das letras ainda não escritas já está reservado, então nada pula de lugar enquanto digita.
 */
export function Typewriter({
  lines,
  id,
  className,
  speed = 70,
}: {
  lines: readonly string[];
  id?: string;
  className?: string;
  /** Milissegundos por letra. */
  speed?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const total = lines.reduce((sum, l) => sum + l.length, 0);
  const [typed, setTyped] = useState(0);
  const [caret, setCaret] = useState(true);

  useEffect(() => {
    if (!inView) return;
    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      setTyped(n);
      if (n >= total) window.clearInterval(timer);
    }, speed);
    const hide = window.setTimeout(() => setCaret(false), total * speed + CARET_LINGER_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(hide);
    };
  }, [inView, total, speed]);

  const shown = typed;
  let index = 0;

  return (
    <h2 ref={ref} id={id} className={className} aria-label={lines.join(" ")}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.split(" ").map((word, wi, words) => (
            <Fragment key={wi}>
              <span className="inline-block whitespace-nowrap">
                {[...word].map((char, ci) => {
                  const visible = index < shown;
                  const isLast = index === shown - 1;
                  index += 1;
                  return (
                    <span key={ci} className={visible ? undefined : "invisible"}>
                      {char}
                      {isLast && caret && <span className="caret" />}
                    </span>
                  );
                })}
              </span>
              {wi < words.length - 1 && " "}
            </Fragment>
          ))}
        </span>
      ))}
    </h2>
  );
}
