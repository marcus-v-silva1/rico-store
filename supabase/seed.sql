-- Primeiro administrador: crie a conta pela tela /cadastro e rode isto no SQL Editor
-- (ou `supabase db query`), trocando o e-mail. Sem usuário logado a trava de papéis não se aplica.
--
-- update public.profiles set role = 'admin' where email = 'voce@exemplo.com';

-- ---------------------------------------------------------------------------
-- Catálogo inicial: as 12 peças da primeira vitrine
-- Pode rodar mais de uma vez: o que já existe (pelo endereço) fica como está.
-- ---------------------------------------------------------------------------
insert into public.colors (slug, label, hex, sort_order) values
  ('preto',  'Preto',  '#121212', 1),
  ('branco', 'Branco', '#f6f5f1', 2),
  ('cinza',  'Cinza',  '#9a9a95', 3),
  ('oliva',  'Oliva',  '#5b6240', 4),
  ('vinho',  'Vinho',  '#7a1f24', 5),
  ('azul',   'Azul',   '#46608f', 6)
on conflict (slug) do nothing;

insert into public.collections (slug, title, kicker, description, show_in_nav, sort_order) values
  ('street', 'Street', 'Streetwear / original vibe', 'Moletons, jaquetas, cargo e sneakers das marcas que movem o streetwear.', true, 1),
  ('casual', 'Casual', 'Dia a dia / sempre atual', 'Peças simples e bem cortadas para usar de segunda a domingo.', true, 2),
  ('trabalho', 'Trabalho', 'Workwear / resistência', 'Roupa de trabalho com acabamento firme e cara de rua.', true, 3),
  ('sneakers', 'Sneakers', 'Nike / New Balance / Jordan', 'Tênis para completar o look, dos clássicos aos lançamentos.', true, 4),
  ('acessorios', 'Acessórios', 'Bonés / bolsas / detalhes', 'O detalhe que fecha o visual.', true, 5)
on conflict (slug) do nothing;

insert into public.categories (slug, name, kicker, description, garment, show_on_home, sort_order) values
  ('moletons-e-jaquetas', 'Moletons e jaquetas', 'Conforto / estilo / proteção', 'Camadas para o dia inteiro.', 'jacket', true, 1),
  ('camisetas', 'Camisetas', 'Básicas / oversized / estampas', 'A base de todo look.', 'tee', true, 2),
  ('calcas-e-bermudas', 'Calças e bermudas', 'Cargo / baggy / street', 'Modelagens largas e bolsos de verdade.', 'pants', true, 3),
  ('sneakers', 'Sneakers', 'Nike / New Balance / Jordan', 'Tênis para completar o look, dos clássicos aos lançamentos.', 'sneaker', true, 4),
  ('acessorios', 'Acessórios', 'Bonés / bolsas / detalhes', 'O detalhe que fecha o visual.', 'cap', false, 5)
on conflict (slug) do nothing;

-- slug, nome, detalhe, linha, categoria, peça, cores, preço (centavos), novo, posição
-- A primeira cor da lista é a cor principal (a que o card mostra primeiro).
-- A posição escalona created_at: a primeira peça é a mais recente (ordem das Novidades).
-- Tabela temporária comum (sem `on commit drop`): funciona também no psql em autocommit.
drop table if exists pg_temp.seed_products;
create temp table seed_products as
select * from (values
  ('jaqueta-puffer',      'Jaqueta puffer',      'Preto',          'street',   'moletons-e-jaquetas', 'jacket',  array['preto','oliva','cinza'],  52990, true,   1),
  ('moletom-com-capuz',   'Moletom com capuz',   'Cinza mescla',   'street',   'moletons-e-jaquetas', 'hoodie',  array['cinza','preto','vinho'],  32990, false,  2),
  ('camiseta-oversized',  'Camiseta oversized',  'Branco',         'casual',   'camisetas',           'tee',     array['branco','preto'],         12990, true,   3),
  ('calca-cargo-baggy',   'Calça cargo baggy',   'Oliva',          'street',   'calcas-e-bermudas',   'pants',   array['oliva','preto'],          27990, true,   4),
  ('corta-vento',         'Corta-vento',         'Preto e cinza',  'street',   'moletons-e-jaquetas', 'jacket',  array['preto','cinza'],          29990, false,  5),
  ('bermuda-de-nylon',    'Bermuda de nylon',    'Preto',          'casual',   'calcas-e-bermudas',   'shorts',  array['preto','azul'],           17990, false,  6),
  ('bone-aba-curva',      'Boné aba curva',      'Preto',          'casual',   'acessorios',          'cap',     array['preto','branco'],          9990, false,  7),
  ('tenis-cano-baixo',    'Tênis cano baixo',    'Branco e preto', 'street',   'sneakers',            'sneaker', array['branco','preto'],         49990, false,  8),
  ('jaqueta-workwear',    'Jaqueta workwear',    'Preto',          'trabalho', 'moletons-e-jaquetas', 'jacket',  array['preto','oliva'],          34990, true,   9),
  ('calca-dupla-costura', 'Calça dupla costura', 'Preto',          'trabalho', 'calcas-e-bermudas',   'pants',   array['preto','oliva','cinza'],  25990, false, 10),
  ('camiseta-pesada',     'Camiseta pesada',     'Cinza',          'trabalho', 'camisetas',           'tee',     array['cinza','preto','branco'], 11990, false, 11),
  ('bolsa-transversal',   'Bolsa transversal',   'Preto',          'street',   'acessorios',          'bag',     array['preto'],                  15990, false, 12)
) as t (slug, name, detail, line, category, garment, colors, price_cents, is_new, pos);

insert into public.products (
  slug, name, detail, category_id, price_cents, is_new, garment, status, default_color_id, created_at
)
select s.slug, s.name, s.detail, c.id, s.price_cents, s.is_new, s.garment::public.garment_kind, 'ativo',
  col.id, now() - s.pos * interval '1 minute'
from seed_products s
join public.categories c on c.slug = s.category
left join public.colors col on col.slug = s.colors[1]
on conflict (slug) do nothing;

insert into public.product_collections (product_id, collection_id)
select p.id, c.id
from seed_products s
join public.products p on p.slug = s.slug
join public.collections c
  on c.slug = s.line
  or (c.slug = 'sneakers' and s.category = 'sneakers')
  or (c.slug = 'acessorios' and s.category = 'acessorios')
on conflict do nothing;

insert into public.product_variants (product_id, color_id, size, sku, stock)
select p.id, col.id, z.size, lower(s.slug || '-' || col.slug || '-' || z.size), 5
from seed_products s
join public.products p on p.slug = s.slug
join public.colors col on col.slug = any (s.colors)
cross join lateral unnest(
  case s.category
    when 'sneakers' then array['38','39','40','41','42','43']
    when 'acessorios' then array['U']
    else array['P','M','G','GG']
  end
) as z (size)
on conflict do nothing;

drop table seed_products;
