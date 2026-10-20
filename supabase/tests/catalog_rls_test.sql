begin;
select plan(17);

-- Dois usuários: o gatilho cria os perfis de cliente; promovemos um a admin (sem auth.uid() a trava não se aplica).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@teste.com'),
  ('00000000-0000-0000-0000-0000000000c1', 'cliente@teste.com'),
  ('00000000-0000-0000-0000-0000000000f1', 'atendente@teste.com');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set role = 'atendente' where id = '00000000-0000-0000-0000-0000000000f1';

insert into public.categories (id, slug, name, garment)
values ('00000000-0000-0000-0000-0000000000b1', 'cat-teste', 'Categoria teste', 'tee');
insert into public.colors (id, slug, label, hex, active) values
  ('00000000-0000-0000-0000-0000000000d1', 'cor-teste', 'Cor teste', '#000000', true),
  ('00000000-0000-0000-0000-0000000000d2', 'oculta', 'Oculta', '#123456', false);
insert into public.products (slug, name, category_id, price_cents, garment, status) values
  ('ativo-x', 'Ativo', '00000000-0000-0000-0000-0000000000b1', 9900, 'tee', 'ativo'),
  ('rascunho-x', 'Rascunho', '00000000-0000-0000-0000-0000000000b1', 9900, 'tee', 'rascunho');
insert into public.product_variants (product_id, color_id, size, sku, stock)
select id, '00000000-0000-0000-0000-0000000000d1', 'M', slug || '-m', 3
from public.products where slug in ('ativo-x', 'rascunho-x');
insert into public.product_images (product_id, path)
select id, 'teste/' || slug || '.jpg' from public.products where slug in ('ativo-x', 'rascunho-x');
insert into storage.objects (bucket_id, name) values ('produtos', 'teste/foto.jpg');

-- Visitante
set local role anon;
select is((select count(*) from public.products where slug = 'ativo-x'), 1::bigint, 'anon lê produto ativo');
select is((select count(*) from public.products where slug = 'rascunho-x'), 0::bigint, 'anon não lê rascunho');
select is((select count(*) from public.colors where slug = 'oculta'), 0::bigint, 'cor inativa some para anon');
select is(
  (select count(*) from public.product_variants v where v.sku = 'rascunho-x-m'), 0::bigint,
  'anon não lê variantes de rascunho'
);
select is(
  (select count(*) from public.product_images i where i.path = 'teste/rascunho-x.jpg'), 0::bigint,
  'anon não lê fotos de rascunho'
);
select throws_ok(
  $$insert into public.categories (slug, name, garment) values ('x', 'X', 'tee')$$,
  '42501', null, 'anon não insere categoria'
);

-- Cliente
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select results_eq(
  $$with u as (update public.products set price_cents = 1 where slug = 'ativo-x' returning 1) select count(*) from u$$,
  $$values (0::bigint)$$,
  'cliente não atualiza preço'
);

select is(
  (select count(*) from storage.objects where bucket_id = 'produtos'), 0::bigint, 'cliente não lista fotos pela API'
);
select results_eq(
  $$with u as (update public.categories set sort_order = 99 returning 1) select count(*) from u$$,
  $$values (0::bigint)$$,
  'cliente não muda a ordem das categorias'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('produtos', 'teste/cliente.jpg')$$,
  '42501', null, 'cliente não envia foto para o bucket produtos'
);

-- Atendente: lê tudo, mas não muda preço
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}';
select results_eq(
  $$with u as (update public.products set price_cents = 1 where slug = 'ativo-x' returning 1) select count(*) from u$$,
  $$values (0::bigint)$$,
  'atendente não atualiza preço'
);

-- Admin
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok(
  $$insert into public.colors (slug, label, hex) values ('cor-admin', 'Cor admin', '#ffffff')$$,
  'admin insere cor'
);
select results_eq(
  $$with u as (update public.categories set sort_order = 99 where slug = 'cat-teste' returning 1) select count(*) from u$$,
  $$values (1::bigint)$$,
  'admin muda a ordem das categorias'
);
select is((select count(*) from public.products where slug = 'rascunho-x'), 1::bigint, 'admin lê rascunho');
select is((select count(*) from public.colors where slug = 'oculta'), 1::bigint, 'admin lê cor inativa');
select is(
  (select count(*) from storage.objects where bucket_id = 'produtos' and name = 'teste/foto.jpg'), 1::bigint,
  'admin lê objetos do bucket produtos'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('produtos', 'teste/admin.jpg')$$,
  'admin envia foto para o bucket produtos'
);

select * from finish();
rollback;
