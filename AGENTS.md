## Learned User Preferences

- Uses Portuguese for operational requests (e.g. "rode o sistema", "reinicie o servidor").
- When asked to run or restart the local stack, start the Next.js dev server on port **3150** (not the default 3000).
- Expects autonomous full-stack recovery: ensure Docker Desktop and the PostgreSQL container are up, then restart the dev server without extra prompts.
- When presenting design direction or model options, keep all options available and let the user choose; do not discard options unilaterally.
- For Impeccable redesign/polish, prefers running stages sequentially in a loop until the surface is adequate, without stopping between stages for confirmation.
- When committing and pushing, update both `dev` and `main`.
- After finishing work, commit and push by default (both branches). Stay local-only only when the user explicitly asks for that.
- Authenticated panels (admin, comprador, representante) should match the polish of the landing and login; replicate shared component properties rather than leaving internals less finished.
- UI shadows must use shadcn utilities (`shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`), not custom shadow values.
- Prefers free-tier hosting for validation demos (Vercel Hobby + free Postgres such as Supabase/Neon), not paid infra for early validation.
- Landing WhatsApp commercial CTA may deep-link to chat, but must not display the phone number on the card.
- Footer credit “Desenvolvido por oSystems” must stay on one line (no mid-phrase wrap).

## Learned Workspace Facts

- App name / brand lockup: **Compara PRÓ** (`price-comparison-poc`) — B2B price comparison with three roles via `company.type`: `ADMIN`, `REPRESENTATIVE`, and `CLIENT` (Cliente/Comprador); `loja@demo.com` is an extra CLIENT demo account, not a fourth role. Brand assets live in `assets/` and `public/brand/`.
- Local PostgreSQL runs in Docker container `price-comparison-db`, exposed on host port **5435** (host 5432 conflicted with other local Postgres instances).
- Local dev uses Bun: `bun run dev` (Next.js 16 + Turbopack); README still documents npm.
- Prisma migration history is out of order (`20250120000001_*` before `20250805173941_init`); fresh DBs may need `prisma db push` then `seed:demo` until fixed.
- Demo data via `bun run seed:demo` / `scripts/seed-demo.cjs`; demo accounts: `admin@demo.com`, `comprador@demo.com`, `representante@demo.com`, and `loja@demo.com`. Seed is local-by-default — production Supabase stays empty until seeded separately.
- Auth routing uses `src/proxy.ts` (not `middleware.ts`).
- Design system lives in `DESIGN.md` (canvas `#f7f8fc`, ink `#192b49`, primary `#245bcf`, Geist). Orange is not part of the identity, including warnings. Winning price stays green; errors stay red.
- Dual-audience landing brief in `docs/features-comprador-representante.md` / `PRODUCT.md`. Landing/auth: one “Começar agora” to `/auth/login`, header “Entrar” with access icon; no “Imagem ilustrativa gerada por IA”; copyright + “Desenvolvido por oSystems” → https://osystems.com.br.
- Buyer comparison uses the landing desk as the internal standard: suppliers in columns, lowest price in green, winner named in a “Melhor oferta” column. The same winning-price cell applies wherever an offer is marked, and the buyer can still choose a higher price.
- On screen the object is **Pedido** / **Pedidos**. Do not show “pré-pedido”. Routes, models, and APIs stay `pre-order` / `PreOrder`.
- Scope, UI, responsiveness, and secrets for every change are in `RULES.md`.
- Production: Vercel project `compara-pro` at https://compara-pro.vercel.app with Supabase Postgres; build needs `DATABASE_URL` (pooler) and `DIRECT_URL` (direct `:5432` for `prisma migrate deploy`). Do not deploy the `dev` branch on Vercel (`vercel.json`). Cloudflare-only hosting does not fit without rewriting off Postgres/Node.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
