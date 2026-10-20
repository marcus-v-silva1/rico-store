"use server";

import { categoryFormSchema } from "@/lib/catalog/schemas";
import { moveRow, saveRow, setActive, type FormState } from "../taxonomy-server";

const ROUTE = "/admin/categorias";

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow({
    table: "categories",
    route: ROUTE,
    schema: categoryFormSchema,
    formData,
    checkboxes: ["showOnHome"],
    labels: { name: "Nome", slug: "Endereço", kicker: "Chamada", description: "Descrição", garment: "Desenho" },
    toRow: (d) => ({
      name: d.name,
      slug: d.slug,
      kicker: d.kicker,
      description: d.description,
      garment: d.garment,
      show_on_home: d.showOnHome,
    }),
  });
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<FormState> {
  return moveRow("categories", ROUTE, id, direction);
}

export async function setCategoryActive(id: string, active: boolean): Promise<FormState> {
  return setActive("categories", ROUTE, id, active);
}
