import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";
import { Panel } from "@/components/panel";
import { requireRole } from "@/lib/auth";
import { TaxonomyForm } from "../taxonomy-form";
import { TaxonomyList } from "../taxonomy-list";

export const metadata: Metadata = { title: "Coleções" };

async function Collections() {
  const { supabase } = await requireRole(["admin"], "/admin/colecoes");
  const { data } = await supabase
    .from("collections")
    .select("id, title, slug, kicker, description, show_in_nav, active")
    .order("sort_order")
    .order("id");

  const rows = (data ?? []).map((c) => ({
    id: c.id,
    name: c.title,
    slug: c.slug,
    kicker: c.kicker,
    description: c.description,
    flag: c.show_in_nav,
    active: c.active,
    note: c.show_in_nav ? "no menu" : undefined,
  }));

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <h2 className="heading mb-4 text-xl">Nova coleção</h2>
        <TaxonomyForm kind="collection" />
      </section>
      <TaxonomyList kind="collection" rows={rows} empty="Nenhuma coleção ainda." />
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Panel kicker="Administração" title="Coleções">
      <AdminNav current="colecoes" />
      <Collections />
    </Panel>
  );
}
