import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import type { z } from "zod";
import { requireRole } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog/queries";

export type FormState = { error?: string; ok?: boolean };
export type Table = "categories" | "collections" | "colors";

// O cliente tipado não aceita nome de tabela dinâmico; estas três têm as mesmas colunas de ordem.
type Loose = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any;
};

const DUPLICATE = "Já existe um item com esse endereço.";
const GENERIC = "Não foi possível salvar.";

/** Mensagem em português para a primeira falha do zod (as padrão são em inglês). */
export function firstError(error: z.ZodError, labels: Record<string, string>): string {
  const issue = error.issues[0];
  const label = labels[String(issue.path[0])] ?? "Campo";
  switch (issue.code) {
    case "too_small":
      return `${label}: use pelo menos ${String(issue.minimum)} caracteres.`;
    case "too_big":
      return `${label}: use no máximo ${String(issue.maximum)} caracteres.`;
    case "invalid_value":
      return `${label}: escolha uma opção.`;
    case "invalid_format":
      return `${label}: ${issue.message}`;
    default:
      return `${label}: preencha este campo.`;
  }
}

/** Lê o formulário: texto como está, caixa de seleção marcada ("on") vira verdadeiro. */
export function readForm(formData: FormData, checkboxes: string[]): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") raw[k] = v;
  for (const c of checkboxes) raw[c] = formData.get(c) === "on";
  return raw;
}

export async function saveRow<S extends z.ZodType>(opts: {
  table: Table;
  route: string;
  schema: S;
  formData: FormData;
  checkboxes: string[];
  labels: Record<string, string>;
  toRow: (data: z.output<S>) => Record<string, unknown>;
}): Promise<FormState> {
  const viewer = await requireRole(["admin"], opts.route);
  const parsed = opts.schema.safeParse(readForm(opts.formData, opts.checkboxes));
  if (!parsed.success) return { error: firstError(parsed.error, opts.labels) };

  const row = opts.toRow(parsed.data);
  const db = viewer.supabase as unknown as Loose;
  const idValue = opts.formData.get("id");
  const id = typeof idValue === "string" && idValue ? idValue : null;

  let error: { code?: string } | null;
  let changed = true;
  if (id) {
    const res = await db.from(opts.table).update(row).eq("id", id).select("id");
    error = res.error;
    changed = Boolean(res.data?.length);
  } else {
    const { data: last } = await db
      .from(opts.table)
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const next = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1;
    const res = await db.from(opts.table).insert({ ...row, sort_order: next });
    error = res.error;
  }
  if (error) return { error: error.code === "23505" ? DUPLICATE : GENERIC };
  if (!changed) return { error: GENERIC };

  updateTag(CATALOG_TAG);
  revalidatePath(opts.route);
  return { ok: true };
}

/** Troca de lugar com o vizinho. Reescreve a ordem inteira, então funciona mesmo com valores repetidos. */
export async function moveRow(table: Table, route: string, id: string, direction: "up" | "down"): Promise<FormState> {
  const viewer = await requireRole(["admin"], route);
  const db = viewer.supabase as unknown as Loose;
  const { data, error } = await db.from(table).select("id, sort_order").order("sort_order").order("id");
  if (error || !data) return { error: GENERIC };

  const rows = data as { id: string; sort_order: number }[];
  const from = rows.findIndex((r) => r.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= rows.length) return { ok: true };

  [rows[from], rows[to]] = [rows[to], rows[from]];
  const results = await Promise.all(
    rows
      .map((r, i) => ({ id: r.id, old: r.sort_order, next: i + 1 }))
      .filter((r) => r.old !== r.next)
      .map((r) => db.from(table).update({ sort_order: r.next }).eq("id", r.id).select("id")),
  );
  if (results.some((r) => r.error || !r.data?.length)) return { error: GENERIC };

  updateTag(CATALOG_TAG);
  revalidatePath(route);
  return { ok: true };
}

export async function setActive(table: Table, route: string, id: string, active: boolean): Promise<FormState> {
  const viewer = await requireRole(["admin"], route);
  const db = viewer.supabase as unknown as Loose;
  const { data, error } = await db.from(table).update({ active }).eq("id", id).select("id");
  if (error || !data?.length) return { error: GENERIC };
  updateTag(CATALOG_TAG);
  revalidatePath(route);
  return { ok: true };
}
