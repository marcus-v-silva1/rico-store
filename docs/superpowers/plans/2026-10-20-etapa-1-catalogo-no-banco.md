# Etapa 1 — Catálogo no banco: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tirar o catálogo de `src/content/catalog.ts` e colocá-lo no Supabase, com a loja pública lendo do banco (igual por fora) e um painel de admin para cadastrar produtos, variantes (cor × tamanho), fotos, categorias, coleções e cores.

**Architecture:** Tabelas novas com RLS numa migration; uma função SQL `admin_save_product(jsonb)` grava produto, coleções e variantes numa transação só. A loja pública lê por um cliente Supabase sem cookies dentro de funções `'use cache'` com a tag `catalogo`; toda Server Action do admin chama `updateTag("catalogo")`. Fotos vão do navegador do admin direto para o bucket `produtos` do Storage (RLS só deixa admin escrever); a action só registra o caminho.

**Tech Stack:** Next 16.4 (App Router, Cache Components, Server Actions), React 19.3, Supabase (Postgres 17, Storage, RLS, pgTAP), zod 4, vitest 5, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-10-20-loja-completa-design.md` — seções 2.1, 2.4, 4.1 (menos `/admin/frete`), 4.3, 8, 9 e 10 (etapa 1).

## Global Constraints

- Antes de concluir cada tarefa: `npm run lint && npm run typecheck && npm test && npm run build`. Tarefas com SQL também: `npm run test:db`.
- Next 16 com Cache Components: `cookies`, `params` e `searchParams` ficam dentro de `<Suspense>`; funções `'use cache'` nunca chamam `cookies()`/`headers()` (nem indiretamente). Leia `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` e `.../03-api-reference/04-functions/updateTag.md` antes da Tarefa 4.
- Com Cache Components, `generateStaticParams` precisa devolver pelo menos um item.
- Toda página do admin chama `requireRole(["admin"], "<rota>")` (`src/lib/auth.ts`); toda Server Action do admin também. O RLS do banco é a barreira final.
- Nunca ler papel de `user_metadata`.
- Valores em centavos (`integer`). Textos da interface em português, voz ativa, sem jargão.
- Visual: tokens de `src/app/globals.css`, cantos retos, borda de 1px, rótulos em `.label`, sem sombra nem gradiente decorativo (`docs/identidade-visual.md`).
- Transição: links "para frente" com `NavLink` (padrão `forward`), "voltar" com `direction="back"`; toda `page.tsx` envolve o conteúdo em `PageTransition` (o `Panel` já faz isso).
- Nenhuma dependência nova de runtime nesta etapa.
- Fotos: JPEG, PNG ou WebP, até 5 MB.
- Sem Supabase configurado (`isSupabaseConfigured() === false`), as consultas do catálogo devolvem vazio e a loja mostra "Ainda não há peças aqui. Volte em breve." em vez de quebrar.

## Review Focus

1. **Slug repetido** ao criar produto com nome já usado → a action devolve "Já existe um produto com esse endereço. Mude o nome ou o endereço." e nada é gravado (teste na Tarefa 7, `describeSaveError`).
2. **Estoque inválido na grade** (`"abc"`, `-1`, `2.5`, espaços) → a célula é rejeitada com a mensagem da célula; célula vazia não vira variante (teste na Tarefa 3, `parseVariantGrid`).
3. **Célula esvaziada de uma variante existente** → a variante fica `active = false`, não é apagada (pedidos da etapa 2 vão apontar para ela) (teste na Tarefa 1, pgTAP).
4. **Produto ativo com todo estoque zerado ou só variantes inativas** → aparece na loja como "Esgotado", botão desabilitado; cores sem estoque somem das bolinhas (teste na Tarefa 3, `mapProductRow`).
5. **Arquivo que não é imagem ou maior que 5 MB** → recusado no navegador antes do envio com mensagem clara, e o bucket também recusa (teste na Tarefa 3, `checkImageFile`; bucket na Tarefa 1).

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `supabase/migrations/20261020000000_catalog.sql` | Tabelas, RLS, bucket, `admin_save_product` |
| `supabase/tests/catalog_rls_test.sql`, `supabase/tests/save_product_test.sql` | pgTAP |
| `supabase/seed.sql` | Catálogo inicial (os 12 produtos atuais) |
| `src/lib/catalog/types.ts` | Tipos do catálogo usados pela loja e pelo admin |
| `src/lib/catalog/map.ts` | `mapProductRow` (linha do banco → `CatalogProduct`) |
| `src/lib/catalog/slug.ts` | `slugify`, `buildSku` |
| `src/lib/catalog/sizes.ts` | `SIZE_PRESETS`, `sortSizes` |
| `src/lib/catalog/variant-grid.ts` | `parseVariantGrid` |
| `src/lib/catalog/publish.ts` | `publishProblems` |
| `src/lib/catalog/images.ts` | `checkImageFile`, `imagePath` |
| `src/lib/catalog/schemas.ts` | schemas zod dos formulários do admin |
| `src/lib/catalog/errors.ts` | `describeSaveError` |
| `src/lib/supabase/public.ts` | cliente Supabase sem cookies (server-only) |
| `src/lib/catalog/queries.ts` | leituras da loja com `'use cache'` |
| `src/components/admin-nav.tsx` | navegação do admin |
| `src/app/admin/{categorias,colecoes,cores}/…` | CRUD das listas |
| `src/app/admin/produtos/…` | lista, formulário, fotos |
| `src/app/categoria/[slug]/page.tsx` | página de categoria (nova) |

---

### Task 1: Schema do catálogo, RLS, bucket e `admin_save_product`

**Files:**
- Create: `supabase/migrations/20261020000000_catalog.sql`
- Create: `supabase/tests/catalog_rls_test.sql`, `supabase/tests/save_product_test.sql`
- Modify: `package.json` (scripts), `src/lib/supabase/database.types.ts` (gerado)

**Interfaces:**
- Produces (SQL):
  - `public.garment_kind` enum: `'jacket','hoodie','tee','pants','shorts','cap','sneaker','bag'`
  - `public.product_status` enum: `'rascunho','ativo','arquivado'`
  - `categories(id uuid pk, slug text unique, name text, kicker text, description text, garment garment_kind, show_on_home bool default false, sort_order int default 0, active bool default true, created_at)`
  - `collections(id uuid pk, slug text unique, title text, kicker text, description text, show_in_nav bool default false, sort_order int default 0, active bool default true, created_at)`
  - `colors(id uuid pk, slug text unique, label text, hex text check (hex ~ '^#[0-9a-f]{6}$'), sort_order int default 0, active bool default true)`
  - `products(id uuid pk, slug text unique, name text, detail text default '', description text default '', category_id uuid fk restrict, price_cents int check > 0, weight_grams int check > 0 default 300, is_new bool default false, garment garment_kind, status product_status default 'rascunho', created_at, updated_at)`
  - `product_collections(product_id fk cascade, collection_id fk restrict, pk (product_id, collection_id))`
  - `product_variants(id uuid pk, product_id fk cascade, color_id fk restrict, size text check (length(trim(size)) between 1 and 8), sku text unique, stock int check >= 0 default 0, active bool default true, unique (product_id, color_id, size))`
  - `product_images(id uuid pk, product_id fk cascade, color_id uuid null fk set null, path text unique, alt text default '', sort_order int default 0, created_at)`
  - Slugs: `check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')` em `categories`, `collections`, `colors`, `products`.
  - `public.admin_save_product(p jsonb) returns uuid` — `security invoker`, `set search_path = ''`. Payload:
    ```json
    { "id": "uuid|null", "slug": "", "name": "", "detail": "", "description": "", "category_id": "uuid",
      "price_cents": 0, "weight_grams": 0, "is_new": false, "garment": "tee", "status": "rascunho",
      "collection_ids": ["uuid"], "variants": [{ "color_id": "uuid", "size": "M", "sku": "", "stock": 0 }] }
    ```
    Se `current_app_role() <> 'admin'` → `raise exception ... using errcode = '42501'`. Insere ou atualiza o produto (`updated_at = now()`), substitui `product_collections`, faz upsert das variantes por (`product_id`, `color_id`, `size`) com `active = true`, e marca `active = false` nas variantes do produto que não vieram no payload. Devolve o id.
  - Bucket `produtos`: `public = true`, `file_size_limit = 5242880`, `allowed_mime_types = {'image/jpeg','image/png','image/webp'}`.
