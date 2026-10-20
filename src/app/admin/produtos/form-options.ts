import "server-only";
import type { Viewer } from "@/lib/auth";
import type { CategoryOption, CollectionOption } from "./product-form";
import type { GridColor } from "./variant-grid";

export type FormOptions = { categories: CategoryOption[]; collections: CollectionOption[]; colors: GridColor[] };

/** Categorias, coleções e cores para o formulário de produto (inclui as desativadas). `null` se o banco falhar. */
export async function loadFormOptions(supabase: Viewer["supabase"]): Promise<FormOptions | null> {
  const [categories, collections, colors] = await Promise.all([
    supabase.from("categories").select("id, name, garment, active").order("sort_order").order("id"),
    supabase.from("collections").select("id, title, active").order("sort_order").order("id"),
    supabase.from("colors").select("id, slug, label, hex, active").order("sort_order").order("id"),
  ]);
  const error = categories.error ?? collections.error ?? colors.error;
  if (error) {
    console.error("loadFormOptions: falha ao ler categorias, coleções ou cores", error);
    return null;
  }
  // Sem erro, o cliente sempre devolve lista; o `?? []` só acalma o tipo.
  return { categories: categories.data ?? [], collections: collections.data ?? [], colors: colors.data ?? [] };
}

export const LOAD_ERROR = "Não foi possível carregar os dados do produto. Recarregue a página.";
