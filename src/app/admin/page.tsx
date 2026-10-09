import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { Panel, Stat } from "@/components/panel";
import { requireRole } from "@/lib/auth";
import { ROLE_LABEL, ROLES } from "@/lib/roles";

export const metadata: Metadata = { title: "Painel" };

async function Dashboard() {
  const { supabase } = await requireRole(["admin"], "/admin");
  const counts = await Promise.all(
    ROLES.map(async (role) => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", role);
      return { role, count: count ?? 0 };
    }),
  );

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
        {counts.map(({ role, count }) => (
          <Stat key={role} label={`${ROLE_LABEL[role]}s`} value={count} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/admin/equipe">Gerenciar equipe</LinkButton>
        <LinkButton href="/atendimento" variant="outline">
          Abrir atendimento
        </LinkButton>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Panel kicker="Administração" title="Painel da loja">
      <Dashboard />
    </Panel>
  );
}