- Scripts em `package.json`: `"test:db": "supabase test db"`, `"db:types": "supabase gen types typescript --local > src/lib/supabase/database.types.ts"`.

RLS (todas as tabelas acima com RLS ligado):
- `categories`, `collections`, `colors`: `select` para `anon, authenticated` com `active or current_app_role() = 'admin'`; `insert/update/delete` só `current_app_role() = 'admin'`.
- `products`: `select` para `anon, authenticated` com `status = 'ativo' or current_app_role() in ('admin','atendente')`; escrita só admin.
- `product_variants`, `product_images`, `product_collections`: `select` quando o produto é visível pela política acima (`exists (select 1 from public.products p where p.id = product_id)` — o RLS de `products` já filtra); escrita só admin.
- `storage.objects` no bucket `produtos`: `insert/update/delete` para `authenticated` com `bucket_id = 'produtos' and current_app_role() = 'admin'`. A leitura vem do bucket público.

- [ ] **Step 1: Escrever os testes pgTAP que falham**

`supabase/tests/catalog_rls_test.sql` (use `begin; select plan(n); … select * from finish(); rollback;`). Crie dois usuários em `auth.users` (o gatilho cria os perfis), promova um a admin com `update public.profiles set role = 'admin'` (sem `auth.uid()` a trava não se aplica), e alterne com `set local role authenticated; set local request.jwt.claims = '{"sub":"<id>","role":"authenticated"}'` / `set local role anon`. Asserções:
- `anon` lê um produto `ativo` e **não** lê um `rascunho` (`is((select count(*) from products where slug = 'rascunho-x'), 0::bigint)`).
- `anon` não insere em `categories` (`throws_ok(... , '42501')`).
- cliente não atualiza `products.price_cents` (`update` afeta 0 linhas: `is((with u as (update ... returning 1) select count(*) from u), 0::bigint)`).
- admin insere em `colors` e lê `rascunho`.
- `colors` com `active = false` some para `anon`.

