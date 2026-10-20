begin;
select plan(10);

-- Dois usuários: o gatilho cria os perfis de cliente; promovemos um a admin (sem auth.uid() a trava não se aplica).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@teste.com'),
  ('00000000-0000-0000-0000-0000000000c1', 'cliente@teste.com');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

insert into public.categories (id, slug, name, garment)
values ('00000000-0000-0000-0000-0000000000b1', 'camisetas', 'Camisetas', 'tee');
insert into public.colors (id, slug, label, hex, active) values
  ('00000000-0000-0000-0000-0000000000d1', 'preto', 'Preto', '#000000', true),
  ('00000000-0000-0000-0000-0000000000d2', 'oculta', 'Oculta', '#123456', false);
insert into public.products (slug, name, category_id, price_cents, garment, status) values
  ('ativo-x', 'Ativo', '00000000-0000-0000-0000-0000000000b1', 9900, 'tee', 'ativo'),
  ('rascunho-x', 'Rascunho', '00000000-0000-0000-0000-0000000000b1', 9900, 'tee', 'rascunho');
insert into storage.objects (bucket_id, name) values ('produtos', 'teste/foto.jpg');

-- Visitante
set local role anon;
select is((select count(*) from public.products where slug = 'ativo-x'), 1::bigint, 'anon lê produto ativo');
select is((select count(*) from public.products where slug = 'rascunho-x'), 0::bigint, 'anon não lê rascunho');
select is((select count(*) from public.colors where slug = 'oculta'), 0::bigint, 'cor inativa some para anon');
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

-- Admin
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok(
  $$insert into public.colors (slug, label, hex) values ('branco', 'Branco', '#ffffff')$$,
  'admin insere cor'
);
select is((select count(*) from public.products where slug = 'rascunho-x'), 1::bigint, 'admin lê rascunho');
select is((select count(*) from public.colors where slug = 'oculta'), 1::bigint, 'admin lê cor inativa');
select is(
  (select count(*) from storage.objects where bucket_id = 'produtos' and name = 'teste/foto.jpg'), 1::bigint,
  'admin lê objetos do bucket produtos'
);

select * from finish();
rollback;
