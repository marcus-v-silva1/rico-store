# Rico Store

Loja de streetwear em Belém. Vitrine com a identidade visual do layout, catálogo no banco com painel de administração, login e três papéis de acesso.

## Tecnologia

- **Next.js 16** (App Router, Cache Components, Partial Prefetching) e **React 19.3**
- **TypeScript** e **Tailwind CSS 4**
- **Supabase**: login, banco Postgres e RLS
- **View Transitions** do React para a transição horizontal entre páginas
- **Vitest** para as regras de negócio

## Papéis

| Papel       | Entra em       | Pode                                                                                            |
| ----------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `cliente`   | `/conta`       | Ver e sair da própria conta                                                                     |
| `atendente` | `/atendimento` | Tudo do cliente e ver a lista de clientes                                                       |
| `admin`     | `/admin`       | Tudo do atendente, ver números da loja e **mudar o papel** de qualquer conta em `/admin/equipe` |

Como funciona a segurança:

1. Todo cadastro vira `cliente`. O papel nunca vem do formulário nem de `user_metadata`.
2. Só um admin (ou o SQL Editor) muda papéis: política de RLS **e** gatilho no banco.
3. O `proxy.ts` barra quem não entrou; cada página confere o papel no banco com `requireRole()`.

## Rodando

Precisa de Node 22+ e Docker (Supabase local): o catálogo e o login vêm do banco.

```bash
npm install
cp .env.example .env.local     # URL e anon key do Supabase
npm run db:start               # sobe o Supabase local, aplica as migrations e o seed e imprime as chaves
# cole a URL e a anon key (npx supabase status) em .env.local
npm run dev
```

O catálogo (produtos, categorias, coleções e cores) vem do banco. Sem Supabase configurado, o site abre sem produtos ("Ainda não há peças aqui. Volte em breve.") e `/login` avisa que o login está desligado.

Em produção:

1. Aplique as migrations: `npx supabase db push`.
2. **Uma vez só**, carregue o catálogo inicial: `npx supabase db push --include-seed`, ou cole e rode `supabase/seed.sql` no SQL Editor. O `db push` sozinho não roda o seed: sem este passo a loja abre vazia. O seed pode rodar de novo sem duplicar nada (o que já existe fica como está), mas recria peças do catálogo inicial que você tenha apagado.
3. Em _Authentication → URL Configuration_, informe a URL do site.

Comandos do banco:

- `npm run db:reset`: recria o banco do zero e roda o `supabase/seed.sql`. **Apaga as contas locais**; crie o admin de novo depois.
- `npm run db:types`: gera os tipos TypeScript a partir do banco (rode depois de mudar uma migration).
- `npm run test:db`: roda os testes pgTAP de `supabase/tests/` (regras e RLS).
- `npm run db:stop`: desliga o Supabase local.

### Primeiro administrador

1. Crie a conta em `/cadastro`.
2. No SQL Editor do Supabase (ou Studio local, `http://127.0.0.1:54323`):

   ```sql
   update public.profiles set role = 'admin' where email = 'voce@exemplo.com';
   ```

   (O mesmo comando está no comentário do topo de `supabase/seed.sql`.)

3. Saia e entre de novo: você cai em `/admin`. Daí em diante promova a equipe em `/admin/equipe`.

### Onde mantenho o catálogo

Em `/admin`: produtos (com grade de cor × tamanho, cor principal e fotos), categorias, coleções e cores. A cor principal é a que o card da loja mostra primeiro. Cada alteração atualiza a vitrine na hora (tag de cache `catalogo`). As fotos ficam no bucket `produtos` do Supabase Storage.

## Estrutura

```
src/app/            páginas: vitrine, /colecao/[slug], /categoria/[slug], login, cadastro, conta, atendimento, admin
src/components/     cabeçalho, rodapé, cartão de produto, logo, transição
src/content/        dados fixos da loja (site.ts)
src/lib/catalog/    catálogo: leituras do banco (queries.ts) e regras puras
src/lib/roles.ts    regras de papéis (puro, testado)
supabase/migrations tabelas, RLS e gatilhos
supabase/tests      testes pgTAP do banco
supabase/seed.sql   dados iniciais
docs/identidade-visual.md
```

## Antes de publicar

- Preencher endereço, horário, WhatsApp e Instagram em `src/content/site.ts` (hoje entre colchetes, como no layout).
- Cadastrar os produtos reais, preços e fotos em `/admin`.
- Escolher as fontes finais, se a marca tiver as suas.

## Próximos passos

Página de produto, sacola com checkout (hoje a sacola só conta peças no navegador), fila de atendimento com conversas, busca e as páginas de ajuda do rodapé.

## Comandos

`npm run lint` · `npm run typecheck` · `npm test` · `npm run test:db` · `npm run build`
