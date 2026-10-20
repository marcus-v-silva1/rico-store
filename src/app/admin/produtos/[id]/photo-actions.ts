"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireRole } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog/queries";

type Result = { error?: string };

const ROUTE = "/admin/produtos";
const BUCKET = "produtos";
const UUID_SRC = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID = new RegExp(`^${UUID_SRC}$`, "i");
const ALT_MAX = 200;

const GENERIC = "Não foi possível salvar a foto. Tente de novo.";
const NOT_FOUND = "Foto não encontrada. Recarregue a página.";

function cleanAlt(alt: unknown): string | null {
  if (typeof alt !== "string") return null;
  const t = alt.trim();
  return t.length > ALT_MAX ? null : t;
}

function badColor(colorId: string | null): boolean {
  return colorId !== null && (typeof colorId !== "string" || !UUID.test(colorId));
}

function describe(error: { code?: string }): string {
  if (error.code === "42501") return "Você não tem permissão para mexer nas fotos.";
  if (error.code === "23503") return "O produto ou a cor não existe mais. Recarregue a página.";
  return GENERIC;
}

function done(productId: string) {
  updateTag(CATALOG_TAG);
  revalidatePath(`${ROUTE}/${productId}`);
}

/** Grava a foto que o navegador acabou de enviar ao bucket. Ela entra no fim da fila. */
export async function addProductImage(
  productId: string,
  path: string,
  colorId: string | null,
  alt: string,
): Promise<Result> {
  const { supabase } = await requireRole(["admin"], ROUTE);
  if (typeof productId !== "string" || !UUID.test(productId)) return { error: "Produto não encontrado." };
  // O caminho vem do navegador: só aceita `<produto>/<uuid>.<ext>` dentro da pasta deste produto.
  const pathOk =
    typeof path === "string" &&
    path.startsWith(`${productId}/`) &&
    new RegExp(`^${UUID_SRC}/${UUID_SRC}\\.(jpg|png|webp)$`, "i").test(path);
  if (!pathOk) return { error: "Endereço da foto inválido. Envie de novo." };
  if (badColor(colorId)) return { error: "Cor inválida." };
  const text = cleanAlt(alt);
  if (text === null) return { error: `O texto alternativo passa de ${ALT_MAX} caracteres.` };

  const { data: last, error: readError } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) {
    console.error("addProductImage: falha ao ler a ordem das fotos", readError);
    return { error: describe(readError) };
  }

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, path, color_id: colorId, alt: text, sort_order: (last?.sort_order ?? -1) + 1 })
    .select("id");
  if (error || !data?.length) {
    if (error) console.error("addProductImage: falha ao gravar a foto", error);
    return { error: error ? describe(error) : GENERIC };
  }

  done(productId);
  return {};
}

/** Salva a nova ordem: `sort_order` = posição na lista. A lista precisa ter exatamente as fotos do produto. */
export async function reorderProductImages(productId: string, orderedIds: string[]): Promise<Result> {
  const { supabase } = await requireRole(["admin"], ROUTE);
  if (typeof productId !== "string" || !UUID.test(productId)) return { error: "Produto não encontrado." };
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string" || !UUID.test(id)))
    return { error: "Ordem inválida. Recarregue a página." };

  const { data: rows, error } = await supabase
    .from("product_images")
    .select("id, sort_order")
    .eq("product_id", productId);
  if (error) {
    console.error("reorderProductImages: falha ao ler as fotos", error);
    return { error: describe(error) };
  }

  const current = new Map(rows.map((r) => [r.id, r.sort_order]));
  const sameSet =
    orderedIds.length === current.size &&
    new Set(orderedIds).size === orderedIds.length &&
    orderedIds.every((id) => current.has(id));
  if (!sameSet) return { error: "As fotos mudaram enquanto você ordenava. Recarregue a página." };

  const changes = orderedIds.map((id, index) => ({ id, index })).filter((c) => current.get(c.id) !== c.index);
  const results = await Promise.all(
    changes.map((c) =>
      supabase
        .from("product_images")
        .update({ sort_order: c.index })
        .eq("id", c.id)
        .eq("product_id", productId)
        .select("id"),
    ),
  );
  const failed = results.find((r) => r.error || !r.data?.length);
  if (failed) {
    if (failed.error) console.error("reorderProductImages: falha ao salvar a ordem", failed.error);
    // Parte pode ter sido salva: recarregar mostra a ordem real.
    done(productId);
    return { error: "Não foi possível salvar a ordem. Recarregue a página e tente de novo." };
  }

  if (changes.length) done(productId);
  return {};
}

/** Troca a cor (`null` = todas as cores) e o texto alternativo de uma foto. */
export async function updateProductImage(imageId: string, colorId: string | null, alt: string): Promise<Result> {
  const { supabase } = await requireRole(["admin"], ROUTE);
  if (typeof imageId !== "string" || !UUID.test(imageId)) return { error: NOT_FOUND };
  if (badColor(colorId)) return { error: "Cor inválida." };
  const text = cleanAlt(alt);
  if (text === null) return { error: `O texto alternativo passa de ${ALT_MAX} caracteres.` };

  const { data, error } = await supabase
    .from("product_images")
    .update({ color_id: colorId, alt: text })
    .eq("id", imageId)
    .select("product_id");
  if (error || !data?.length) {
    if (error) console.error("updateProductImage: falha ao salvar a foto", error);
    return { error: error ? describe(error) : NOT_FOUND };
  }

  done(data[0].product_id);
  return {};
}

/** Apaga o arquivo do bucket e depois a linha. Se o arquivo não sair, a linha fica e a foto continua no painel. */
export async function removeProductImage(imageId: string): Promise<Result> {
  const { supabase } = await requireRole(["admin"], ROUTE);
  if (typeof imageId !== "string" || !UUID.test(imageId)) return { error: NOT_FOUND };

  const { data: image, error: readError } = await supabase
    .from("product_images")
    .select("product_id, path")
    .eq("id", imageId)
    .maybeSingle();
  if (readError) {
    console.error("removeProductImage: falha ao ler a foto", readError);
    return { error: describe(readError) };
  }
  if (!image) return { error: NOT_FOUND };

  // Lista vazia sem erro = o arquivo já não estava lá; segue para apagar a linha.
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([image.path]);
  if (storageError) {
    console.error(`removeProductImage: falha ao apagar o arquivo ${image.path}; a linha foi mantida`, storageError);
    return { error: "Não foi possível apagar a foto. Tente de novo." };
  }

  const { data, error } = await supabase.from("product_images").delete().eq("id", imageId).select("id");
  if (error || !data?.length) {
    console.error(
      `removeProductImage: arquivo ${image.path} apagado, mas a linha ${imageId} ficou`,
      error ?? "nenhuma linha apagada",
    );
    done(image.product_id);
    return { error: "A foto saiu do armazenamento, mas não da lista. Recarregue a página e remova de novo." };
  }

  done(image.product_id);
  return {};
}
