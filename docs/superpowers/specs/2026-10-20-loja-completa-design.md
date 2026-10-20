# Rico Store — loja completa: design

Data: 2026-10-20 · Status: aprovado em conversa, aguardando revisão da spec escrita

## 1. Objetivo

Transformar a vitrine atual (catálogo fixo em `src/content/catalog.ts`, sacola só no navegador, sem checkout) num sistema de loja completo:

- a equipe cadastra produtos, categorias, coleções, cores, variantes e fotos pelo painel;
- o cliente compra e paga online;
- o atendimento gerencia os pedidos e imprime etiqueta de envio;
- o administrador acompanha as vendas num dashboard;
- a home ganha um hero 3D (muro de concreto) fiel à identidade visual (`docs/identidade-visual.md`).

### Decisões tomadas

| Tema           | Decisão                                                                                 |
| -------------- | --------------------------------------------------------------------------------------- |
| Arquitetura    | Tudo no Supabase (Postgres + Storage + RLS + funções SQL), Server Actions no Next 16     |
| Pedidos        | Checkout online com pagamento, login obrigatório                                        |
| Pagamento      | Camada `PaymentProvider` trocável; começa com provedor simulado + Mercado Pago sandbox  |
| Frete          | Retirada na loja (grátis) + tabela própria por faixa de CEP; Melhor Envio numa fase 2   |
| Etiqueta       | Etiqueta própria imprimível agora; etiqueta oficial do Melhor Envio na fase 2           |
| Estoque        | Por variante (cor + tamanho), reservado de forma atômica no pedido                      |
| 3D             | Muro de concreto integrado ao hero, reage ao mouse e ao scroll                          |

### Fora do escopo agora

Cupons, boleto, e-mail de confirmação de pedido, devoluções/trocas no sistema, avaliações, Melhor Envio (fase 2 documentada na seção 6.2).

## 2. Dados

Novas migrations em `supabase/migrations/`. Toda tabela com RLS ligado. Valores em centavos (`integer`). Datas em `timestamptz`; relatórios no fuso `America/Belem`.

### 2.1 Catálogo

- `categories`: `id`, `slug` único, `name`, `sort_order`, `active`. Ex.: Camisetas, Sneakers.
- `collections`: `id`, `slug` único, `title`, `kicker`, `description`, `sort_order`, `active`, `show_in_nav`. Ex.: Street, Casual, Trabalho, coleções sazonais.
- `colors`: `id`, `slug` único, `label`, `hex`, `sort_order`, `active`. Começa com preto, branco, cinza, oliva, vinho e azul.
- `products`: `id`, `slug` único, `name`, `detail` (texto curto sob o nome), `description`, `category_id`, `price_cents`, `weight_grams`, `is_new`, `status` (`rascunho` | `ativo` | `arquivado`), `garment` (desenho de reserva), `created_at`, `updated_at`.
- `product_collections`: `product_id`, `collection_id` (N:N).
- `product_variants`: `id`, `product_id`, `color_id`, `size` (texto: P, M, G, GG, 38, 40, U…), `sku` único, `stock` (`>= 0`), `active`. Único em (`product_id`, `color_id`, `size`).
- `product_images`: `id`, `product_id`, `color_id` opcional, `path` no bucket, `alt`, `sort_order`.
- Bucket `produtos` no Storage: leitura pública, escrita só do admin.

Regras:

- Um produto só fica `ativo` com pelo menos uma variante com estoque e uma foto.
- Categoria, coleção ou cor em uso não são apagadas, só desativadas.
- Sem foto, o site mostra o `Garment` SVG atual.

### 2.2 Pedidos

