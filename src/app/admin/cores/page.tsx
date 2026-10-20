import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";
import { Panel } from "@/components/panel";
import { requireRole } from "@/lib/auth";
import { TaxonomyForm } from "../taxonomy-form";
import { TaxonomyList } from "../taxonomy-list";

export const metadata: Metadata = { title: "Cores" };

async function Colors() {
  const { supabase } = await requireRole(["admin"], "/admin/cores");
  const { data } = await supabase.from("colors").select("id, label, slug, hex, active").order("sort_order").order("id");

  const rows = (data ?? []).map((c) => ({
    id: c.id,
    name: c.label,
    slug: c.slug,
    hex: c.hex,
    active: c.active,
    note: c.hex,
  }));

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <h2 className="heading mb-4 text-xl">Nova cor</h2>
        <TaxonomyForm kind="color" />
      </section>
      <TaxonomyList kind="color" rows={rows} empty="Nenhuma cor ainda." />
    </div>
  );
}

export default function ColorsPage() {
  return (
    <Panel kicker="Administração" title="Cores">
      <AdminNav current="cores" />
      <Colors />
    </Panel>
  );
}
