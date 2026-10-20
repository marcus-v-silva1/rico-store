import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";
import { NavLink } from "@/components/nav-link";
import { Panel } from "@/components/panel";
import { requireRole } from "@/lib/auth";
import { LOAD_ERROR, loadFormOptions } from "../form-options";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Novo produto" };

async function NewProduct() {
  const { supabase } = await requireRole(["admin"], "/admin/produtos/novo");
  const options = await loadFormOptions(supabase);
  if (!options)
    return (
      <p role="alert" className="text-sm font-semibold text-signal">
        {LOAD_ERROR}
      </p>
    );
  if (!options.categories.some((c) => c.active)) {
    return (
      <p className="text-sm text-stone">
        Cadastre uma categoria antes do primeiro produto.{" "}
        <NavLink href="/admin/categorias" className="underline">
          Ir para categorias
        </NavLink>
      </p>
    );
  }
  return <ProductForm {...options} grid={{ colorIds: [], sizes: [], stock: {}, defaultColorId: null }} />;
}

export default function NewProductPage() {
  return (
    <Panel kicker="Administração" title="Novo produto">
      <AdminNav current="produtos" />
      <NavLink href="/admin/produtos" direction="back" className="label mb-8 inline-block text-stone hover:text-ink">
        ← Voltar para produtos
      </NavLink>
      <NewProduct />
    </Panel>
  );
}
