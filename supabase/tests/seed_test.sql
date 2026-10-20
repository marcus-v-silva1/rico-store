begin;
select plan(6);

select is((select count(*) from public.products where status = 'ativo'), 12::bigint, '12 produtos ativos');
select is((select count(*) from public.colors), 6::bigint, '6 cores');
select is(
  (select count(*) from public.collections c
    where c.show_in_nav
      and not exists (
        select 1 from public.product_collections pc
        join public.products p on p.id = pc.product_id and p.status = 'ativo'
        where pc.collection_id = c.id)),
  0::bigint, 'toda coleção do menu tem produto ativo'
);
select is(
  (select count(*) from public.categories c
    where c.show_on_home
      and not exists (
        select 1 from public.products p where p.category_id = c.id and p.status = 'ativo')),
  0::bigint, 'toda categoria da home tem produto ativo'
);
select is((select count(*) from public.product_variants where sku <> lower(sku)), 0::bigint, 'SKUs em minúsculas');
select is(
  (select count(*) from public.product_variants v join public.products p on p.id = v.product_id where p.slug = 'jaqueta-puffer'),
  12::bigint, 'jaqueta-puffer tem 12 variantes'
);

select * from finish();
rollback;
