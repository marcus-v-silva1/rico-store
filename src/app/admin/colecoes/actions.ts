"use server";

import { collectionFormSchema } from "@/lib/catalog/schemas";
import { moveRow, saveRow, setActive, type FormState } from "../taxonomy-server";

const ROUTE = "/admin/colecoes";

export async function saveCollection(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow({
    table: "collections",
    route: ROUTE,
    schema: collectionFormSchema,
    formData,
    checkboxes: ["showInNav"],
    labels: { title: "Título", slug: "Endereço", kicker: "Chamada", description: "Descrição" },
    toRow: (d) => ({
      title: d.title,
      slug: d.slug,
      kicker: d.kicker,
      description: d.description,
      show_in_nav: d.showInNav,
    }),
  });
}

export async function moveCollection(id: string, direction: "up" | "down"): Promise<FormState> {
  return moveRow("collections", ROUTE, id, direction);
}

export async function setCollectionActive(id: string, active: boolean): Promise<FormState> {
  return setActive("collections", ROUTE, id, active);
}
