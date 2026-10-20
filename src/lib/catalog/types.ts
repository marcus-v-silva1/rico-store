/** Tipos do catálogo. Puros: sem dependência de Supabase. */

export const GARMENT_KINDS = ["jacket", "hoodie", "tee", "pants", "shorts", "cap", "sneaker", "bag"] as const;
export type GarmentKind = (typeof GARMENT_KINDS)[number];

export const PRODUCT_STATUSES = ["rascunho", "ativo", "arquivado"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export type CatalogColor = { slug: string; label: string; hex: string };
export type CatalogImage = { url: string; alt: string; colorSlug: string | null };

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  detail: string;
  priceCents: number;
  isNew: boolean;
  garment: GarmentKind;
  categorySlug: string;
  /** Só cores com alguma variante ativa com estoque, por sort_order. */
  colors: CatalogColor[];
  /** Por sort_order. */
  images: CatalogImage[];
  /** Nenhuma variante ativa com estoque. */
  soldOut: boolean;
};

/** Formato devolvido pelo select de queries.ts. */
export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  detail: string;
  price_cents: number;
  is_new: boolean;
  garment: GarmentKind;
  category: { slug: string } | null;
  variants: {
    stock: number;
    active: boolean;
    color: {
      slug: string;
      label: string;
      hex: string;
      sort_order: number;
      active: boolean;
    } | null;
  }[];
  images: {
    path: string;
    alt: string;
    sort_order: number;
    color: { slug: string } | null;
  }[];
};
