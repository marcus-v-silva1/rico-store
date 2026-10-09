"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean; email?: string };

const emailSchema = z.object({ email: z.email("Informe um e-mail válido.") });

/** Inscrição na newsletter do rodapé. */
export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse({ email: String(formData.get("email") ?? "").trim() });
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: String(formData.get("email") ?? "") };
  const email = parsed.data.email.toLowerCase();

  if (!isSupabaseConfigured()) return { error: "A inscrição ainda não está disponível.", email };
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });
  // 23505 = e-mail já inscrito: para quem se inscreve, o resultado é o mesmo.
  if (error && error.code !== "23505") return { error: "Não foi possível inscrever agora. Tente de novo.", email };
  return { ok: true };
}
