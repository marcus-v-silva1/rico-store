import type { Metadata } from "next";
import Form from "next/form";
import Image from "next/image";
import { AdminNav } from "@/components/admin-nav";
import { Garment } from "@/components/garment";
import { NavLink } from "@/components/nav-link";
import { Panel } from "@/components/panel";
import { Button, LinkButton } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { productImageUrl } from "@/lib/catalog/queries";
import { PRODUCT_STATUSES, type GarmentKind, type ProductStatus } from "@/lib/catalog/types";
import { formatBRL } from "@/lib/money";
import { STATUS_LABEL } from "../taxonomy-shared";

export const metadata: Metadata = { title: "Produtos" };

const ROUTE = "/admin/produtos";
const SITUATIONS = [...PRODUCT_STATUSES, "sem-estoque"] as const;
type Situation = (typeof SITUATIONS)[number];
const SITUATION_LABEL: Record<Situation, string> = { ...STATUS_LABEL, "sem-estoque": "Sem estoque" };
const LOAD_ERROR = "Não foi possível carregar os produtos. Recarregue a página.";

type Search = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

/** `%` e `_` são curingas no ilike; escapa para buscar o texto como foi digitado. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

type Row = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  stock: number;
  status: ProductStatus;
  garment: GarmentKind;
  hex: string;
  photo: string | null;
};

async function Products({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireRole(["admin"], ROUTE);
  const sp = await searchParams;
  const q = one(sp.q);
  const categoria = one(sp.categoria);
  const colecao = one(sp.colecao);
  const situacao = (SITUATIONS as readonly string[]).includes(one(sp.situacao)) ? (one(sp.situacao) as Situation) : "";

  const [categoriesRes, collectionsRes] = await Promise.all([
    supabase.from("categories").select("id, slug, name").order("sort_order").order("id"),
    supabase.from("collections").select("id, slug, title").order("sort_order").order("id"),
  ]);
  if (categoriesRes.error || collectionsRes.error) {
    console.error("Produtos: falha ao ler filtros", categoriesRes.error ?? collectionsRes.error);
    return (
      <p role="alert" className="text-sm font-semibold text-signal">
        {LOAD_ERROR}
      </p>
    );
  }
  const categories = categoriesRes.data;
  const collections = collectionsRes.data;
  const category = categories.find((c) => c.slug === categoria);
  const collection = collections.find((c) => c.slug === colecao);

  let query = supabase
    .from("products")
    .select(
      `id, name, status, price_cents, garment, created_at,
       category:categories(name),
       variants:product_variants(stock, active, color:colors(hex, sort_order)),
       images:product_images(path, sort_order)`,
    )
    .order("created_at", { ascending: false })
    .order("id");
  if (q) query = query.ilike("name", likePattern(q));
  if (categoria) query = query.eq("category_id", category?.id ?? "00000000-0000-0000-0000-000000000000");
  if (situacao && situacao !== "sem-estoque") query = query.eq("status", situacao);
  if (colecao) {
    if (!collection) query = query.in("id", []);
    else {
      const { data: links, error } = await supabase
        .from("product_collections")
        .select("product_id")
        .eq("collection_id", collection.id);
      if (error) {
        console.error("Produtos: falha ao ler coleção", error);
        return (
          <p role="alert" className="text-sm font-semibold text-signal">
            {LOAD_ERROR}
          </p>
        );
      }
      query = query.in(
        "id",
        links.map((l) => l.product_id),
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("Produtos: falha ao ler a lista", error);
    return (
      <p role="alert" className="text-sm font-semibold text-signal">
        {LOAD_ERROR}
      </p>
    );
  }

  let rows: Row[] = data.map((p) => {
    const active = p.variants.filter((v) => v.active);
    const firstColor = active
      .map((v) => v.color)
      .filter((c) => c !== null)
      .sort((a, b) => a.sort_order - b.sort_order)[0];
    const image = [...p.images].sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      id: p.id,
      name: p.name,
      category: p.category?.name ?? "—",
      priceCents: p.price_cents,
      stock: active.reduce((sum, v) => sum + v.stock, 0),
      status: p.status,
      garment: p.garment,
      hex: firstColor?.hex ?? "#121212",
      photo: image ? productImageUrl(image.path) : null,
    };
  });
  if (situacao === "sem-estoque") rows = rows.filter((r) => r.stock === 0);
  const filtered = Boolean(q || categoria || colecao || situacao);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone">
          {rows.length === 1 ? "1 produto" : `${rows.length} produtos`}
          {filtered ? " com esses filtros" : ""}
        </p>
        <LinkButton href="/admin/produtos/novo">Cadastrar produto</LinkButton>
      </div>

      <Form
        action={ROUTE}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
      >
        <div>
          <label htmlFor="busca" className="field-label">
            Buscar por nome
          </label>
          <input id="busca" name="q" type="search" defaultValue={q} className="field" />
        </div>
        <div>
          <label htmlFor="filtro-categoria" className="field-label">
            Categoria
          </label>
          <select id="filtro-categoria" name="categoria" defaultValue={categoria} className="field">
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filtro-colecao" className="field-label">
            Coleção
          </label>
          <select id="filtro-colecao" name="colecao" defaultValue={colecao} className="field">
            <option value="">Todas</option>
            {collections.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filtro-situacao" className="field-label">
            Situação
          </label>
          <select id="filtro-situacao" name="situacao" defaultValue={situacao} className="field">
            <option value="">Todas</option>
            {SITUATIONS.map((s) => (
              <option key={s} value={s}>
                {SITUATION_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-3">
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
          {filtered && (
            <NavLink href={ROUTE} className="label pb-3 text-[0.625rem] text-stone hover:text-ink">
              Limpar
            </NavLink>
          )}
        </div>
      </Form>

      {rows.length === 0 ? (
        <p className="text-sm text-stone">{filtered ? "Nenhum produto com esses filtros." : "Nenhum produto ainda."}</p>
      ) : (
        <ProductTable rows={rows} />
      )}
    </div>
  );
}

const COLS = "md:grid-cols-[4rem_minmax(0,2fr)_minmax(0,1fr)_7rem_6rem_8rem] md:gap-4";

/** Tabela no computador, cartões no celular. A linha inteira leva ao produto. */
function ProductTable({ rows }: { rows: Row[] }) {
  return (
    <div className="border-y border-ink/15">
      <div
        aria-hidden
        className={`label hidden items-center border-b border-ink/15 py-2 text-[0.625rem] text-stone md:grid ${COLS}`}
      >
        <span>Foto</span>
        <span>Nome</span>
        <span>Categoria</span>
        <span className="text-right">Preço</span>
        <span className="text-right">Estoque</span>
        <span>Situação</span>
      </div>
      <ul aria-label="Produtos">
        {rows.map((r) => (
          <li key={r.id} className="border-b border-ink/10 last:border-b-0">
            <NavLink
              href={`${ROUTE}/${r.id}`}
              className={`grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1 py-3 hover:bg-concrete/60 ${COLS}`}
            >
              <span className="relative row-span-4 block size-16 overflow-hidden bg-concrete md:row-span-1">
                {r.photo ? (
                  <Image src={r.photo} alt="" fill sizes="4rem" unoptimized className="object-cover" />
                ) : (
                  <Garment kind={r.garment} color={r.hex} className="absolute inset-[10%] size-[80%]" />
                )}
              </span>
              <span className="truncate text-sm font-semibold">{r.name}</span>
              <span className="truncate text-xs text-stone md:text-sm md:text-ink">{r.category}</span>
              <span className="text-sm md:text-right">
                {formatBRL(r.priceCents)}
                <span className="text-stone md:hidden"> · estoque {r.stock}</span>
              </span>
              <span
                className={`hidden text-sm md:block md:text-right ${r.stock === 0 ? "font-semibold text-signal" : ""}`}
              >
                {r.stock}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={`label inline-block border px-2 py-0.5 text-[0.5625rem] ${
                    r.status === "ativo"
                      ? "border-olive text-olive"
                      : r.status === "arquivado"
                        ? "border-stone text-stone"
                        : "border-ink text-ink"
                  }`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
                {r.stock === 0 && <span className="label text-[0.5625rem] text-signal">Sem estoque</span>}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/admin/produtos">) {
  return (
    <Panel kicker="Administração" title="Produtos">
      <AdminNav current="produtos" />
      <Products searchParams={searchParams} />
    </Panel>
  );
}