- `addresses`: endereços salvos do cliente (`user_id`, CEP, rua, número, complemento, bairro, cidade, UF, destinatário, telefone).
- `orders`: `id`, `number` sequencial (exibido como `RICO-000123`), `user_id`, cópia do endereço (colunas próprias, não FK), `shipping_method` (`retirada` | `tabela` | depois `melhor_envio`), `shipping_cents`, `shipping_days`, `subtotal_cents`, `total_cents`, `status`, `needs_attention` (bool), `tracking_code`, `reserved_until`, `created_at`, `updated_at`.
- `order_items`: `order_id`, `variant_id`, e cópia de nome, cor, tamanho, SKU, `unit_price_cents` e `qty` da época.
- `order_events`: `order_id`, `actor_id` (nulo para sistema/webhook), `type` (`status`, `etiqueta_impressa`, `rastreio`, `pagamento`, `nota`), `from_status`, `to_status`, `note`, `created_at`.
- `payments`: `order_id`, `provider`, `external_id` único por provedor, `status` bruto, `amount_cents`, `raw` (jsonb), `created_at`, `updated_at`.
- `shipping_rates`: `cep_start`, `cep_end`, `label`, `price_cents`, `days`, `active`.
- `store_settings` (linha única): endereço de retirada, dados do remetente da etiqueta, limite de estoque baixo (padrão 3).

### 2.3 Status do pedido

```
aguardando_pagamento → pago → em_separacao → enviado → entregue
                              em_separacao → pronto_retirada → entregue
aguardando_pagamento → cancelado (expirado ou recusado)
pago / em_separacao  → cancelado (pela equipe; devolve o estoque)
```

As transições ficam num módulo puro `src/lib/order-status.ts` (testado como `roles.ts`). A função SQL `set_order_status(order_id, to_status, note)` repete a mesma regra no banco e grava `order_events`.

### 2.4 Papéis

| Ação                                         | admin | atendente | cliente          | anônimo |
| -------------------------------------------- | ----- | --------- | ---------------- | ------- |
| Ler catálogo ativo                           | ✔     | ✔         | ✔                | ✔       |
| Ler rascunhos, editar catálogo, preços, frete | ✔     |           |                  |         |
| Ler e mudar status de pedidos, etiqueta       | ✔     | ✔         |                  |         |
| Ler os próprios pedidos e endereços          | ✔     | ✔         | ✔                |         |
| Criar pedido                                 | ✔     | ✔         | ✔ (via função)   |         |
| Dashboard                                    | ✔     |           |                  |         |

Toda página protegida chama `requireRole()` (`src/lib/auth.ts`); o RLS do banco é a barreira final. Escrita em `orders`, `order_items`, `payments` e estoque só por funções `security definer`, nunca por insert/update direto do cliente.

## 3. Checkout e pagamento

### 3.1 Sacola

`src/components/cart.ts` passa a guardar `{ variantId, qty }` no `localStorage`. A página `/sacola` busca no servidor preço e estoque atuais das variantes e avisa quando algo mudou ("Restam 2 unidades do Moletom preto M"). Itens de variantes inativas saem da sacola com aviso.

### 3.2 Fluxo `/checkout` (exige login)

1. **Endereço**: CEP preenche rua/bairro/cidade pelo ViaCEP; opção de salvar na conta.
2. **Entrega**: opções vindas de `ShippingProvider.quote(cep, itens)`. Implementações: `retirada` (grátis, mostra o endereço da loja) e `tabela` (faixa de CEP em `shipping_rates`). Sem faixa para o CEP, só a retirada aparece, com aviso.
3. **Revisão e "Pagar"**: Server Action valida com zod e chama a função SQL `create_order(items, address, shipping_method)`, que numa transação:
   - trava as variantes (`select … for update`);
   - confere estoque e status ativo;
   - baixa o estoque (reserva) e define `reserved_until = now() + 30 min`;
   - recalcula preço e frete a partir do banco, nunca do navegador;
   - grava `orders`, `order_items` e o evento inicial.

   Falta de estoque aborta tudo e devolve qual item faltou.
4. A action chama `PaymentProvider.createCheckout(pedido)` e redireciona para a URL devolvida.

