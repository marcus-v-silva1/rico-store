import type { CatalogColor, CatalogProduct, ProductRow } from "./types";

/** Converte a linha do banco no produto que a vitrine usa. */
export function mapProductRow(row: ProductRow, publicUrl: (path: string) => string): CatalogProduct {
  const available = row.variants.filter((v) => v.active && v.stock > 0);

  const seen = new Map<string, { color: CatalogColor; sort: number; main: boolean }>();
  for (const v of available) {
    const c = v.color;
    if (!c || !c.active || seen.has(c.slug)) continue;
    seen.set(c.slug, {
      color: { slug: c.slug, label: c.label, hex: c.hex },
      sort: c.sort_order,
      main: c.id === row.default_color_id,
    });
  }
  // A cor principal (se está à venda) vem primeiro; as outras seguem sort_order.
  const colors = [...seen.values()]
    .sort((a, b) => Number(b.main) - Number(a.main) || a.sort - b.sort)
    .map((x) => x.color);

  const images = [...row.images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ url: publicUrl(i.path), alt: i.alt, colorSlug: i.color?.slug ?? null }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    detail: row.detail,
    priceCents: row.price_cents,
    isNew: row.is_new,
    garment: row.garment,
    categorySlug: row.category?.slug ?? "",
    colors,
    images,
    soldOut: available.length === 0,
  };
}
