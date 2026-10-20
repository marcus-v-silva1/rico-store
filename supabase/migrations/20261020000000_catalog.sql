-- Rico Store: catálogo (categorias, coleções, cores, produtos, variantes, fotos),
-- RLS, bucket de fotos e a função que salva um produto inteiro de uma vez.
-- Leitura: visitantes só veem o que está ativo. Escrita: só administrador.

create type public.garment_kind as enum ('jacket', 'hoodie', 'tee', 'pants', 'shorts', 'cap', 'sneaker', 'bag');
create type public.product_status as enum ('rascunho', 'ativo', 'arquivado');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  kicker text not null default '',
  description text not null default '',
  garment public.garment_kind not null,
  show_on_home boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  kicker text not null default '',
  description text not null default '',
  show_in_nav boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  hex text not null check (hex ~ '^#[0-9a-f]{6}$'),
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  detail text not null default '',
  description text not null default '',
  category_id uuid not null references public.categories (id) on delete restrict,
  price_cents integer not null check (price_cents > 0),
  weight_grams integer not null default 300 check (weight_grams > 0),
  is_new boolean not null default false,
  garment public.garment_kind not null,
  status public.product_status not null default 'rascunho',
  -- Cor que a vitrine mostra primeiro (desenho e rótulo do card). Sem ela, vale a ordem das cores.
  default_color_id uuid references public.colors (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_default_color_id_idx on public.products (default_color_id);

create table public.product_collections (
  product_id uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete restrict,
  primary key (product_id, collection_id)
);

create index product_collections_collection_id_idx on public.product_collections (collection_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid not null references public.colors (id) on delete restrict,
  size text not null check (length(trim(size)) between 1 and 8),
  sku text not null unique,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  unique (product_id, color_id, size)
);

create index product_variants_color_id_idx on public.product_variants (color_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid references public.colors (id) on delete set null,
  path text not null unique,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);
create index product_images_color_id_idx on public.product_images (color_id);

-- Carimba a data da última alteração do produto.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- As políticas de leitura também rodam para visitantes; sem login a função devolve null (nada de dados expostos).
grant execute on function public.current_app_role() to anon;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.colors enable row level security;
alter table public.products enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

-- Categorias, coleções e cores: visitantes veem as ativas; administrador vê e muda tudo.
create policy "categories: ler ativas; admin lê todas"
  on public.categories for select to anon, authenticated
  using (active or (select public.current_app_role()) = 'admin');
create policy "categories: admin insere"
  on public.categories for insert to authenticated
  with check ((select public.current_app_role()) = 'admin');
create policy "categories: admin edita"
  on public.categories for update to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');
create policy "categories: admin apaga"
  on public.categories for delete to authenticated
  using ((select public.current_app_role()) = 'admin');

create policy "collections: ler ativas; admin lê todas"
  on public.collections for select to anon, authenticated
  using (active or (select public.current_app_role()) = 'admin');
create policy "collections: admin insere"
  on public.collections for insert to authenticated
  with check ((select public.current_app_role()) = 'admin');
create policy "collections: admin edita"
  on public.collections for update to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');
create policy "collections: admin apaga"
  on public.collections for delete to authenticated
  using ((select public.current_app_role()) = 'admin');

create policy "colors: ler ativas; admin lê todas"
  on public.colors for select to anon, authenticated
  using (active or (select public.current_app_role()) = 'admin');
create policy "colors: admin insere"
  on public.colors for insert to authenticated
  with check ((select public.current_app_role()) = 'admin');
create policy "colors: admin edita"
  on public.colors for update to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');
create policy "colors: admin apaga"
  on public.colors for delete to authenticated
  using ((select public.current_app_role()) = 'admin');

-- Produtos: visitantes só veem os ativos; a equipe vê também rascunhos e arquivados.
create policy "products: ler ativos; a equipe lê todos"
  on public.products for select to anon, authenticated
  using (status = 'ativo' or (select public.current_app_role()) in ('admin', 'atendente'));
create policy "products: admin insere"
  on public.products for insert to authenticated
  with check ((select public.current_app_role()) = 'admin');
create policy "products: admin edita"
  on public.products for update to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');
create policy "products: admin apaga"
  on public.products for delete to authenticated
  using ((select public.current_app_role()) = 'admin');

-- Tabelas filhas: seguem a visibilidade do produto (o RLS de products já filtra o exists).
create policy "product_variants: ler as de produto visível"
  on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "product_variants: admin insere"
  on public.product_variants for insert to authenticated
  with check ((select public.current_app_role()) = 'admin');
create policy "product_variants: admin edita"
  on public.product_variants for update to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');
create policy "product_variants: admin apaga"
  on public.product_variants for delete to authenticated
  using ((select public.current_app_role()) = 'admin');

create policy "product_images: ler as de produto visível"
  on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "product_images: admin insere"
  on public.product_images for insert to authenticated
  with check ((select public.current_app_role()) = 'admin');
create policy "product_images: admin edita"
  on public.product_images for update to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');
create policy "product_images: admin apaga"
  on public.product_images for delete to authenticated
  using ((select public.current_app_role()) = 'admin');

create policy "product_collections: ler as de produto visível"
  on public.product_collections for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "product_collections: admin insere"
  on public.product_collections for insert to authenticated
  with check ((select public.current_app_role()) = 'admin');
create policy "product_collections: admin edita"
  on public.product_collections for update to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');
create policy "product_collections: admin apaga"
  on public.product_collections for delete to authenticated
  using ((select public.current_app_role()) = 'admin');

-- ---------------------------------------------------------------------------
-- Fotos: bucket público (leitura aberta); só administrador envia, troca e apaga.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "produtos: admin lê fotos"
  on storage.objects for select to authenticated
  using (bucket_id = 'produtos' and (select public.current_app_role()) = 'admin');
create policy "produtos: admin envia fotos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and (select public.current_app_role()) = 'admin');
create policy "produtos: admin troca fotos"
  on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and (select public.current_app_role()) = 'admin')
  with check (bucket_id = 'produtos' and (select public.current_app_role()) = 'admin');
