"use client";

import { useState } from "react";
import { COLORS, type ColorId, type Product } from "@/content/catalog";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import { addToCart } from "./cart";
import { Garment } from "./garment";
import { Button } from "./ui/button";

export function ProductCard({ product }: { product: Product }) {
  const [color, setColor] = useState<ColorId>(product.colors[0]);
  const [added, setAdded] = useState(false);
  const detail = color === product.colors[0] ? product.detail : COLORS[color].label;

  function add() {
    addToCart(product.slug, color);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="group">
      <div className="relative aspect-[4/5] bg-concrete">
        {product.isNew && (
          <span className="label absolute top-3 left-3 bg-ink px-2 py-1 text-[0.625rem] tracking-normal text-bone normal-case">
            Novo
          </span>
        )}
        <Garment
          kind={product.garment}
          color={COLORS[color].hex}
          className="absolute inset-[14%] size-[72%] transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[0.8125rem] font-semibold">{product.name}</h3>
        <p className="text-[0.8125rem] whitespace-nowrap">{formatBRL(product.priceCents)}</p>
      </div>
      <p className="text-xs text-stone">{detail}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="group" aria-label={`Cores de ${product.name}`}>
          {product.colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={COLORS[c].label}
              aria-pressed={c === color}
              className={cn(
                "size-3.5 rounded-full border border-ink/25 outline-offset-4 focus-visible:outline-2 focus-visible:outline-ink",
                c === color && "ring-1 ring-ink ring-offset-2 ring-offset-paper",
              )}
              style={{ backgroundColor: COLORS[c].hex }}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={add} aria-live="polite">
          {added ? "Na sacola" : "Adicionar"}
        </Button>
      </div>
    </article>
  );
}
