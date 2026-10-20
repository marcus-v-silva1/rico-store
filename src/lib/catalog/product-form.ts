import type { z } from "zod";
import { parseVariantGrid, type GridCell, type GridError, type GridVariant } from "./variant-grid";

export const STOCK_MAX = 100000;
const SIZE_MAX = 8;
const PREFIX = "stock:";

/** Lê as células `stock:<colorId>:<tamanho>` do formulário. Colunas sem tamanho são ignoradas. */
export function readGridCells(entries: Iterable<[string, FormDataEntryValue]>): GridCell[] {
  const cells: GridCell[] = [];
  for (const [key, value] of entries) {
    if (!key.startsWith(PREFIX) || typeof value !== "string") continue;
    const rest = key.slice(PREFIX.length);
    const sep = rest.indexOf(":");
    if (sep <= 0) continue;
    const size = rest.slice(sep + 1);
    if (size.trim() === "") continue;
    cells.push({ colorId: rest.slice(0, sep), size, raw: value });
  }
  return cells;
}

/**
 * `parseVariantGrid` mais as regras que ele não cobre: estoque até 100000,
 * tamanho de até 8 caracteres e o mesmo tamanho uma vez só por cor.
 */
export function checkGrid(
  cells: readonly GridCell[],
): { ok: true; variants: GridVariant[] } | { ok: false; errors: GridError[] } {
  const errors: GridError[] = [];
  const variants: GridVariant[] = [];
  const seen = new Set<string>();
  // Célula por célula, para mostrar de uma vez todos os erros da grade.
  for (const cell of cells) {
    const parsed = parseVariantGrid([cell]);
    if (!parsed.ok) {
      errors.push(...parsed.errors);
      continue;
    }
    const v = parsed.variants[0];
    if (!v) continue;
    const key = `${v.colorId}:${v.size}`;
    const at = { colorId: v.colorId, size: v.size };
    if (seen.has(key)) {
      errors.push({ ...at, message: "Esse tamanho já está nesta cor." });
    } else if (v.size.length > SIZE_MAX) {
      errors.push({ ...at, message: `Use um tamanho de até ${SIZE_MAX} caracteres.` });
    } else if (v.stock > STOCK_MAX) {
      errors.push({ ...at, message: `Use no máximo ${STOCK_MAX}.` });
    } else {
      variants.push(v);
    }
    seen.add(key);
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, variants };
}

/** Campo do formulário de produto (o preço chega como `price`, em reais). */
const FIELD: Record<string, string> = { priceCents: "price" };

const FIXED: Record<string, string> = {
  categoryId: "Escolha uma categoria.",
  price: "Use um valor como 129,90.",
  weightGrams: "Use o peso em gramas, um número inteiro maior que zero.",
  isNew: "Marque ou desmarque a opção.",
  garment: "Escolha um desenho.",
  status: "Escolha uma situação.",
  collectionIds: "Escolha coleções da lista.",
  defaultColorId: "Escolha uma cor que está na grade.",
};

/** Erros do zod em português, um por campo (os padrão vêm em inglês). */
export function productFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = String(issue.path[0] ?? "");
    const field = FIELD[path] ?? path;
    if (out[field]) continue;
    if (FIXED[field]) {
      out[field] = FIXED[field];
    } else if (issue.code === "too_small") {
      out[field] = `Use pelo menos ${String(issue.minimum)} caracteres.`;
    } else if (issue.code === "too_big") {
      out[field] = `Use no máximo ${String(issue.maximum)} caracteres.`;
    } else if (issue.code === "invalid_format") {
      out[field] = issue.message;
    } else {
      out[field] = "Preencha este campo.";
    }
  }
  return out;
}
