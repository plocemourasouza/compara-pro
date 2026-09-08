# STATE — handoff

**Atualizado:** 2026-09-08 · Branch **main** · working tree **limpo**.
**Sincronizado:** `main` à frente de `origin/main` — bloco de dívida **não pushado** (aguarda "pode pushar").
**Build:** `lint` exit 0 (**0 erros, 0 infos**) · `typecheck` exit 0 · **241/241** Vitest (24 arquivos) · **52/52** Playwright · `verify:cycle` FINALIZED.

---

## Entregue nesta sessão

### Bloco de dívida fechado (2026-09-08, tarde)

1. **Rota legada `/dashboard` extinta** — os 43 guards passaram a usar `redirect(dashboardForArea(user.area))`, reaproveitando o helper que `src/lib/actions/auth.ts` já usava. `src/app/dashboard/` apagado (a `actions.ts`, o `header.tsx` e o `sidebar.tsx` de lá já eram código morto). Junto foram os 3 links "Voltar para Dashboard" das sidebars, o `router.push` do wizard de upload, dois `revalidatePath` e a entrada em `protectedPageRoutes`. `src/components/dashboard/` é outro diretório e continua vivo.
2. **E2E deixou de vazar** — `scripts/cleanup-e2e.cjs` + `e2e/global-teardown.ts` varrem as empresas `Cliente E2E %` e seus usuários de contato, na ordem de FK (o schema não tem um único `onDelete`) e com guarda por `_count` antes do delete final. Removeu as 10 órfãs acumuladas; rodar a suíte agora mantém a contagem de empresas estável (24 → 24). O `DELETE /api/supplier/clients/[id]` **não** foi alterado — desvincular ≠ apagar empresa continua sendo a semântica correta.
3. **Lint zerado** — 5 erros e 22 infos → 0/0. `biome migrate` levou o config de 2.4.16 para 2.5.12 (`recommended` → `preset`, mesmo conjunto de regras); 4 SVGs do template Next apagados; o favicon `src/app/icon.svg` ganhou `<title>` (era o 5º erro, e não dava para apagar).
4. **Cobertura nova: 160 → 241 testes** — `area.test.ts` e `normalize.test.ts` (puros, env node) mais o harness React (jsdom + testing-library, via `src/test/react.tsx` importado, nunca `setupFiles`) e 3 componentes com lógica real.
5. **Leftovers** — `.claude/project_info/` removido do git; banco `price_comparison_shadow` dropado.

### Sessão anterior

1. **Baseline de migrations consertado** — o `0_init` criava `enum Role`, `users.role`, `pg_trgm` e índices GIN que não existiam no schema nem no banco. Regenerado a partir do `schema.prisma`, com a `20260617000000_preorder_representative` incorporada. `migrate dev` volta a funcionar; `db push` deixa de ser necessário.
2. **Harness de teste com Prisma** (`src/test/prisma-mock.ts`, `auth-mock.ts`, via `vitest-mock-extended`) — destravou as 3 tasks RED do F6 que estavam paradas desde junho por falta de mock. 144 → **160 testes**.
3. **`proxy.ts` fail-closed** — `/api/*` é protegido por padrão; só a allowlist explícita escapa, com match exato. Antes era lista de prefixos, e 9 grupos de rotas não estavam listados (os handlers barravam, a borda não).
4. **Error boundaries e loading** — `not-found`/`error`/`global-error` na raiz, `error`/`loading` nas 3 áreas, `ErrorBoundary` isolando o parecer de IA e os dashboards.
5. **Rodapé sem links falsos** na landing; título do header derivado da rota.
6. **Limpeza de escopo** — guia de deploy, proposta SEBRAE e 5 docs de planejamento contraditórios removidos do repo.

## Como rodar / verificar

O dev server roda na **3150** (`bun run dev` já fixa a porta).

```bash
bun run test          # 241 testes, 24 arquivos
bun run typecheck
bun run lint          # baseline limpo: 0 erros, 0 infos
bun run e2e:cleanup   # varre órfãs do E2E (idempotente)
BASE_URL=http://localhost:3150 bun run verify:cycle
BASE_URL=http://localhost:3150 ./node_modules/.bin/playwright test --workers=1
```

`--workers=1` é obrigatório nas specs cross-role. Após mudança de schema: `./node_modules/.bin/prisma generate` **e reiniciar o dev server**, senão dá 500 em runtime.

## Diferido — Bloco E (congelado)

Redis, background jobs, monitoramento, Elasticsearch, rate limiting, WebSockets e ML matching ficam por último, depois de tudo o mais. Detalhe em `docs/PERFORMANCE_IMPROVEMENTS.md`.

## Follow-ups

- **Autorização espalhada**: 52 dos 54 handlers chamam o gate (`/api/compare` usa `verifyToken` com Bearer, padrão antigo). O teste `src/app/api/auth-guard.test.ts` falha se um handler novo esquecer. Consolidar as ~50 páginas que repetem `if (user.area !== …) redirect(...)` foi avaliado e descartado: risco alto, valor baixo.
- **Cobertura de componentes ainda rasa** — 3 componentes com lógica real cobertos (`status-badge`, `masked-input`, `useCompanyFilters`); o resto da UI segue coberto só pelos 52 specs E2E.
- **Dois comportamentos fixados como "atual, suspeito"** (teste documenta, não corrige): `cityOptions` deduplica cidade por **nome**, então "São Paulo/SP" e "São Paulo/MG" colapsam (`company-filters.tsx:50-61`); e a máscara de CNPJ devolve valor **cru** quando passa de 14 dígitos, em vez de truncar (`masks.ts`).
- **Janela de data do `useCompanyFilters`** usa `setHours` em zona **local** contra `createdAt` em UTC (`company-filters.tsx:71-76`) — o teste fixa `TZ=America/Sao_Paulo` para não ficar dependente da máquina.

## Gotchas

- **Worktree defasado produz verificação falsa.** Os worktrees dos agentes nasceram 3 commits atrás da `main`; um `migrate diff` passou comparando migração velha contra schema velho e deixou passar uma coluna faltando. Conferir a base antes de aceitar prova de subagente.
- Prisma CLI: `./node_modules/.bin/prisma` (npx quebra com rtk). `migrate reset` exige `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=1`.
- DB: Postgres `localhost:5435/price_comparison`, container Docker `price-comparison-db`. Seed: `reset:data` → `seed:demo` → `seed:full`. **Não alterar `seed:demo`** — o global-setup do Playwright depende dele.
- `seed-demo.cjs` engole a mensagem de erro (imprime só a 1ª linha e sai com código 0). Para diagnosticar, rodar uma cópia com o `catch` neutralizado.
- Auth routing em `src/proxy.ts` (não existe `middleware.ts`).
- Conta = empresa; **não existe `User.role`** — a área vem de `company.type` via `src/lib/area.ts`. Admin = usuário sem empresa.
- Preferências: merge direto na main, sem PR; nunca pushar sem autorização explícita; ao push, atualizar README + About do GitHub.
