import type { CatalogColor, CatalogProduct } from "@/lib/catalog/types";
import { formatBRL } from "@/lib/money";

/** Regras da sacola. Puro: sem navegador e sem Supabase, por isso é testável. */
export type CartItem = { slug: string; color: string; qty: number };
export type CartLine = { product: CatalogProduct; color: CatalogColor; qty: number; lineCents: number };
/** Peças à venda, por slug. Vem do banco (`getCartCatalog`). */
export type CartCatalog = ReadonlyMap<string, CatalogProduct>;

export const MAX_QTY = 10;

const same = (i: CartItem, slug: string, color: string) => i.slug === slug && i.color === color;

export function catalogIndex(products: readonly CatalogProduct[]): CartCatalog {
  return new Map(products.map((p) => [p.slug, p]));
}

export function addItem(items: readonly CartItem[], slug: string, color: string): CartItem[] {
  const found = items.find((i) => same(i, slug, color));
  if (!found) return [...items, { slug, color, qty: 1 }];
  return items.map((i) => (i === found ? { ...i, qty: Math.min(i.qty + 1, MAX_QTY) } : i));
}

/** Quantidade zero ou negativa tira o item da sacola. */
export function setQty(items: readonly CartItem[], slug: string, color: string, qty: number): CartItem[] {
  if (qty <= 0) return removeItem(items, slug, color);
  return items.map((i) => (same(i, slug, color) ? { ...i, qty: Math.min(Math.floor(qty), MAX_QTY) } : i));
}

export function removeItem(items: readonly CartItem[], slug: string, color: string): CartItem[] {
  return items.filter((i) => !same(i, slug, color));
}

/**
 * O que vem do localStorage pode estar velho ou adulterado: aqui só passa o que tem formato de item.
 * Peça ou cor que saiu do catálogo é descartada depois, em `toLines`.
 */
export function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { slug, color, qty } = entry as Record<string, unknown>;
    if (typeof slug !== "string" || typeof color !== "string" || !slug || !color) continue;
    if (typeof qty !== "number" || !Number.isFinite(qty) || qty < 1) continue;
    if (out.some((i) => same(i, slug, color))) continue;
    out.push({ slug, color, qty: Math.min(Math.floor(qty), MAX_QTY) });
  }
  return out;
}

/** Só viram linha as peças e cores ainda à venda, com o preço atual do catálogo. */
export function toLines(items: readonly CartItem[], catalog: CartCatalog): CartLine[] {
  return items.flatMap((i) => {
    const product = catalog.get(i.slug);
    const color = product?.colors.find((c) => c.slug === i.color);
    return product && color ? [{ product, color, qty: i.qty, lineCents: product.priceCents * i.qty }] : [];
  });
}

export const totalCents = (lines: readonly CartLine[]) => lines.reduce((s, l) => s + l.lineCents, 0);
export const totalQty = (items: readonly { qty: number }[]) => items.reduce((s, i) => s + i.qty, 0);

/** Link do WhatsApp com o pedido pronto. `null` enquanto o número da loja não foi definido. */
export function whatsappUrl(phone: string, lines: readonly CartLine[]): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || lines.length === 0) return null;
  const body = lines
    .map((l) => `- ${l.qty}x ${l.product.name} (${l.color.label}): ${formatBRL(l.lineCents)}`)
    .join("\n");
  const text = `Olá! Quero fechar este pedido da Rico Store:\n${body}\nTotal: ${formatBRL(totalCents(lines))}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
