import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { LinkButton, Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { homeFor, ROLE_LABEL, ROLES } from "@/lib/roles";
import { signOut } from "../login/actions";

export const metadata: Metadata = { title: "Minha conta" };

async function Account() {
  const viewer = await requireRole(ROLES, "/conta");
  return (
    <div className="max-w-xl space-y-8">
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="label text-[0.625rem] text-stone">Nome</dt>
          <dd className="mt-1 font-semibold">{viewer.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="label text-[0.625rem] text-stone">E-mail</dt>
          <dd className="mt-1 font-semibold break-all">{viewer.email}</dd>
        </div>
        <div>
          <dt className="label text-[0.625rem] text-stone">Acesso</dt>
          <dd className="mt-1 font-semibold">{ROLE_LABEL[viewer.role]}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        {viewer.role !== "cliente" && <LinkButton href={homeFor(viewer.role)}>Ir para o painel</LinkButton>}
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Panel kicker="Cliente" title="Minha conta">
      <Account />
    </Panel>
  );
}
