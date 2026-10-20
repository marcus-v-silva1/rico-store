export type GridCell = { colorId: string; size: string; raw: string };
export type GridVariant = { colorId: string; size: string; stock: number };
export type GridError = { colorId: string; size: string; message: string };

const MESSAGE = "Use um número inteiro, 0 ou mais.";

/** Lê a grade cor × tamanho. Célula vazia = sem variante; 0 = variante sem estoque. */
export function parseVariantGrid(
  cells: readonly GridCell[],
): { ok: true; variants: GridVariant[] } | { ok: false; errors: GridError[] } {
  const variants: GridVariant[] = [];
  const errors: GridError[] = [];
  for (const cell of cells) {
    const raw = cell.raw.trim();
    const size = cell.size.trim();
    if (raw === "") continue;
    if (!/^\d+$/.test(raw)) {
      errors.push({ colorId: cell.colorId, size, message: MESSAGE });
      continue;
    }
    variants.push({ colorId: cell.colorId, size, stock: Number(raw) });
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, variants };
}
