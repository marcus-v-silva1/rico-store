import { COLORS, PRODUCTS, type ColorId, type Product } from "@/content/catalog";
import { formatBRL } from "@/lib/money";

/** Regras da sacola. Puro: sem navegador e sem Supabase, por isso é testável. */
export type CartItem = { slug: string; color: ColorId; qty: number };
export type CartLine = { product: Product; color: ColorId; qty: number; lineCents: number };

export const MAX_QTY = 10;

const same = (i: CartItem, slug: string, color: ColorId) => i.slug === slug && i.color === color;

export function addItem(items: readonly CartItem[], slug: string, color: ColorId): CartItem[] {
  const found = items.find((i) => same(i, slug, color));
  if (!found) return [...items, { slug, color, qty: 1 }];
  return items.map((i) => (i === found ? { ...i, qty: Math.min(i.qty + 1, MAX_QTY) } : i));
}

/** Quantidade zero ou negativa tira o item da sacola. */
export function setQty(items: readonly CartItem[], slug: string, color: ColorId, qty: number): CartItem[] {
  if (qty <= 0) return removeItem(items, slug, color);
  return items.map((i) => (same(i, slug, color) ? { ...i, qty: Math.min(Math.floor(qty), MAX_QTY) } : i));
}

export function removeItem(items: readonly CartItem[], slug: string, color: ColorId): CartItem[] {
  return items.filter((i) => !same(i, slug, color));
}

/** O que vem do localStorage pode estar velho ou adulterado: só passa o que ainda existe no catálogo. */
export function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { slug, color, qty } = entry as Record<string, unknown>;
    const product = PRODUCTS.find((p) => p.slug === slug);
    if (!product || typeof color !== "string" || !(product.colors as readonly string[]).includes(color)) continue;
    if (typeof qty !== "number" || !Number.isFinite(qty) || qty < 1) continue;
    const c = color as ColorId;
    if (out.some((i) => same(i, product.slug, c))) continue;
    out.push({ slug: product.slug, color: c, qty: Math.min(Math.floor(qty), MAX_QTY) });
  }
  return out;
}

export function toLines(items: readonly CartItem[]): CartLine[] {
  return items.flatMap((i) => {
    const product = PRODUCTS.find((p) => p.slug === i.slug);
    return product ? [{ product, color: i.color, qty: i.qty, lineCents: product.priceCents * i.qty }] : [];
  });
}

export const totalCents = (lines: readonly CartLine[]) => lines.reduce((s, l) => s + l.lineCents, 0);
export const totalQty = (items: readonly CartItem[]) => items.reduce((s, i) => s + i.qty, 0);

/** Link do WhatsApp com o pedido pronto. `null` enquanto o número da loja não foi definido. */
export function whatsappUrl(phone: string, lines: readonly CartLine[]): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || lines.length === 0) return null;
  const body = lines
    .map((l) => `- ${l.qty}x ${l.product.name} (${COLORS[l.color].label}): ${formatBRL(l.lineCents)}`)
    .join("\n");
  const text = `Olá! Quero fechar este pedido da Rico Store:\n${body}\nTotal: ${formatBRL(totalCents(lines))}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
