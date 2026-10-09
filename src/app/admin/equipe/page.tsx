import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { requireRole } from "@/lib/auth";
import { RoleForm } from "./role-form";

export const metadata: Metadata = { title: "Equipe" };

async function Team() {
  const { supabase, userId } = await requireRole(["admin"], "/admin/equipe");
  const { data: people } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="max-w-3xl">
      <p className="mb-6 text-sm text-ink/80">
        Quem se cadastra entra como cliente. Promova a conta para atendente ou administrador aqui.
      </p>
      <ul className="divide-y divide-ink/15 border-y border-ink/15">
        {people?.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {p.display_name ?? "Sem nome"}
                {p.id === userId && <span className="label ml-2 text-[0.625rem] text-stone">você</span>}
              </p>
              <p className="truncate text-xs text-stone">{p.email}</p>
            </div>
            <RoleForm userId={p.id} role={p.role} disabled={p.id === userId} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TeamPage() {
  return (
    <Panel kicker="Administração" title="Equipe">
      <Team />
    </Panel>
  );
}