create policy "produtos: admin apaga fotos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and (select public.current_app_role()) = 'admin');

-- ---------------------------------------------------------------------------
-- Salvar produto: grava produto, coleções e variantes numa transação só.
-- Roda com os direitos de quem chama (security invoker): o RLS continua valendo.
-- Variantes que não vieram no payload ficam inativas, nunca são apagadas.
-- ---------------------------------------------------------------------------
create function public.admin_save_product(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v jsonb;
begin
  if coalesce((select public.current_app_role()), 'cliente') <> 'admin' then
    raise exception 'Apenas administradores salvam produtos' using errcode = '42501';
  end if;

  if v_id is null then
    insert into public.products (
      slug, name, detail, description, category_id, price_cents, weight_grams, is_new, garment, status,
      default_color_id
    ) values (
      p ->> 'slug',
      p ->> 'name',
      coalesce(p ->> 'detail', ''),
      coalesce(p ->> 'description', ''),
      (p ->> 'category_id')::uuid,
      (p ->> 'price_cents')::integer,
      coalesce((p ->> 'weight_grams')::integer, 300),
      coalesce((p ->> 'is_new')::boolean, false),
      (p ->> 'garment')::public.garment_kind,
      coalesce((p ->> 'status')::public.product_status, 'rascunho'),
      nullif(p ->> 'default_color_id', '')::uuid
    )
    returning id into v_id;
  else
    update public.products set
      slug = p ->> 'slug',
      name = p ->> 'name',
      detail = coalesce(p ->> 'detail', ''),
      description = coalesce(p ->> 'description', ''),
      category_id = (p ->> 'category_id')::uuid,
      price_cents = (p ->> 'price_cents')::integer,
      weight_grams = coalesce((p ->> 'weight_grams')::integer, 300),
      is_new = coalesce((p ->> 'is_new')::boolean, false),
      garment = (p ->> 'garment')::public.garment_kind,
      status = coalesce((p ->> 'status')::public.product_status, 'rascunho'),
      default_color_id = nullif(p ->> 'default_color_id', '')::uuid,
      updated_at = now()
    where id = v_id;
    if not found then
      raise exception 'Produto não encontrado' using errcode = 'P0002';
    end if;
  end if;

  -- Coleções: troca o conjunto inteiro.
  delete from public.product_collections where product_id = v_id;
  insert into public.product_collections (product_id, collection_id)
  select v_id, c::uuid
  from jsonb_array_elements_text(coalesce(p -> 'collection_ids', '[]'::jsonb)) as c
  on conflict do nothing;

  -- Variantes: o que saiu do payload fica inativo; o que veio é criado ou atualizado.
  update public.product_variants set active = false where product_id = v_id;
  for v in select * from jsonb_array_elements(coalesce(p -> 'variants', '[]'::jsonb)) loop
    insert into public.product_variants (product_id, color_id, size, sku, stock, active)
    values (
      v_id,
      (v ->> 'color_id')::uuid,
      v ->> 'size',
      v ->> 'sku',
      coalesce((v ->> 'stock')::integer, 0),
      true
    )
    on conflict (product_id, color_id, size) do update
      set sku = excluded.sku, stock = excluded.stock, active = true;
  end loop;

  return v_id;
end;
$$;

revoke all on function public.admin_save_product(jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated;
