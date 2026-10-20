import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";
import { Panel } from "@/components/panel";
import { requireRole } from "@/lib/auth";
import { TaxonomyForm } from "../taxonomy-form";
import { TaxonomyList } from "../taxonomy-list";
import { GARMENT_LABEL } from "../taxonomy-shared";

export const metadata: Metadata = { title: "Categorias" };

async function Categories() {
  const { supabase } = await requireRole(["admin"], "/admin/categorias");
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, kicker, description, garment, show_on_home, active")
    .order("sort_order")
    .order("id");

  const rows = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    kicker: c.kicker,
    description: c.description,
    garment: c.garment,
    flag: c.show_on_home,
    active: c.active,
    note: `${GARMENT_LABEL[c.garment]}${c.show_on_home ? " · na home" : ""}`,
  }));

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <h2 className="heading mb-4 text-xl">Nova categoria</h2>
        <TaxonomyForm kind="category" />
      </section>
      <TaxonomyList kind="category" rows={rows} empty="Nenhuma categoria ainda." />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Panel kicker="Administração" title="Categorias">
      <AdminNav current="categorias" />
      <Categories />
    </Panel>
  );
}
