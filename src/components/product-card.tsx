"use client";

import { useState } from "react";
import type { CatalogProduct } from "@/lib/catalog/types";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import { addToCart } from "./cart";
import { Garment } from "./garment";
import { Photo } from "./photo";
import { Button } from "./ui/button";

const tag = "label absolute top-3 left-3 z-10 bg-ink px-2 py-1 text-[0.625rem] tracking-normal text-bone normal-case";

export function ProductCard({ product }: { product: CatalogProduct }) {
  // Até o visitante escolher, vale a primeira cor (a principal) e o texto de `detail`.
  const [picked, setPicked] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const color = product.colors.find((c) => c.slug === picked) ?? product.colors[0];
  const detail = picked && color ? color.label : product.detail;
  const image = product.images.find((i) => color && i.colorSlug === color.slug) ?? product.images[0];
  // Estoque só em cores desativadas: sem cor para escolher, o card fica esgotado.
  const unavailable = product.soldOut || product.colors.length === 0;

  function add() {
    if (!color) return;
    addToCart(product.slug, color.slug);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="group">
      <div className="relative aspect-[4/5] bg-concrete">
        {unavailable ? <span className={tag}>Esgotado</span> : product.isNew && <span className={tag}>Novo</span>}
        {image ? (
          <Photo
            src={image.url}
            alt={image.alt || product.name}
            slot={product.name}
            className="absolute inset-0 bg-concrete"
          />
        ) : (
          <Garment
            kind={product.garment}
            color={color?.hex ?? "#121212"}
            className="absolute inset-[14%] size-[72%] transition-transform duration-500 ease-out group-hover:scale-105"
          />
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[0.8125rem] font-semibold">{product.name}</h3>
        <p className="text-[0.8125rem] whitespace-nowrap">{formatBRL(product.priceCents)}</p>
      </div>
      <p className="text-xs text-stone">{detail}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        {product.colors.length > 0 ? (
          <div className="flex items-center gap-2" role="group" aria-label={`Cores de ${product.name}`}>
            {product.colors.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setPicked(c.slug)}
                aria-label={c.label}
                aria-pressed={c.slug === color?.slug}
                className={cn(
                  "size-3.5 rounded-full border border-ink/25 outline-offset-4 focus-visible:outline-2 focus-visible:outline-ink",
                  c.slug === color?.slug && "ring-1 ring-ink ring-offset-2 ring-offset-paper",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        ) : (
          <span />
        )}
        {unavailable ? (
          <Button variant="outline" size="sm" disabled>
            Esgotado
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={add} aria-live="polite">
            {added ? "Na sacola" : "Adicionar"}
          </Button>
        )}
      </div>
    </article>
  );
}