`supabase/tests/save_product_test.sql`, como admin:
- `admin_save_product` com 2 variantes (preto/M estoque 3, preto/G estoque 0) devolve um uuid e cria 2 linhas em `product_variants`.
- salvar de novo o mesmo produto só com preto/M estoque 5 → preto/M `stock = 5, active = true`; preto/G continua existindo com `active = false` (`is((select count(*) from product_variants where product_id = $id), 2::bigint)`).
- `collection_ids` trocado de [A] para [B] deixa só B em `product_collections`.
- slug repetido em produto novo → `throws_ok(..., '23505')`.
- como cliente → `throws_ok(..., '42501')`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run db:start` (se ainda não estiver de pé) e `npm run test:db`
Expected: FAIL — `relation "public.products" does not exist`.

- [ ] **Step 3: Escrever a migration `20261020000000_catalog.sql`**

Siga o estilo de `supabase/migrations/20261009000000_init_roles.sql`: comentários curtos em português, `(select public.current_app_role())` nas políticas, `set search_path = ''` nas funções. O bucket: `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (...) on conflict (id) do nothing;`. Gatilho `set_updated_at` em `products`.

- [ ] **Step 4: Aplicar e rodar os testes**

Run: `npm run db:reset && npm run test:db`
Expected: PASS em todos os testes de `supabase/tests/`.

- [ ] **Step 5: Gerar os tipos**

Run: `npm run db:types && npm run typecheck`
Expected: `database.types.ts` passa a conter `products`, `product_variants`, `admin_save_product`; typecheck passa. Tire o comentário "Escrito à mão…" do topo (o arquivo agora é gerado).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261020000000_catalog.sql supabase/tests package.json src/lib/supabase/database.types.ts
git commit -m "feat(db): tabelas do catálogo, RLS, bucket de fotos e admin_save_product"
```

---

### Task 2: Seed do catálogo atual

**Files:**
- Modify: `supabase/seed.sql`
- Create: `supabase/tests/seed_test.sql`

**Interfaces:**
- Consumes: tabelas da Task 1.
- Produces: dados com os mesmos slugs de hoje, que a Task 5 usa.

Conteúdo (tirado de `src/content/catalog.ts`; mantenha o comentário do 1º admin no topo):
- `colors`: preto `#121212`, branco `#f6f5f1`, cinza `#9a9a95`, oliva `#5b6240`, vinho `#7a1f24`, azul `#46608f` (nessa ordem em `sort_order`).
- `collections` (`show_in_nav = true`, nessa ordem): street, casual, trabalho, sneakers, acessorios — com `title`, `kicker` e `description` iguais aos de `COLLECTIONS`.
- `categories`: moletons-e-jaquetas (jacket), camisetas (tee), calcas-e-bermudas (pants), sneakers (sneaker), acessorios (cap) — com `name`, `kicker`, `description` de `COLLECTIONS`; `show_on_home = true` nas quatro primeiras, na ordem de `HOME_CATEGORIES`.
- `products`: os 12, `status = 'ativo'`, mesmos `slug`, `name`, `detail`, `price_cents`, `is_new`, `garment`, `category`. Coleções: a linha (`street`/`casual`/`trabalho`) e mais `sneakers` ou `acessorios` quando a categoria for essa.
- `product_variants`: para cada cor de `colors` do produto, tamanhos por categoria — roupas `P, M, G, GG`; sneakers `38, 39, 40, 41, 42, 43`; acessórios `U` — estoque 5, SKU `slug-cor-tamanho` em minúsculas (`camiseta-oversized-branco-m`).
- Use ids fixos ou subconsultas por slug; o seed precisa rodar limpo em `db reset`.

- [ ] **Step 1: Escrever `seed_test.sql` que falha**

Asserções: 12 produtos ativos; 6 cores; cada coleção com `show_in_nav` tem pelo menos 1 produto ativo; cada categoria com `show_on_home` tem pelo menos 1 produto ativo; `select count(*) from product_variants where sku <> lower(sku)` = 0; o produto `jaqueta-puffer` tem 12 variantes (3 cores × 4 tamanhos).

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:db`
Expected: FAIL em `seed_test.sql` (0 produtos).

- [ ] **Step 3: Escrever o seed**

- [ ] **Step 4: Rodar**

Run: `npm run db:reset && npm run test:db`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed.sql supabase/tests/seed_test.sql
git commit -m "feat(db): seed com o catálogo atual da loja"
```

---

### Task 3: Módulos puros do catálogo

**Files:**
- Create: `src/lib/catalog/{types,map,slug,sizes,variant-grid,publish,images,schemas}.ts`
- Create: `tests/unit/catalog-map.test.ts`, `tests/unit/catalog-forms.test.ts`
- Modify: `tests/unit/catalog.test.ts` → renomear para `tests/unit/money.test.ts`, mantendo só o bloco "dinheiro" (o resto testava `catalog.ts`, que sai na Task 5)

