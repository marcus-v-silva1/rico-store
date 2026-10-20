@AGENTS.md

# Rico Store — notas do projeto

- Loja de streetwear em Belém. Papéis: `admin`, `atendente`, `cliente` (`src/lib/roles.ts`, puro e testado em `tests/unit`).
- O papel vive em `public.profiles.role`. Toda página protegida chama `requireRole()` (`src/lib/auth.ts`); o proxy é só a 1ª barreira.
- Nunca leia papel de `user_metadata` nem aceite papel vindo de formulário de cadastro.
- Next 16 com Cache Components: `cookies`, `params` e `searchParams` ficam dentro de `<Suspense>`. Middleware se chama `proxy.ts`.
- Transição horizontal: `NavLink` (direção) + `PageTransition` em cada `page.tsx`. Links "para frente" usam `forward`, o logo e "voltar" usam `back`.
- Identidade visual em `docs/identidade-visual.md`; tokens em `src/app/globals.css`.
- Textos da interface em português, voz ativa, sem jargão.
- O catálogo vive no banco (`supabase/migrations/20261020000000_catalog.sql`); `src/content/catalog.ts` não existe mais.
- Leituras públicas passam por `src/lib/catalog/queries.ts` (`'use cache'` + tag `catalogo`) e nunca chamam `cookies`/`headers`.
- Toda action do admin que muda o catálogo chama `updateTag(CATALOG_TAG)`.
- Regras puras do catálogo ficam em `src/lib/catalog/` e têm teste unitário; regras do banco e RLS são testadas com pgTAP em `supabase/tests/` (`npm run test:db`).
- Fotos de produto vão para o bucket `produtos`; URLs de loopback (Supabase local) renderizam com `unoptimized`.
- Antes de concluir: `npm run db:reset && npm run test:db && npm run lint && npm run typecheck && npm test && npm run build`.