### 3.3 `PaymentProvider` (`src/lib/payments/`)

```ts
interface PaymentProvider {
  id: "simulado" | "mercadopago";
  createCheckout(order: OrderForPayment): Promise<{ redirectUrl: string; externalId: string }>;
  confirmPayment(req: Request): Promise<{ orderId: string; externalId: string; status: PaymentStatus; amountCents: number; raw: unknown } | null>;
}
```

- `mercadopago.ts`: Checkout Pro (Pix e cartão com parcelamento na página do Mercado Pago; nenhum dado de cartão passa pelo site). `external_reference` = id do pedido.
- `simulado.ts`: só quando `PAYMENT_PROVIDER=simulado` (desenvolvimento e testes). Página local `/pagamento-simulado/[id]` com "Aprovar" e "Recusar", que dispara o mesmo caminho do webhook.
- A escolha vem de `PAYMENT_PROVIDER` em `src/lib/env.ts`. Em produção, `simulado` é recusado na inicialização.

### 3.4 Webhook `/api/webhooks/pagamento`

1. Verifica a assinatura (`x-signature` do Mercado Pago com `MERCADOPAGO_WEBHOOK_SECRET`); falha → 401.
2. Busca o pagamento na API do provedor pelo id recebido (não confia no corpo).
3. Grava/atualiza `payments` por (`provider`, `external_id`) — idempotente.
4. Se aprovado e o valor confere com `total_cents`, chama `mark_order_paid(order_id)` com a service role (só no servidor). Valor diferente → `needs_attention`.
5. Responde 200 rápido; erros transitórios respondem 500 para o provedor reenviar.

`mark_order_paid` de um pedido já pago não faz nada. De um pedido `cancelado` por expiração: tenta reservar o estoque de novo; se conseguir, segue como `pago`; se não, fica `pago` com `needs_attention = true` para a equipe estornar ou trocar.

### 3.5 Expiração

Tarefa `pg_cron` a cada 5 min: pedidos `aguardando_pagamento` com `reserved_until < now()` viram `cancelado` e devolvem o estoque (`order_events` com `actor_id` nulo).

### 3.6 Lado do cliente

`/conta/pedidos` lista os pedidos; `/conta/pedidos/[id]` mostra itens, status em texto claro ("Aguardando confirmação do pagamento", "Pago", "Enviado") e, quando houver, o código de rastreio com link para o rastreio dos Correios. É a página de retorno do gateway.

## 4. Painel

### 4.1 Admin (`requireRole(["admin"])`)

- `/admin` — dashboard (seção 5).
- `/admin/produtos` — lista com busca e filtros (categoria, coleção, ativo / rascunho / sem estoque).
- `/admin/produtos/novo` e `/admin/produtos/[id]` — três blocos:
  - **Dados**: nome, slug (gerado do nome, editável), detalhe, descrição, preço, peso, categoria, coleções, "novo", status.
  - **Variantes**: grade cor × tamanho com o estoque digitado em cada célula; célula vazia não vira variante; SKU gerado (`slug-cor-tamanho`), editável.
  - **Fotos**: envio para o bucket `produtos`, arrastar para ordenar, marcar a cor da foto.
- `/admin/categorias`, `/admin/colecoes`, `/admin/cores` — listas para criar, renomear, reordenar e desativar.
- `/admin/frete` — faixas de CEP, endereço de retirada, remetente da etiqueta, limite de estoque baixo.
- `/admin/equipe` — já existe, sem mudança.

### 4.2 Atendimento (`requireRole(["admin", "atendente"])`)

- `/atendimento` — fila de pedidos em abas por status ("Pagos para separar", "Em separação", "Enviados", "Prontos para retirada", "Precisa de atenção", "Todos"), busca por número, nome ou e-mail.
- `/atendimento/pedidos/[id]` — itens, cliente, endereço, pagamento, histórico; botões só para as próximas transições permitidas; campo de rastreio (salvar rastreio sugere "Marcar como enviado"); "Imprimir etiqueta"; nota interna.