**Interfaces:**
- Produces:
  ```ts
  // types.ts
  export const GARMENT_KINDS = ["jacket","hoodie","tee","pants","shorts","cap","sneaker","bag"] as const;
  export type GarmentKind = (typeof GARMENT_KINDS)[number];
  export const PRODUCT_STATUSES = ["rascunho","ativo","arquivado"] as const;
  export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
  export type CatalogColor = { slug: string; label: string; hex: string };
  export type CatalogImage = { url: string; alt: string; colorSlug: string | null };
  export type CatalogProduct = {
    id: string; slug: string; name: string; detail: string; priceCents: number; isNew: boolean;
    garment: GarmentKind; categorySlug: string;
    colors: CatalogColor[];   // só cores com alguma variante ativa com estoque > 0, por sort_order
    images: CatalogImage[];   // por sort_order
    soldOut: boolean;         // nenhuma variante ativa com estoque > 0
  };
  export type ProductRow = { /* formato devolvido pelo select de queries.ts (Task 4) */
    id: string; slug: string; name: string; detail: string; price_cents: number; is_new: boolean;
    garment: GarmentKind; category: { slug: string } | null;
    variants: { stock: number; active: boolean; color: { slug: string; label: string; hex: string; sort_order: number; active: boolean } | null }[];
    images: { path: string; alt: string; sort_order: number; color: { slug: string } | null }[];
  };
  // map.ts
  export function mapProductRow(row: ProductRow, publicUrl: (path: string) => string): CatalogProduct;
  // slug.ts
  export function slugify(text: string): string;
  export function buildSku(productSlug: string, colorSlug: string, size: string): string;
  // sizes.ts
  export const SIZE_PRESETS: { roupa: readonly string[]; calcado: readonly string[]; unico: readonly string[] };
  export function sortSizes(sizes: readonly string[]): string[];
  // variant-grid.ts
  export type GridCell = { colorId: string; size: string; raw: string };
  export type GridVariant = { colorId: string; size: string; stock: number };
  export function parseVariantGrid(cells: readonly GridCell[]):
    { ok: true; variants: GridVariant[] } | { ok: false; errors: { colorId: string; size: string; message: string }[] };
  // publish.ts
  export function publishProblems(p: { variants: { stock: number }[]; imageCount: number }): string[];
  // images.ts
  export const IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
  export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
  export function checkImageFile(f: { type: string; size: number }): string | null;
  export function imagePath(productId: string, fileName: string, id: string): string; // `${productId}/${id}.${ext}`
  // schemas.ts
  export const productFormSchema;      // z.object — campos de Dados do produto (spec 4.1)
  export const categoryFormSchema; export const collectionFormSchema; export const colorFormSchema;
  ```
- `sizes`: `SIZE_PRESETS.roupa = ["PP","P","M","G","GG","XG"]`, `calcado = ["34".."46"]` (de 1 em 1), `unico = ["U"]`. `sortSizes` põe na ordem dos presets e o que não estiver neles depois, em ordem alfabética, sem repetir.

- [ ] **Step 1: Escrever os testes que falham**

`tests/unit/catalog-map.test.ts`:
```ts
it("cores sem estoque somem e o produto continua à venda", () => {
  const p = mapProductRow(row({ variants: [v("preto", 2), v("cinza", 0)] }), url);
  expect(p.colors.map((c) => c.slug)).toEqual(["preto"]);
  expect(p.soldOut).toBe(false);
});
it("todo estoque zerado ou só variantes inativas vira esgotado", () => {
  expect(mapProductRow(row({ variants: [v("preto", 0)] }), url).soldOut).toBe(true);
  expect(mapProductRow(row({ variants: [v("preto", 4, { active: false })] }), url).soldOut).toBe(true);
});
it("cor desativada não aparece mesmo com estoque", () => {
  expect(mapProductRow(row({ variants: [v("vinho", 3, { colorActive: false })] }), url).colors).toEqual([]);
});
it("cores e fotos seguem sort_order e a foto vira URL pública", () => {
  // variantes azul(sort 5) antes de preto(sort 0) no array → colors = [preto, azul]
  // images path "a/1.webp" sort 1 e "a/0.webp" sort 0 → urls na ordem 0, 1, via url()
});
it("cor repetida em vários tamanhos aparece uma vez", () => { /* preto M e preto G → 1 cor */ });
```
(`row`, `v` e `url = (p) => "https://cdn/" + p` são helpers locais do arquivo de teste.)

`tests/unit/catalog-forms.test.ts`:
```ts
expect(slugify("Calça Cargo  Baggy!")).toBe("calca-cargo-baggy");
expect(slugify("  Boné — aba curva ")).toBe("bone-aba-curva");
expect(buildSku("camiseta-oversized", "branco", " m ")).toBe("camiseta-oversized-branco-m");
expect(sortSizes(["G", "XG", "P", "M", "38", "Único", "P"])).toEqual(["P", "M", "G", "XG", "38", "Único"]);
expect(parseVariantGrid([cell("a", "M", "3"), cell("a", "G", "")])).toEqual({ ok: true, variants: [{ colorId: "a", size: "M", stock: 3 }] });
expect(parseVariantGrid([cell("a", "M", " 0 ")])).toEqual({ ok: true, variants: [{ colorId: "a", size: "M", stock: 0 }] });
for (const bad of ["abc", "-1", "2.5", "1e3"]) {
  const r = parseVariantGrid([cell("a", "M", bad)]);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.errors[0]).toMatchObject({ colorId: "a", size: "M", message: "Use um número inteiro, 0 ou mais." });
}
expect(publishProblems({ variants: [{ stock: 0 }], imageCount: 0 })).toEqual([
  "Cadastre estoque em pelo menos uma cor e tamanho.",
  "Envie pelo menos uma foto.",
]);
expect(publishProblems({ variants: [{ stock: 1 }], imageCount: 1 })).toEqual([]);
expect(checkImageFile({ type: "image/webp", size: 1000 })).toBeNull();
expect(checkImageFile({ type: "application/pdf", size: 1000 })).toBe("Envie uma foto em JPEG, PNG ou WebP.");
expect(checkImageFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toBe("A foto passa de 5 MB. Diminua e envie de novo.");
expect(imagePath("p1", "Foto Final.JPG", "x9")).toBe("p1/x9.jpg");
expect(productFormSchema.safeParse({ ...validProduct, priceCents: 0 }).success).toBe(false);
expect(productFormSchema.safeParse({ ...validProduct, slug: "Com Espaço" }).success).toBe(false);
expect(colorFormSchema.safeParse({ slug: "grafite", label: "Grafite", hex: "#2A2A2A" }).data?.hex).toBe("#2a2a2a");
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/catalog-map.test.ts tests/unit/catalog-forms.test.ts`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar os módulos**

