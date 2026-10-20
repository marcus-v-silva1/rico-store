begin;
select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@teste.com'),
  ('00000000-0000-0000-0000-0000000000c1', 'cliente@teste.com');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

insert into public.categories (id, slug, name, garment)
values ('00000000-0000-0000-0000-0000000000b1', 'cat-teste', 'Categoria teste', 'tee');
insert into public.colors (id, slug, label, hex)
values ('00000000-0000-0000-0000-0000000000d1', 'cor-teste', 'Cor teste', '#000000');
insert into public.collections (id, slug, title) values
  ('00000000-0000-0000-0000-0000000000e1', 'col-a', 'A'),
  ('00000000-0000-0000-0000-0000000000e2', 'col-b', 'B');

-- Payload base; cada teste troca só o que importa.
create temp table payloads (name text primary key, body jsonb);
grant all on payloads to authenticated;
insert into payloads values
  ('v1', '{"slug":"camiseta-x","name":"Camiseta X","category_id":"00000000-0000-0000-0000-0000000000b1",
    "price_cents":9900,"weight_grams":250,"is_new":true,"garment":"tee","status":"ativo",
    "collection_ids":["00000000-0000-0000-0000-0000000000e1"],
    "variants":[
      {"color_id":"00000000-0000-0000-0000-0000000000d1","size":"M","sku":"CX-P-M","stock":3},
      {"color_id":"00000000-0000-0000-0000-0000000000d1","size":"G","sku":"CX-P-G","stock":0}]}'),
  ('dup', '{"slug":"camiseta-x","name":"Outra","category_id":"00000000-0000-0000-0000-0000000000b1",
    "price_cents":100,"garment":"tee","status":"rascunho","collection_ids":[],"variants":[]}');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

create temp table saved (id uuid);
grant all on saved to authenticated;
insert into saved select public.admin_save_product(body) from payloads where name = 'v1';

select isnt((select id from saved), null, 'devolve um uuid');
select is((select count(*) from public.product_variants where product_id = (select id from saved)), 2::bigint, 'cria 2 variantes');
select is(
  (select default_color_id from public.products where id = (select id from saved)), null::uuid,
  'sem cor principal no payload, fica sem'
);

-- Segunda gravação: só preto/M, estoque 5, e coleção B.
select lives_ok(
  $$select public.admin_save_product(
      (select body from payloads where name = 'v1')
      || jsonb_build_object(
           'id', (select id from saved),
           'default_color_id', '00000000-0000-0000-0000-0000000000d1',
           'collection_ids', jsonb_build_array('00000000-0000-0000-0000-0000000000e2'),
           'variants', jsonb_build_array(jsonb_build_object(
             'color_id', '00000000-0000-0000-0000-0000000000d1', 'size', 'M', 'sku', 'CX-P-M', 'stock', 5))))$$,
  'salva de novo'
);
select is(
  (select stock::text || active::text from public.product_variants where product_id = (select id from saved) and size = 'M'),
  '5true', 'preto/M com estoque 5 e ativa'
);
select is(
  (select default_color_id from public.products where id = (select id from saved)),
  '00000000-0000-0000-0000-0000000000d1'::uuid, 'grava a cor principal'
);
select is(
  (select active from public.product_variants where product_id = (select id from saved) and size = 'G'),
  false, 'preto/G ficou inativa'
);
select is((select count(*) from public.product_variants where product_id = (select id from saved)), 2::bigint, 'nenhuma variante foi apagada');
select is(
  (select array_agg(collection_id) from public.product_collections where product_id = (select id from saved)),
  array['00000000-0000-0000-0000-0000000000e2']::uuid[], 'só a coleção B ficou'
);
select throws_ok(
  $$select public.admin_save_product((select body from payloads where name = 'dup'))$$,
  '23505', null, 'slug repetido em produto novo'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select throws_ok(
  $$select public.admin_save_product((select body from payloads where name = 'dup'))$$,
  '42501', null, 'cliente não salva produto'
);

select * from finish();
rollback;
