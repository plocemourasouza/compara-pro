# STATE — handoff

**Atualizado:** 2026-06-10 · Branch **main** · HEAD `f30ac7e` · working tree **limpo**.
**Sincronizado:** `main` == `dev` == `origin/*` (0/0). Tudo da última sessão commitado + pushado.
**Build:** typecheck exit 0 · `npm test` 78/78 · e2e business-flow verde.

---

## Shipado na última sessão (já em main + dev)

1. **economia-tela-cliente** — economia (max(0, targetPrice − preço) × qtd) por item + total na compare-client. `src/lib/savings.ts` (+11 testes), API expõe `targetPrice`, dedup `formatCurrency`. Spec: `.specs/features/economia-tela-cliente/`.
2. **F6 + fix FK** — `SupplierMatch.supplierProductId` é FK→Product; match manual gravava `UploadedProduct.id` (bug). Migrado searchProducts + matching.ts p/ catálogo `products`; file-processor para de gravar staging supplier (client mantém). Spec: `.specs/features/f6-supplier-staging-cleanup/`.
3. **e2e-business-flow** — `e2e/business-flow.spec.ts` (2 contexts, comprador→fornecedor pela UI) + `e2e/helpers/auth.ts` (`loginAs`). `playwright.config` + `verify-cycle` honram `BASE_URL`. Spec: `.specs/features/e2e-business-flow/`.
4. **perf(upload)** — `select` no preview do GET `/api/upload`.
5. README + About do GitHub atualizados.

---

## Como rodar / verificar (server na 3150, ver `[[verify-server-port-baseurl]]`)
```
# user sobe o dev server (porta 3150) — agente não sobe (permissão negada)
BASE_URL=http://localhost:3150 npm run verify:cycle
BASE_URL=http://localhost:3150 node scripts/verify-search-catalog.cjs
BASE_URL=http://localhost:3150 npx playwright test --workers=1   # cross-role: serial
npm test ; npm run typecheck ; npm run lint
```

## Próximo / backlog (`[[backlog-deferred-items]]`)
1. **2 specs E2E pré-existentes quebrados** (corrigir à parte, 1 linha cada):
   - `e2e/company-lookup.spec.ts:47` — hardcoda `http://localhost:3000` → trocar por `request` relativo a `baseURL`.
   - `e2e/upload-detail.spec.ts:23` — `getByText('Estatísticas')` casa 2 elementos (strict-mode) → usar `getByRole('heading', {name})`.
2. **E2E match-manual** via UI: precisa de produto **unmatched** no seed (hoje casa tudo) p/ disparar o dialog → fecha F6 AC-07 ponta-a-ponta. Hoje provado por construção (searchProducts → Product.id).
3. **E2E parecer/override** (T-08 de e2e-business-flow).
4. F6 leftover: limpar `UploadedProduct` supplier legado (opcional, inerte) — `[[backlog-deferred-items]]`.

## 🔒 Bloqueado até tudo 100% local (`[[local-first-no-deploy]]`)
Vercel env (`AWS_*`/`S3_*`) + rotação de chave + CI GitHub Actions.

## Gotchas
- Dev server na **3150** (não 3000); smokes/E2E via `BASE_URL`.
- Testes do projeto = só **funções puras** (sem mock de Prisma); `verify:cycle` é o oráculo de integração.
- Prisma CLI: `./node_modules/.bin/prisma` (npx quebra com rtk). DB: Postgres `localhost:5435/price_comparison`, Docker `price-comparison-db`. Seed: `reset:data`→`seed:demo`→`seed:full`.
- `grep`/`find` via rtk distorcem saída → `rtk proxy grep`. Edits com tabs → `mcp__serena__replace_content`.
- Auth routing em `src/proxy.ts` (não `middleware.ts`).
- Preferências: merge direto na main (não PR) `[[merge-over-pr-preference]]`; ao push, README + About `[[sync-repo-update-readme-about]]`.