`slugify`: `normalize("NFD")`, tira acentos, minúsculas, troca tudo que não for `[a-z0-9]` por `-`, colapsa e apara hífens. `productFormSchema` recebe o preço em centavos (`priceCents`), já convertido pelo formulário (Task 7), e valida: `name` 2–80, `slug` pelo regex da Task 1, `detail` ≤ 60, `description` ≤ 2000, `categoryId` uuid, `priceCents` inteiro > 0, `weightGrams` inteiro > 0, `isNew` boolean, `garment` em `GARMENT_KINDS`, `status` em `PRODUCT_STATUSES`, `collectionIds` array de uuid. `colorFormSchema` aceita hex `#RRGGBB` e converte para minúsculas.

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS (inclui `money.test.ts` e `roles.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/catalog tests/unit
git commit -m "feat(catalogo): tipos, mapeamento, slug, grade de variantes e validações"
```

---

### Task 4: Camada de leitura da loja

**Files:**
- Create: `src/lib/supabase/public.ts`, `src/lib/catalog/queries.ts`

**Interfaces:**
- Consumes: `mapProductRow`, `ProductRow`, `CatalogProduct` (Task 3); `isSupabaseConfigured`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`src/lib/env.ts`).
- Produces:
  ```ts
  // public.ts  ("server-only")
  export function createPublicClient(): SupabaseClient<Database>; // @supabase/supabase-js createClient, persistSession: false, sem cookies
  // queries.ts  ("server-only")
  export const CATALOG_TAG = "catalogo";
  export type NavItem = { slug: string; title: string };
  export type CatalogPage = { slug: string; title: string; kicker: string; description: string; products: CatalogProduct[] };
  export function getNavCollections(): Promise<NavItem[]>;              // active + show_in_nav, por sort_order
  export function getCollections(): Promise<NavItem[]>;                 // todas ativas, por sort_order
  export function getCollectionPage(slug: string): Promise<CatalogPage | null>;
  export function getCategoryPage(slug: string): Promise<CatalogPage | null>; // title = categories.name
  export function getHomeCategories(): Promise<{ slug: string; name: string; garment: GarmentKind }[]>;
  export function getFeaturedProducts(limit?: number): Promise<CatalogProduct[]>; // padrão 8, novos primeiro, depois created_at
  export function getCollectionSlugs(): Promise<string[]>;
  export function getCategorySlugs(): Promise<string[]>;
  export function productImageUrl(path: string): string; // `${SUPABASE_URL}/storage/v1/object/public/produtos/${path}`
  ```

Cada função exportada que lê o banco começa com `'use cache'`, `cacheTag(CATALOG_TAG)` e `cacheLife("hours")`, e devolve `[]`/`null` quando `!isSupabaseConfigured()`. Produtos de páginas e destaques vêm com `status = 'ativo'`, categoria ativa, e o `select` no formato de `ProductRow` (relacionamentos `category:categories(slug)`, `variants:product_variants(stock, active, color:colors(slug, label, hex, sort_order, active))`, `images:product_images(path, alt, sort_order, color:colors(slug))`). Filtro por coleção usa `product_collections!inner(collection_id)`. Coleção ou categoria inexistente **ou inativa** → `null`. Erro do Supabase → lance (`throw new Error(...)`); não guarde erro em cache como lista vazia.

- [ ] **Step 1: Implementar `public.ts` e `queries.ts`**

Não há teste unitário aqui (é I/O; a lógica está em `mapProductRow`). A verificação é o Step 2 e a Task 5.

- [ ] **Step 2: Conferir contra o banco local**

