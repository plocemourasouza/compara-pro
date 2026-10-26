## Learned User Preferences

- Uses Portuguese for operational requests (e.g. "rode o sistema", "reinicie o servidor").
- When asked to run or restart the local stack, start the Next.js dev server on port **3150** (not the default 3000).
- Expects autonomous full-stack recovery: ensure Docker Desktop and the PostgreSQL container are up, then restart the dev server without extra prompts.
- When presenting design direction or model options, keep all options available and let the user choose; do not discard options unilaterally.
- For Impeccable redesign/polish, prefers running stages sequentially in a loop until the surface is adequate, without stopping between stages for confirmation.

## Learned Workspace Facts

- App name: **Compara Pró** (`price-comparison-poc`) — B2B price comparison with RBAC roles `ADMIN`, `REPRESENTATIVE`, and `CLIENT`.
- Local PostgreSQL runs in Docker container `price-comparison-db`, exposed on host port **5435** (host 5432 conflicted with other local Postgres instances).
- Local dev uses Bun: `bun run dev` (Next.js 16 + Turbopack); README still documents npm.
- Prisma migration history is out of order (`20250120000001_*` before `20250805173941_init`); fresh DBs may need `prisma db push` then `seed:demo` until fixed.
- Demo data via `bun run seed:demo` / `npm run seed:demo` / `scripts/seed-demo.cjs`; demo accounts: `admin@demo.com`, `comprador@demo.com`, `representante@demo.com`, and `loja@demo.com`.
- Auth routing uses `src/proxy.ts` (not `middleware.ts`).
- Design system lives in `DESIGN.md` (canvas `#f7f8fc`, ink `#192b49`, primary `#245bcf`, Geist). Orange is not part of the identity, including warnings. Winning price stays green; errors stay red.
- Dual-audience landing brief (comprador `CLIENT` vs representante `REPRESENTATIVE`) is in `docs/features-comprador-representante.md`; product context in `PRODUCT.md`.
- Buyer comparison uses the landing desk as the internal standard: suppliers in columns, lowest price in green, winner named in a “Melhor oferta” column. The same winning-price cell applies wherever an offer is marked, and the buyer can still choose a higher price.
