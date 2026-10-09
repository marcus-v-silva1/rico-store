import type { Metadata } from "next";
import { Panel, Stat } from "@/components/panel";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Atendimento" };

async function Desk() {
  // Atendente e administrador. O RLS do banco também só deixa a equipe ler a lista de clientes.
  const { supabase } = await requireRole(["admin", "atendente"], "/atendimento");
  const { data: customers, count } = await supabase
    .from("profiles")
    .select("id, display_name, email, created_at", { count: "exact" })
    .eq("role", "cliente")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-10">
      <div className="grid max-w-md gap-3 sm:grid-cols-2">
        <Stat label="Clientes" value={count ?? 0} />
        <Stat label="Conversas abertas" value="em breve" />
      </div>

      <section aria-labelledby="clientes">
        <h2 id="clientes" className="heading text-xl">
          Clientes recentes
        </h2>
        {customers?.length ? (
          <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
            {customers.map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 text-sm">
                <span className="font-semibold">{c.display_name ?? "Sem nome"}</span>
                <span className="text-stone">{c.email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-stone">Nenhum cliente cadastrado ainda.</p>
        )}
      </section>
    </div>
  );
}

export default function AtendimentoPage() {
  return (
    <Panel kicker="Equipe / atendimento" title="Atendimento">
      <Desk />
    </Panel>
  );
}