Run: `npm run typecheck`, e um script descartável no scratchpad (não commitar) ou a página da Task 5.
Expected: `getNavCollections()` → 5 itens na ordem street, casual, trabalho, sneakers, acessorios; `getCollectionPage("nao-existe")` → `null`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/public.ts src/lib/catalog/queries.ts
git commit -m "feat(catalogo): leituras da loja com use cache e tag catalogo"
```

---

### Task 5: Loja pública lendo do banco

**Files:**
- Modify: `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/app/page.tsx`, `src/app/colecao/[slug]/page.tsx`, `src/components/product-card.tsx`, `src/components/cart.ts`, `src/components/garment.tsx`, `next.config.ts`, `.env.example`, `README.md` (se citar `catalog.ts`)
- Create: `src/app/categoria/[slug]/page.tsx`, `src/components/collection-view.tsx`
- Delete: `src/content/catalog.ts`

**Interfaces:**
- Consumes: tudo de `queries.ts` (Task 4); `CatalogProduct`, `GarmentKind` (Task 3).
- Produces:
  - `ProductCard({ product }: { product: CatalogProduct })`.
  - `CollectionView({ page, strip, activeSlug, basePath }: { page: CatalogPage; strip: NavItem[]; activeSlug: string; basePath: "/colecao" | "/categoria" })` — o corpo atual de `Collection` em `colecao/[slug]/page.tsx`, reaproveitado pelas duas rotas.
  - `addToCart(slug: string, colorSlug: string)`; `CartItem = { slug: string; color: string; qty: number }` (a troca para `variantId` é da etapa 2).

Comportamento:
- `SiteHeader` e `SiteFooter` viram `async` e leem `getNavCollections()` (dado em cache, entra no shell estático).
- Home: `getHomeCategories()` nos cartões (link para `/categoria/<slug>`, `Garment` de `garment`) e `getFeaturedProducts(8)` em Novidades.
- `/colecao/[slug]`: `generateStaticParams` com `getCollectionSlugs()`; se vier vazio, `[{ slug: "street" }]` (Cache Components exige 1 item; o slug inexistente cai em `notFound()`). Faixa de outras coleções usa `getCollections()`.
- `/categoria/[slug]`: igual, com `getCategoryPage`, `getCategorySlugs()` (fallback `[{ slug: "camisetas" }]`) e a faixa listando `getCollections()` com `basePath="/colecao"`.
- `ProductCard`: foto = primeira imagem da cor escolhida, senão a primeira imagem, senão `Garment`. Use `Photo` com `src` para a foto (mantendo o fundo `concrete` e a proporção 4:5). `soldOut` → etiqueta "Esgotado" no lugar de "Novo" e botão desabilitado "Esgotado". Sem cores com estoque, não mostre as bolinhas.
- `next.config.ts`: `images.remotePatterns` com o host de `NEXT_PUBLIC_SUPABASE_URL` e `pathname: "/storage/v1/object/public/produtos/**"`; `redirects()` permanentes de `/colecao/moletons-e-jaquetas`, `/colecao/camisetas`, `/colecao/calcas-e-bermudas` para `/categoria/<mesmo slug>`.
- `garment.tsx` importa `GarmentKind` de `@/lib/catalog/types`.
- `.env.example`: troque "Sem estas variáveis a vitrine funciona…" por "Sem estas variáveis o site abre, mas sem produtos, login ou cadastro."

- [ ] **Step 1: Trocar os imports e apagar `src/content/catalog.ts`**

Run: `npm run typecheck`
Expected: FAIL listando cada arquivo que ainda importa `@/content/catalog` — é a lista de trabalho deste passo.

- [ ] **Step 2: Implementar as mudanças acima até o typecheck passar**

Run: `npm run lint && npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 3: Build com o banco local**

Run: `npm run build`
Expected: PASS, sem erro de `blocking-route` nem de `generateStaticParams`; `/colecao/[slug]` e `/categoria/[slug]` prerenderizadas.

- [ ] **Step 4: Conferir no navegador**

Run: `npm run dev` e abrir `/`, `/colecao/street`, `/categoria/camisetas`, `/colecao/camisetas`, `/colecao/nao-existe`.
Expected: home igual à de antes (mesmos 4 cartões e 8 novidades); menu com as 5 coleções; `/colecao/camisetas` redireciona para `/categoria/camisetas`; slug inexistente mostra a página 404; "Adicionar" ainda soma na sacola. No SQL Editor, zere o estoque de `bone-aba-curva` e confirme "Esgotado" depois de reiniciar o `npm run dev` (mudança direta no banco não passa pelo `updateTag`; pelo painel, na Task 7, a loja atualiza na hora).

- [ ] **Step 5: Commit**

```bash
git add -A src next.config.ts .env.example README.md
git commit -m "feat(loja): vitrine lê o catálogo do banco e ganha páginas de categoria"
```

---

### Task 6: Navegação do admin e listas (categorias, coleções, cores)

**Files:**
- Create: `src/components/admin-nav.tsx`
- Create: `src/app/admin/categorias/{page,actions}.tsx|ts`, `src/app/admin/colecoes/{page,actions}`, `src/app/admin/cores/{page,actions}`, `src/app/admin/taxonomy-form.tsx`
- Modify: `src/app/admin/page.tsx`, `src/app/admin/equipe/page.tsx` (incluir `AdminNav`)

**Interfaces:**
- Consumes: `categoryFormSchema`, `collectionFormSchema`, `colorFormSchema`, `slugify` (Task 3); `CATALOG_TAG` (Task 4); `requireRole`.
- Produces:
  - `AdminNav({ current }: { current: "painel" | "produtos" | "categorias" | "colecoes" | "cores" | "equipe" })` — links Painel, Produtos, Categorias, Coleções, Cores, Equipe; `aria-current="page"` no atual; faixa horizontal no celular.
  - Server Actions no formato de `src/app/admin/equipe/actions.ts` (`(prev: FormState, formData: FormData) => Promise<FormState>`, `FormState = { error?: string; ok?: boolean }`):
    `saveCategory`, `saveCollection`, `saveColor` (criar quando não vier `id`, editar quando vier), `moveCategory/moveCollection/moveColor(id, "up" | "down")`, `setCategoryActive/setCollectionActive/setColorActive(id, active)`.
  - Toda action: `requireRole(["admin"], "<rota>")`, `safeParse`, grava com `viewer.supabase`, `updateTag(CATALOG_TAG)` e `revalidatePath("<rota>")`.

