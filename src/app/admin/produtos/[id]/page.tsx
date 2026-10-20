import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { NavLink } from "@/components/nav-link";
import { Panel } from "@/components/panel";
import { requireRole } from "@/lib/auth";
import { LOAD_ERROR, loadFormOptions } from "../form-options";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Editar produto" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole(["admin"], `/admin/produtos/${id}`);
  if (!UUID.test(id)) notFound();

  const [options, productRes, imagesRes] = await Promise.all([
    loadFormOptions(supabase),
    supabase
      .from("products")
      .select(
        `id, slug, name, detail, description, category_id, price_cents, weight_grams, is_new, garment, status,
         product_collections(collection_id),
         variants:product_variants(color_id, size, stock, active)`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", id),
  ]);
  const error = productRes.error ?? imagesRes.error;
  if (error) console.error("EditProduct: falha ao ler o produto", error);
  if (!options || error)
    return (
      <p role="alert" className="text-sm font-semibold text-signal">
        {LOAD_ERROR}
      </p>
    );

  const p = productRes.data;
  if (!p) notFound();

  // Variante inativa = não vende: aparece como célula vazia.
  const active = p.variants.filter((v) => v.active);
  const colorIds = options.colors.map((c) => c.id).filter((c) => active.some((v) => v.color_id === c));
  const stock = Object.fromEntries(active.map((v) => [`${v.color_id}:${v.size}`, String(v.stock)]));
  const photos = imagesRes.count ?? 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone">
        {photos === 0 ? "Sem foto ainda." : photos === 1 ? "1 foto." : `${photos} fotos.`} Para publicar como
        &ldquo;Ativo&rdquo;, o produto precisa de pelo menos uma foto e estoque em uma cor e tamanho.
      </p>
      <ProductForm
        {...options}
        product={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          detail: p.detail,
          description: p.description,
          categoryId: p.category_id,
          priceCents: p.price_cents,
          weightGrams: p.weight_grams,
          isNew: p.is_new,
          garment: p.garment,
          status: p.status,
          collectionIds: p.product_collections.map((c) => c.collection_id),
        }}
        grid={{ colorIds, sizes: active.map((v) => v.size), stock }}
      />
    </div>
  );
}

export default function EditProductPage({ params }: PageProps<"/admin/produtos/[id]">) {
  return (
    <Panel kicker="Administração" title="Editar produto">
      <AdminNav current="produtos" />
      <NavLink href="/admin/produtos" direction="back" className="label mb-8 inline-block text-stone hover:text-ink">
        ← Voltar para produtos
      </NavLink>
      <EditProduct params={params} />
    </Panel>
  );
}