### 4.3 Visual

Fundo `paper`, tabelas com borda de 1px, rótulos em `.label`, status como etiquetas retas (oliva para pago/entregue, `signal` para atenção). No celular, tabelas viram cartões empilhados. Navegação lateral do painel com `NavLink`. Textos em português, voz ativa.

## 5. Dashboard

- Período: 7, 30 ou 90 dias (via `searchParams`, dentro de `<Suspense>`), fuso `America/Belem`.
- Números do topo: faturamento (pedidos pagos ou além, sem cancelados), pedidos, ticket médio, aguardando envio.
- Vendas por dia: barras em SVG próprio com as cores da marca, sem biblioteca de gráfico.
- 5 mais vendidos por peças e por valor.
- Estoque baixo: variantes ativas com `stock <= limite`, com link para o produto.
- Pedidos com `needs_attention`.

As contas ficam na função SQL `dashboard_summary(from, to)`, que confere `current_app_role() = 'admin'` e devolve um JSON; a página só renderiza.

## 6. Envio

### 6.1 Fase 1 — etiqueta própria

- `/atendimento/pedidos/[id]/etiqueta`: página só de impressão, `@page { size: 100mm 150mm }` (impressora térmica; também imprime em A4). Papel ou "Salvar como PDF" pelo navegador, sem biblioteca de PDF.
- Conteúdo: remetente (`store_settings`), destinatário com CEP em destaque, número do pedido em Code128, forma de envio, volumes, logo RICO pequeno, preto sobre branco.
- `src/lib/code128.ts`: função pura que gera as barras (SVG), testada contra valores conhecidos.
- Declaração de conteúdo (modelo dos Correios, A4): itens, quantidades, valor, peso total. "Imprimir etiqueta + declaração" junta as duas.
- Lote: na aba "Em separação", marcar vários pedidos e imprimir todas as etiquetas, uma por página (`/atendimento/etiquetas?ids=…`, ids de pedido apenas).
- Abrir a impressão registra `etiqueta_impressa` em `order_events`.
- Retirada: sem etiqueta; o pedido vai para `pronto_retirada` e o cliente apresenta o número no balcão.

### 6.2 Fase 2 — Melhor Envio (depois)

`MelhorEnvioProvider` implementa `ShippingProvider` com `quote()` (frete real no checkout) e `purchaseLabel()` (etiqueta oficial). Nova tabela `shipments` (transportadora, PDF, rastreio automático). Requer perfis de caixa (P, M, G) em `/admin/frete`. A etiqueta própria continua como alternativa.

## 7. Hero 3D — muro de concreto

### 7.1 Cena

- O hero da home ocupa a tela inteira: muro de 6 × 3 placas de concreto pré-moldado com juntas fundas, fundo `ink`.
- **RICO** atravessa as placas em baixo-relevo, na Archivo largura 125, peso 800, itálico. O relevo é desenhado num canvas 2D com a fonte já carregada e vira mapa de relevo.
- Concreto procedural em shader (ruído e poros), sem textura para baixar, quase sem cor.
- Uma luz dura e lateral (poste). Computador: segue o mouse. Toque: varredura lenta automática.

### 7.2 Movimento

- O hero fica preso (`sticky`) por cerca de 1,5 tela.
- Com o scroll, as placas se soltam uma a uma e deslizam para a esquerda, em escada e com leve giro (mesmo vocabulário da transição horizontal entre páginas).
- Atrás delas aparecem as duas fotos do hero, a frase "As marcas que movem o streetwear, agora em Belém." e os botões atuais.
- Ao fim do trecho o muro sai e a página segue até "Comprar por categoria".

### 7.3 Acessibilidade, SEO e queda