Comportamento:
- Cada página: lista em tabela (cartões no celular) com nome, slug, ativo e ações ↑ ↓ / Desativar / Ativar / Editar; formulário "Nova categoria" (etc.) no topo. O slug é sugerido a partir do nome (`slugify`) e editável.
- Coleções têm "Aparece no menu"; categorias têm "Aparece na home" e o desenho (`garment`); cores têm um seletor `<input type="color">` com o campo hex ao lado.
- Não há botão de apagar. Unique violation (`23505`) → "Já existe um item com esse endereço."
- `/admin`: as contagens de papéis continuam, com `AdminNav` acima e botão "Cadastrar produto" → `/admin/produtos/novo`.

- [ ] **Step 1: Teste da regra de cache e permissão em pgTAP**

Adicione a `supabase/tests/catalog_rls_test.sql`: cliente não muda `categories.sort_order` (0 linhas afetadas) e admin muda.

Run: `npm run test:db`
Expected: PASS (as políticas da Task 1 já cobrem; este teste fixa o comportamento que estas telas usam).

- [ ] **Step 2: Implementar `AdminNav`, as três páginas e as actions**

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: PASS.
No navegador, como admin: criar a cor "Grafite" `#2a2a2a`, criar a coleção "Inverno 26" com "Aparece no menu" → ela aparece no cabeçalho da loja na próxima navegação; desativar → some. Como cliente, `/admin/cores` redireciona para `/conta`.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin-nav.tsx src/app/admin supabase/tests
git commit -m "feat(admin): navegação e cadastro de categorias, coleções e cores"
```

---

### Task 7: Produtos — lista e formulário com grade de variantes

**Files:**
- Create: `src/app/admin/produtos/page.tsx`, `src/app/admin/produtos/novo/page.tsx`, `src/app/admin/produtos/[id]/page.tsx`
- Create: `src/app/admin/produtos/actions.ts`, `src/app/admin/produtos/product-form.tsx` (cliente), `src/app/admin/produtos/variant-grid.tsx` (cliente)
- Create: `src/lib/catalog/errors.ts`, `tests/unit/catalog-errors.test.ts`

**Interfaces:**
- Consumes: `productFormSchema`, `parseVariantGrid`, `buildSku`, `slugify`, `sortSizes`, `SIZE_PRESETS`, `publishProblems` (Task 3); `CATALOG_TAG`; RPC `admin_save_product` (Task 1).
- Produces:
  ```ts
  // errors.ts
  export function describeSaveError(e: { code?: string; message?: string } | null): string;
  // actions.ts
  export type ProductFormState = { error?: string; fieldErrors?: Record<string, string>; cellErrors?: { colorId: string; size: string; message: string }[]; ok?: boolean };
  export async function saveProduct(prev: ProductFormState, formData: FormData): Promise<ProductFormState>;
  ```
- Campos do `FormData`: `id?`, `name`, `slug`, `detail`, `description`, `categoryId`, `price` (texto em reais, ex. `"129,90"` → centavos), `weightGrams`, `isNew`, `garment`, `status`, `collectionIds` (múltiplo), e uma entrada por célula `stock:<colorId>:<size>`.

Comportamento:
- `/admin/produtos`: busca por nome (`q`), filtros `categoria`, `colecao`, `situacao` (`ativo` | `rascunho` | `arquivado` | `sem-estoque`) via `searchParams` dentro de `<Suspense>`; colunas: foto (miniatura ou `Garment`), nome, categoria, preço, estoque total, situação. Linha → `/admin/produtos/<id>`.
- Formulário, bloco **Dados**: campos da spec 4.1; slug preenchido a partir do nome enquanto o admin não editar o slug à mão.
- Bloco **Variantes**: linhas = cores ativas escolhidas (botão "Adicionar cor"), colunas = tamanhos (botões "Roupa P–GG", "Calçado 34–46", "Tamanho único" carregam os presets; campo "Outro tamanho"). Colunas sempre em `sortSizes`. Cada célula é um `<input inputmode="numeric">`; vazia = não vende. SKU mostrado em miúdo sob a célula (`buildSku`). Erros de célula aparecem na própria célula.
- `saveProduct`: `requireRole(["admin"], "/admin/produtos")` → `productFormSchema` → `parseVariantGrid` → se `status === "ativo"`, `publishProblems` com o nº de fotos do produto (0 para produto novo); havendo problemas, devolve `error` com os textos juntos e não grava → `rpc("admin_save_product", …)` → `updateTag(CATALOG_TAG)` → em produto novo, `redirect("/admin/produtos/<id>")` (onde aparecem as fotos, Task 8).
- Preço em reais: aceite `"129,90"`, `"129.90"` e `"129"`; qualquer outra coisa → `fieldErrors.price = "Use um valor como 129,90."`.

- [ ] **Step 1: Escrever o teste de `describeSaveError` que falha**

```ts
expect(describeSaveError({ code: "23505", message: 'duplicate key value violates unique constraint "products_slug_key"' }))
  .toBe("Já existe um produto com esse endereço. Mude o nome ou o endereço.");
expect(describeSaveError({ code: "23505", message: '... "product_variants_sku_key"' }))
  .toBe("Esse código (SKU) já é usado por outra peça.");
