import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { NavLink } from "@/components/nav-link";
import { Panel } from "@/components/panel";
import { requireRole } from "@/lib/auth";
import { productImageUrl } from "@/lib/catalog/queries";
import { LOAD_ERROR, loadFormOptions } from "../form-options";
import { ProductForm } from "../product-form";
import { Photos } from "./photos";

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
        `id, slug, name, detail, description, category_id, price_cents, weight_grams, is_new, garment, status, default_color_id,
         product_collections(collection_id),
         variants:product_variants(color_id, size, stock, active)`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("product_images")
      .select("id, path, color_id, alt")
      .eq("product_id", id)
      .order("sort_order")
      .order("created_at"),
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
  const photos = imagesRes.data ?? [];
  const count = photos.length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone">
        {count === 0 ? "Sem foto ainda." : count === 1 ? "1 foto." : `${count} fotos.`} Para publicar como
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
        grid={{ colorIds, sizes: active.map((v) => v.size), stock, defaultColorId: p.default_color_id }}
      />
      <Photos
        productId={p.id}
        productName={p.name}
        colors={options.colors}
        photos={photos.map((i) => ({ id: i.id, url: productImageUrl(i.path), colorId: i.color_id, alt: i.alt }))}
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
