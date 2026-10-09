# Rico Store

Loja de streetwear em Belém. Esta é a base: vitrine com a identidade visual do layout, login e três papéis de acesso.

## Tecnologia

- **Next.js 16** (App Router, Cache Components, Partial Prefetching) e **React 19.3**
- **TypeScript** e **Tailwind CSS 4**
- **Supabase**: login, banco Postgres e RLS
- **View Transitions** do React para a transição horizontal entre páginas
- **motion**, **Lenis** e **Embla**: animações, rolagem suave e carrossel
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

Precisa de Node 22+ e, para o login, Docker (Supabase local).

```bash
npm install
cp .env.example .env.local     # só para o login; sem isto a vitrine já roda
npm run db:start               # sobe o Supabase local e imprime as chaves
# cole a URL e a anon key impressas em .env.local
npm run dev
```

Sem Supabase configurado a vitrine funciona normalmente; `/login` avisa que o login está desligado.

### Primeiro administrador

1. Crie a conta em `/cadastro`.
2. No SQL Editor do Supabase (ou Studio local, `http://127.0.0.1:54323`):

   ```sql
   update public.profiles set role = 'admin' where email = 'voce@exemplo.com';
   ```

3. Saia e entre de novo: você cai em `/admin`. Daí em diante promova a equipe em `/admin/equipe`.

Em produção, aplique as migrations (`supabase db push`) e, em _Authentication → URL Configuration_, informe a URL do site.

## Estrutura

```
src/app/            páginas: vitrine, /colecao/[slug], login, cadastro, conta, atendimento, admin
src/components/     cabeçalho, rodapé, cartão de produto, logo, transição
src/content/        loja (site.ts) e catálogo de exemplo (catalog.ts)
src/lib/roles.ts    regras de papéis (puro, testado)
supabase/migrations tabelas, RLS e gatilhos
docs/identidade-visual.md
```

## Antes de publicar

- Preencher endereço, horário, WhatsApp e Instagram em `src/content/site.ts` (hoje entre colchetes, como no layout).
- Trocar os preços de exemplo e as fotos provisórias (`public/images/` + `<Photo src>`).
- Escolher as fontes finais, se a marca tiver as suas.

## Próximos passos

Catálogo e estoque no banco (hoje é `src/content/catalog.ts`), página de produto, checkout (hoje a sacola vive no navegador e fecha o pedido pelo WhatsApp), fila de atendimento com conversas, busca e as páginas de ajuda do rodapé.

## Comandos

`npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