expect(describeSaveError({ code: "42501" })).toBe("Você não tem permissão para salvar produtos.");
expect(describeSaveError({ code: "XX000" })).toBe("Não foi possível salvar. Tente de novo.");
```
No mesmo arquivo, teste o conversor de preço. Ele não pode morar em `actions.ts` (arquivo `"use server"` só exporta actions), então crie `parsePriceToCents(text: string): number | null` em `src/lib/catalog/schemas.ts` e teste `"129,90"→12990`, `"129.9"→12990`, `"129"→12900`, `"12,999"→null`, `"-5"→null`, `""→null`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/catalog-errors.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `errors.ts`, `parsePriceToCents`, páginas, formulário, grade e action**

- [ ] **Step 4: Verificar**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: PASS.
No navegador, como admin: criar "Regata básica" (Camisetas, Casual, R$ 79,90, preto P/M/G estoque 2) como rascunho → aparece na lista, não na loja; tentar salvar como "Ativo" sem foto → mensagem "Envie pelo menos uma foto." e nada muda; criar outro produto com o mesmo nome → mensagem de endereço repetido; editar `camiseta-oversized`, esvaziar a célula branco/GG e salvar → a célula some e a loja continua mostrando o produto.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/produtos src/lib/catalog tests/unit
git commit -m "feat(admin): lista e cadastro de produtos com grade de variantes"
```

---

### Task 8: Fotos do produto e publicação

**Files:**
- Create: `src/app/admin/produtos/[id]/photos.tsx` (cliente), `src/app/admin/produtos/[id]/photo-actions.ts`
- Modify: `src/app/admin/produtos/[id]/page.tsx`, `docs/identidade-visual.md` (seção Fotografia)

**Interfaces:**
- Consumes: `checkImageFile`, `imagePath`, `IMAGE_TYPES` (Task 3); `createClient` do navegador (`src/lib/supabase/client.ts`); `productImageUrl`, `CATALOG_TAG` (Task 4).
- Produces (Server Actions, todas com `requireRole(["admin"], "/admin/produtos")`, `updateTag(CATALOG_TAG)` e `revalidatePath("/admin/produtos/<id>")`):
  ```ts
  export async function addProductImage(productId: string, path: string, colorId: string | null, alt: string): Promise<{ error?: string }>;
  export async function reorderProductImages(productId: string, orderedIds: string[]): Promise<{ error?: string }>;
  export async function updateProductImage(imageId: string, colorId: string | null, alt: string): Promise<{ error?: string }>;
  export async function removeProductImage(imageId: string): Promise<{ error?: string }>; // apaga a linha e o arquivo do bucket
  ```

Comportamento:
- Bloco **Fotos** só aparece em produto já salvo. "Enviar fotos" aceita vários arquivos (`accept="image/jpeg,image/png,image/webp"`); cada um passa por `checkImageFile` (mensagem por arquivo), sobe com `supabase.storage.from("produtos").upload(imagePath(productId, file.name, crypto.randomUUID()), file, { contentType: file.type })` e então chama `addProductImage`. Se `addProductImage` falhar, o componente remove o arquivo enviado.
- `addProductImage` confere que `path` começa com `${productId}/` antes de gravar (o caminho vem do navegador).
- Ordenar: arrastar (HTML drag and drop) e, para teclado e celular, botões "Mover para a esquerda/direita"; salva com `reorderProductImages` (`sort_order` = índice).
- Cada foto: miniatura em 4:5, seletor de cor ("Todas as cores" = `null`), campo de texto alternativo, "Remover" com confirmação.
- Depois disso, publicar (status "Ativo" na Task 7) passa a funcionar com a contagem real de fotos.
- `docs/identidade-visual.md`, seção Fotografia: troque "coloque a imagem em `public/images/`…" por como enviar fotos de produto pelo painel (`/admin/produtos/<id>`), mantendo a orientação de estilo; as fotos do hero continuam em `public/images/`.

- [ ] **Step 1: Teste de permissão do bucket em pgTAP**

Em `supabase/tests/catalog_rls_test.sql`: cliente não insere em `storage.objects` com `bucket_id = 'produtos'` (`throws_ok`, `42501`); admin insere.

Run: `npm run test:db`
Expected: PASS.

- [ ] **Step 2: Implementar `photos.tsx` e `photo-actions.ts`**

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: PASS.
No navegador, como admin, em "Regata básica": enviar 2 fotos (uma marcada como preto), um PDF (recusado com "Envie uma foto em JPEG, PNG ou WebP.") e uma imagem de 6 MB (recusada); reordenar; publicar como "Ativo" → a regata aparece em `/colecao/casual` com a primeira foto; remover uma foto → some da loja e do bucket (confira no Studio, `http://127.0.0.1:54323`).

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/produtos docs/identidade-visual.md supabase/tests
git commit -m "feat(admin): envio, ordem e remoção de fotos do produto"
```

---

### Task 9: Fechamento da etapa

**Files:**
- Modify: `README.md` (como subir o banco, rodar `test:db`, gerar tipos e criar o 1º admin), `CLAUDE.md` (o catálogo vive no banco; leitura pública por `src/lib/catalog/queries.ts` com a tag `catalogo`; toda action do admin chama `updateTag(CATALOG_TAG)`)

- [ ] **Step 1: Atualizar a documentação**

- [ ] **Step 2: Verificação completa**

Run: `npm run db:reset && npm run test:db && npm run lint && npm run typecheck && npm test && npm run build`
Expected: tudo PASS.

- [ ] **Step 3: Revisão no navegador, celular e computador**

Run: `npm run dev`; viewport de celular (375 px) e de computador.
Expected: loja igual à de antes; painel do admin usável no celular (tabelas viram cartões, grade de variantes rola na horizontal sem rolar a página inteira); nenhuma mensagem de erro no console.

- [ ] **Step 4: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: catálogo no banco — como rodar e manter"
```
