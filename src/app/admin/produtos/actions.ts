"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { describeSaveError } from "@/lib/catalog/errors";
import { checkGrid, productFieldErrors, readGridCells } from "@/lib/catalog/product-form";
import { publishProblems } from "@/lib/catalog/publish";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import { parsePriceToCents, productFormSchema } from "@/lib/catalog/schemas";
import { buildSku } from "@/lib/catalog/slug";

export type ProductFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  cellErrors?: { colorId: string; size: string; message: string }[];
  ok?: boolean;
};

const ROUTE = "/admin/produtos";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHECK_FIELDS = "Confira os campos marcados.";

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const { supabase } = await requireRole(["admin"], ROUTE);

  const id = text(formData, "id") || null;
  if (id && !UUID.test(id)) return { error: "Produto não encontrado." };

  const weight = text(formData, "weightGrams").trim();
  const parsed = productFormSchema.safeParse({
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    detail: text(formData, "detail"),
    description: text(formData, "description"),
    categoryId: text(formData, "categoryId"),
    priceCents: parsePriceToCents(text(formData, "price")) ?? 0,
    weightGrams: /^\d+$/.test(weight) ? Number(weight) : 0,
    isNew: formData.get("isNew") === "on",
    garment: text(formData, "garment"),
    status: text(formData, "status"),
    collectionIds: formData.getAll("collectionIds").filter((v): v is string => typeof v === "string"),
    defaultColorId: text(formData, "defaultColorId") || null,
  });

  const cells = readGridCells(formData.entries());
  const grid = checkGrid(cells.filter((c) => UUID.test(c.colorId)));
  const fieldErrors = parsed.success ? undefined : productFieldErrors(parsed.error);
  const cellErrors = grid.ok ? undefined : grid.errors;
  if (!parsed.success || !grid.ok) return { error: CHECK_FIELDS, fieldErrors, cellErrors };

  const data = parsed.data;
  const variants = grid.variants;

  // A cor principal tem de ser uma das cores da grade.
  if (data.defaultColorId && !variants.some((v) => v.colorId === data.defaultColorId))
    return { error: CHECK_FIELDS, fieldErrors: { defaultColorId: "Escolha uma cor que está na grade." } };

  // O SKU usa o endereço da cor; uma cor apagada ou desconhecida derruba o envio.
  const colorIds = [...new Set(variants.map((v) => v.colorId))];
  const colorSlug = new Map<string, string>();
  if (colorIds.length) {
    const { data: colors, error } = await supabase.from("colors").select("id, slug").in("id", colorIds);
    if (error) {
      console.error("saveProduct: falha ao ler cores", error);
      return { error: describeSaveError(error) };
    }
    for (const c of colors) colorSlug.set(c.id, c.slug);
    if (colorIds.some((c) => !colorSlug.has(c)))
      return { error: "Uma das cores não existe mais. Recarregue a página." };
  }

  // A regra de publicação vale na hora de publicar. Um produto que já está ativo
  // (os do catálogo inicial não têm foto) continua editável e pode esgotar.
  if (data.status === "ativo") {
    let imageCount = 0;
    let wasActive = false;
    if (id) {
      const [current, images] = await Promise.all([
        supabase.from("products").select("status").eq("id", id).maybeSingle(),
        supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", id),
      ]);
      const error = current.error ?? images.error;
      if (error) {
        console.error("saveProduct: falha ao ler produto e fotos", error);
        return { error: describeSaveError(error) };
      }
      if (!current.data) return { error: "Produto não encontrado." };
      wasActive = current.data.status === "ativo";
      imageCount = images.count ?? 0;
    }
    const problems = wasActive ? [] : publishProblems({ variants, imageCount });
    if (problems.length) return { error: problems.join(" ") };
  }

  // Manda todos os campos: na edição, o banco troca o que faltar pelo valor padrão.
  const { data: savedId, error } = await supabase.rpc("admin_save_product", {
    p: {
      id,
      slug: data.slug,
      name: data.name,
      detail: data.detail,
      description: data.description,
      category_id: data.categoryId,
      price_cents: data.priceCents,
      weight_grams: data.weightGrams,
      is_new: data.isNew,
      garment: data.garment,
      status: data.status,
      collection_ids: [...new Set(data.collectionIds)],
      default_color_id: data.defaultColorId,
      variants: variants.map((v) => ({
        color_id: v.colorId,
        size: v.size,
        sku: buildSku(data.slug, colorSlug.get(v.colorId)!, v.size),
        stock: v.stock,
      })),
    },
  });
  if (error || !savedId) {
    if (error) console.error("saveProduct: falha ao salvar", error);
    return { error: error?.code === "P0002" ? "Produto não encontrado." : describeSaveError(error) };
  }

  updateTag(CATALOG_TAG);
  revalidatePath(ROUTE);
  if (!id) redirect(`${ROUTE}/${savedId}`);
  revalidatePath(`${ROUTE}/${savedId}`);
  return { ok: true };
}