- O `h1` (Street / Casual / Trabalho) e os botões são HTML de verdade sobre o canvas; o canvas é `aria-hidden`. O LCP é o texto.
- `prefers-reduced-motion`: muro parado (luz muito lenta), sem scroll preso, conteúdo logo abaixo.
- Versão estática em CSS com a mesma composição (placas com juntas, RICO em relevo por `text-shadow`): aparece antes do 3D carregar, sem WebGL ou com economia de dados (`navigator.connection.saveData`). A troca não muda o layout.

### 7.4 Desempenho

- `three` + `@react-three/fiber` (sem drei), via `next/dynamic` com `ssr: false`, carregados depois que a página fica ociosa. Orçamento: no máximo ~200 KB gzip adicionais, fora do caminho crítico.
- DPR limitado a 1,5; render pausado com o hero fora da tela (IntersectionObserver).
- Meta: 60 fps no computador, 30 fps ou mais em celular médio.

### 7.5 Código

`src/components/hero-wall/`:

- `hero-wall.tsx` — cliente; escolhe estático ou 3D e liga o progresso do scroll pelo `motion` (já instalado).
- `wall-scene.tsx` — a cena.
- `concrete-material.ts` — o shader.
- `wall-motion.ts` — função pura: progresso do scroll (0–1) → posição e giro de cada placa. Testada.

Atualizar `docs/identidade-visual.md` (seção Movimento) ao entregar.

## 8. Configuração

Novas variáveis, validadas em `src/lib/env.ts` e documentadas em `.env.example`, todas só no servidor:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYMENT_PROVIDER` — `simulado` | `mercadopago`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`

O cliente Supabase com service role fica num módulo `server-only` usado apenas pelo webhook e pelas tarefas do sistema.

## 9. Testes

- **Unitários** (vitest, `tests/unit`): `order-status.ts`; totais e frete por faixa de CEP; `code128.ts`; `wall-motion.ts`; schemas zod dos formulários; verificação de assinatura do webhook com exemplo assinado.
- **Banco** (pgTAP, `supabase test db`, em `supabase/tests/`): RLS por papel (cliente não lê pedido de outro, atendente não edita preço, anônimo não escreve no catálogo, ninguém escreve direto em `orders`); `create_order` sem estoque não grava nada; duas compras da última peça, só uma passa; expiração devolve estoque; `mark_order_paid` repetido sem efeito duplo; pagamento tardio sem estoque marca `needs_attention`.
- **Ponta a ponta** (Playwright, nova dependência de desenvolvimento, só o caminho crítico, com `PAYMENT_PROVIDER=simulado`): entrar → sacola → checkout com envio → pagar no simulado → pedido "Pago" em `/conta` → atendente imprime etiqueta, informa rastreio e marca "Enviado"; e o fluxo de retirada na loja.
- **Manual no navegador**: hero 3D no computador, em viewport de celular e com reduced-motion emulado; etiqueta salva em PDF.
- Cada etapa termina com `npm run lint && npm run typecheck && npm test && npm run build`.

## 10. Ordem de entrega

Cada etapa ganha seu próprio plano de implementação e deixa o site funcionando.

1. **Catálogo no banco**: migrations do catálogo e bucket; os 12 produtos de `catalog.ts` viram `seed.sql`; a loja pública lê do banco e fica igual por fora; CRUD do admin (seção 4.1, menos frete); `catalog.ts` sai; `tests/unit/catalog.test.ts` é substituído.
2. **Checkout e pagamento**: sacola por variante, `/checkout`, `create_order`, frete por tabela e retirada, `/admin/frete`, provedor simulado, Mercado Pago sandbox, webhook, expiração, `/conta/pedidos`.
3. **Atendimento e etiqueta**: fila, transições, rastreio, etiqueta, declaração, lote.
4. **Dashboard**.
5. **Hero 3D**: independente; pode correr em paralelo a partir da etapa 1.
6. **Fase 2 de envio**: Melhor Envio.
