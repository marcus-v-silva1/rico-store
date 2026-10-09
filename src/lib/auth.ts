import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { homeFor, isRole, type Role } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export type Viewer = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string;
  name: string | null;
  role: Role;
};

/** Quem está logado, com o papel lido do banco (a fonte da verdade). `null` se ninguém. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, email")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile || !isRole(profile.role)) return null;

  return {
    supabase,
    userId: claims.sub,
    email: profile.email ?? (claims.email as string | undefined) ?? "",
    name: profile.display_name,
    role: profile.role,
  };
});

/**
 * Use em toda página e server action protegida. Sem login vai para /login;
 * logado com papel errado volta para a área do próprio papel.
 */
export async function requireRole(allowed: readonly Role[], from = "/conta"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(from)}`);
  if (!allowed.includes(viewer.role)) redirect(homeFor(viewer.role));
  return viewer;
}
