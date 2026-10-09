"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useMemo, useRef } from "react";
import { COLORS } from "@/content/catalog";
import { SITE } from "@/content/site";
import { toLines, totalCents, whatsappUrl } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import { changeQty, removeFromCart, setCartOpen, useCartItems, useCartOpen } from "./cart";
import { Garment } from "./garment";
import { EASE } from "./motion";
import { NavLink } from "./nav-link";
import { buttonStyles } from "./ui/button";
import { cn } from "@/lib/utils";

const step = "grid size-8 place-items-center border border-ink/30 text-sm hover:border-ink disabled:opacity-30";

/** Gaveta da sacola: entra pela direita, mostra as peças e fecha o pedido pelo WhatsApp. */
export function CartDrawer() {
  const open = useCartOpen();
  const items = useCartItems();
  const lenis = useLenis();
  const closeRef = useRef<HTMLButtonElement>(null);
  const lines = useMemo(() => toLines(items), [items]);
  const total = totalCents(lines);
  const whatsapp = whatsappUrl(SITE.whatsapp, lines);

  // Trava a rolagem da página, devolve o foco a quem abriu e fecha com Esc
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    lenis?.stop();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      lenis?.start();
      opener?.focus?.();
    };
  }, [open, lenis]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Sacola"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper text-ink"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b border-ink/15 px-5 py-4">
              <h2 className="heading text-lg">Sua sacola</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setCartOpen(false)}
                className="text-sm font-semibold underline underline-offset-4"
              >
                Fechar
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-4 px-5">
                <p className="display text-3xl">Sacola vazia</p>
                <p className="text-sm text-ink/70">Escolha uma peça e ela aparece aqui.</p>
                <NavLink
                  href="/colecao/street"
                  onClick={() => setCartOpen(false)}
                  className={buttonStyles({ variant: "dark" })}
                >
                  Ver coleção Street
                </NavLink>
              </div>
            ) : (
              <>
                <ul data-lenis-prevent className="flex-1 divide-y divide-ink/15 overflow-y-auto px-5">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <motion.li
                        key={`${l.product.slug}-${l.color}`}
                        layout
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="flex gap-4 py-4"
                      >
                        <div className="grid size-20 shrink-0 place-items-center bg-concrete">
                          <Garment kind={l.product.garment} color={COLORS[l.color].hex} className="size-14" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-3">
                            <p className="text-[0.8125rem] font-semibold">{l.product.name}</p>
                            <p className="text-[0.8125rem] whitespace-nowrap">{formatBRL(l.lineCents)}</p>
                          </div>
                          <p className="text-xs text-stone">{COLORS[l.color].label}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Menos uma ${l.product.name}`}
                                className={cn(step)}
                                onClick={() => changeQty(l.product.slug, l.color, l.qty - 1)}
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-sm tabular-nums" aria-live="polite">
                                {l.qty}
                              </span>
                              <button
                                type="button"
                                aria-label={`Mais uma ${l.product.name}`}
                                className={cn(step)}
                                onClick={() => changeQty(l.product.slug, l.color, l.qty + 1)}
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="text-xs underline underline-offset-4"
                              onClick={() => removeFromCart(l.product.slug, l.color)}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="border-t border-ink/15 px-5 py-5">
                  <div className="flex items-baseline justify-between">
                    <span className="label text-stone">Total</span>
                    <span className="heading text-2xl">{formatBRL(total)}</span>
                  </div>
                  {whatsapp ? (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonStyles({ variant: "dark" }), "mt-4 w-full")}
                    >
                      Finalizar pelo WhatsApp
                    </a>
                  ) : (
                    <>
                      <button type="button" disabled className={cn(buttonStyles({ variant: "dark" }), "mt-4 w-full")}>
                        Finalizar pelo WhatsApp
                      </button>
                      <p className="mt-2 text-xs text-stone">
                        Defina o WhatsApp da loja em src/content/site.ts para liberar o pedido.
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
