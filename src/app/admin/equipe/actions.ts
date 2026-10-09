"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

export type RoleState = { error?: string; ok?: boolean };

const schema = z.object({ userId: z.uuid(), role: z.enum(ROLES) });

/** Troca o papel de uma conta. Só administrador; ninguém muda o próprio papel. */
export async function setRole(_prev: RoleState, formData: FormData): Promise<RoleState> {
  const viewer = await requireRole(["admin"], "/admin/equipe");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Papel inválido." };
  if (parsed.data.userId === viewer.userId) return { error: "Você não pode mudar o seu próprio papel." };

  // O RLS e o gatilho do banco repetem a regra; aqui conferimos se alguma linha mudou de fato.
  const { data, error } = await viewer.supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId)
    .select("id");
  if (error || !data?.length) return { error: "Não foi possível salvar." };

  revalidatePath("/admin/equipe");
  return { ok: true };
}
