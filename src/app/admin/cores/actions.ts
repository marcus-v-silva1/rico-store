"use server";

import { colorFormSchema } from "@/lib/catalog/schemas";
import { moveRow, saveRow, setActive, type FormState } from "../taxonomy-server";

const ROUTE = "/admin/cores";

export async function saveColor(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow({
    table: "colors",
    route: ROUTE,
    schema: colorFormSchema,
    formData,
    checkboxes: [],
    labels: { label: "Nome", slug: "Endereço", hex: "Cor" },
    toRow: (d) => ({ label: d.label, slug: d.slug, hex: d.hex }),
  });
}

export async function moveColor(id: string, direction: "up" | "down"): Promise<FormState> {
  return moveRow("colors", ROUTE, id, direction);
}

export async function setColorActive(id: string, active: boolean): Promise<FormState> {
  return setActive("colors", ROUTE, id, active);
}
