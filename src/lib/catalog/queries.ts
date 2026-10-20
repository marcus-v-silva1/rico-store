import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { mapProductRow } from "./map";
import type { CatalogProduct, GarmentKind, ProductRow } from "./types";

/** Tag de todas as leituras da loja; o painel chama `updateTag(CATALOG_TAG)` ao salvar. */
export const CATALOG_TAG = "catalogo";

export type NavItem = { slug: string; title: string };
export type CatalogPage = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  products: CatalogProduct[];
};

// Formato de ProductRow. `!inner` na categoria permite filtrar as inativas.
const PRODUCT_SELECT = `
  id, slug, name, detail, price_cents, is_new, garment, default_color_id,
  category:categories!inner(slug, active),
  variants:product_variants(stock, active, color:colors(id, slug, label, hex, sort_order, active)),
  images:product_images(path, alt, sort_order, color:colors(slug))
`;

const COLLECTION_PRODUCT_SELECT = `${PRODUCT_SELECT}, product_collections!inner(collection_id)`;

export function productImageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/produtos/${path}`;
}

function fail(what: string, error: { message: string }): never {
  throw new Error(`Falha ao ler ${what}: ${error.message}`);
}

function toProducts(rows: unknown): CatalogProduct[] {
  return (rows as ProductRow[]).map((row) => mapProductRow(row, productImageUrl));
}

export async function getNavCollections(): Promise<NavItem[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient()
    .from("collections")
    .select("slug, title")
    .eq("active", true)
    .eq("show_in_nav", true)
    .order("sort_order");
  if (error) fail("o menu", error);
  return data;
}

export async function getCollections(): Promise<NavItem[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient()
    .from("collections")
    .select("slug, title")
    .eq("active", true)
    .order("sort_order");
  if (error) fail("as coleções", error);
  return data;
}

export async function getCollectionPage(slug: string): Promise<CatalogPage | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return null;

  const db = createPublicClient();
  const { data: collection, error } = await db
    .from("collections")
    .select("id, slug, title, kicker, description")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) fail("a coleção", error);
  if (!collection) return null;

  const { data: rows, error: productsError } = await db
    .from("products")
    .select(COLLECTION_PRODUCT_SELECT)
    .eq("status", "ativo")
    .eq("category.active", true)
    .eq("product_collections.collection_id", collection.id)
    .order("created_at", { ascending: false })
    .order("slug");
  if (productsError) fail("os produtos da coleção", productsError);

  return {
    slug: collection.slug,
    title: collection.title,
    kicker: collection.kicker,
    description: collection.description,
    products: toProducts(rows),
  };
}

export async function getCategoryPage(slug: string): Promise<CatalogPage | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return null;

  const db = createPublicClient();
  const { data: category, error } = await db
    .from("categories")
    .select("id, slug, name, kicker, description")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) fail("a categoria", error);
  if (!category) return null;

  const { data: rows, error: productsError } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "ativo")
    .eq("category_id", category.id)
    .eq("category.active", true)
    .order("created_at", { ascending: false })
    .order("slug");
  if (productsError) fail("os produtos da categoria", productsError);

  return {
    slug: category.slug,
    title: category.name,
    kicker: category.kicker,
    description: category.description,
    products: toProducts(rows),
  };
}

export async function getHomeCategories(): Promise<
  { slug: string; name: string; kicker: string; garment: GarmentKind }[]
> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("slug, name, kicker, garment")
    .eq("active", true)
    .eq("show_on_home", true)
    .order("sort_order");
  if (error) fail("as categorias da home", error);
  return data;
}

export async function getFeaturedProducts(limit = 8): Promise<CatalogProduct[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "ativo")
    .eq("category.active", true)
    .order("is_new", { ascending: false })
    .order("created_at", { ascending: false })
    .order("slug")
    .limit(limit);
  if (error) fail("os destaques", error);
  return toProducts(data);
}

/** Todas as peças à venda: a sacola confere nome, preço e cor por aqui. */
export async function getCartCatalog(): Promise<CatalogProduct[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "ativo")
    .eq("category.active", true)
    .order("slug");
  if (error) fail("as peças da sacola", error);
  return toProducts(data);
}

export async function getCollectionSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient().from("collections").select("slug").eq("active", true);
  if (error) fail("os endereços das coleções", error);
  return data.map((c) => c.slug);
}

export async function getCategorySlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient().from("categories").select("slug").eq("active", true);
  if (error) fail("os endereços das categorias", error);
  return data.map((c) => c.slug);
}
