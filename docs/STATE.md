# STATE — handoff

**Atualizado:** 2026-09-08 · Branch **main** · working tree **limpo**.
**Sincronizado:** `main` = `origin/main` — pushado em 2026-09-08 (22 commits + sync de docs).
**Build:** `typecheck` exit 0 · **160/160** Vitest · **52/52** Playwright (2 execuções seguidas) · `verify:cycle` FINALIZED.

---

## Entregue nesta sessão

1. **Baseline de migrations consertado** — o `0_init` criava `enum Role`, `users.role`, `pg_trgm` e índices GIN que não existiam no schema nem no banco. Regenerado a partir do `schema.prisma`, com a `20260617000000_preorder_representative` incorporada. `migrate dev` volta a funcionar; `db push` deixa de ser necessário.
2. **Harness de teste com Prisma** (`src/test/prisma-mock.ts`, `auth-mock.ts`, via `vitest-mock-extended`) — destravou as 3 tasks RED do F6 que estavam paradas desde junho por falta de mock. 144 → **160 testes**.
3. **`proxy.ts` fail-closed** — `/api/*` é protegido por padrão; só a allowlist explícita escapa, com match exato. Antes era lista de prefixos, e 9 grupos de rotas não estavam listados (os handlers barravam, a borda não).
4. **Error boundaries e loading** — `not-found`/`error`/`global-error` na raiz, `error`/`loading` nas 3 áreas, `ErrorBoundary` isolando o parecer de IA e os dashboards.
5. **Rodapé sem links falsos** na landing; título do header derivado da rota.
6. **Limpeza de escopo** — guia de deploy, proposta SEBRAE e 5 docs de planejamento contraditórios removidos do repo.

## Como rodar / verificar

O dev server roda na **3150** (`bun run dev` já fixa a porta).

```bash
bun run test          # 160 testes
bun run typecheck
bun run lint          # 9 erros pré-existentes (SVGs, biome.json, 2 columns.tsx)
BASE_URL=http://localhost:3150 bun run verify:cycle
BASE_URL=http://localhost:3150 ./node_modules/.bin/playwright test --workers=1
```

`--workers=1` é obrigatório nas specs cross-role. Após mudança de schema: `./node_modules/.bin/prisma generate` **e reiniciar o dev server**, senão dá 500 em runtime.

## Diferido — Bloco E (congelado)

Redis, background jobs, monitoramento, Elasticsearch, rate limiting, WebSockets e ML matching ficam por último, depois de tudo o mais. Detalhe em `docs/PERFORMANCE_IMPROVEMENTS.md`.

## Follow-ups

- **`e2e/supplier-clients.spec.ts`** deixa 6 empresas órfãs no banco (o `DELETE` da carteira remove o vínculo, não a empresa). Inofensivas, mas acumulam.
- **`src/app/dashboard/`** é rota legada — avaliar remoção.
- **Autorização espalhada**: 52 dos 54 handlers chamam o gate (`/api/compare` usa `verifyToken` com Bearer, padrão antigo). O teste `src/app/api/auth-guard.test.ts` falha se um handler novo esquecer. Consolidar as ~50 páginas que repetem `if (user.area !== …) redirect(...)` foi avaliado e descartado: risco alto, valor baixo.
- **Sem cobertura** de componentes React (a UI é coberta pelos 52 specs E2E).
- Restam 8 arquivos em `.claude/project_info/` — os `phase*_completed.md` e specs de referência.
- Banco `price_comparison_shadow` pode ser dropado (foi usado para provar o replay das migrations).

## Gotchas

- **Worktree defasado produz verificação falsa.** Os worktrees dos agentes nasceram 3 commits atrás da `main`; um `migrate diff` passou comparando migração velha contra schema velho e deixou passar uma coluna faltando. Conferir a base antes de aceitar prova de subagente.
- Prisma CLI: `./node_modules/.bin/prisma` (npx quebra com rtk). `migrate reset` exige `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=1`.
- DB: Postgres `localhost:5435/price_comparison`, container Docker `price-comparison-db`. Seed: `reset:data` → `seed:demo` → `seed:full`. **Não alterar `seed:demo`** — o global-setup do Playwright depende dele.
- `seed-demo.cjs` engole a mensagem de erro (imprime só a 1ª linha e sai com código 0). Para diagnosticar, rodar uma cópia com o `catch` neutralizado.
- Auth routing em `src/proxy.ts` (não existe `middleware.ts`).
- Conta = empresa; **não existe `User.role`** — a área vem de `company.type` via `src/lib/area.ts`. Admin = usuário sem empresa.
- Preferências: merge direto na main, sem PR; nunca pushar sem autorização explícita; ao push, atualizar README + About do GitHub.
