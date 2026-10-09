"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { homeFor, isRole, postLoginPath } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; confirmEmail?: boolean; email?: string; name?: string };

const NOT_CONFIGURED = "O login ainda não foi configurado nesta instalação.";
// Mesma mensagem para e-mail desconhecido e senha errada: não revela quem tem conta.
const BAD_CREDENTIALS = "E-mail ou senha incorretos.";

const signInSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
  next: z.string().optional(),
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return { error: BAD_CREDENTIALS, email };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = isRole(profile?.role) ? profile.role : "cliente";
  redirect(postLoginPath(role, parsed.data.next));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, email, name };
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED, email, name };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  // O papel não vem daqui: o banco cria todo mundo como "cliente".
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: "Não foi possível criar a conta. Confira os dados e tente de novo.", email, name };
  if (data.session) redirect(homeFor("cliente"));
  return { confirmEmail: true, email };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
