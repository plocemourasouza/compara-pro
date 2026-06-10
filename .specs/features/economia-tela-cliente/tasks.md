# Tasks: Economia na Tela do Cliente
**Feature:** economia-tela-cliente | **Data:** 2026-06-10 | **Estimativa:** ~2h
**Referências:** [spec.md](./spec.md) | [design.md](./design.md)

## Resumo
- Total de tasks: 12
- Estimativa total: ~2h
- Dependências externas: nenhuma (sem migration, sem serviço, sem aprovação)
- Stack de verificação: `npm run test` (vitest), `npm run typecheck` (tsc), `npm run lint` (biome), `npm run verify:cycle` (smoke API). **Build local evitado** (`npm run build` roda `prisma migrate deploy` — deploy bloqueado, ver [[local-first-no-deploy]]); validar por typecheck.

## Tasks

### Lógica de cálculo (TDD — teste antes)
- [x] **T-01 (RED)**: Escrever testes das funções puras de economia
  - Arquivo: `src/lib/savings.test.ts` (colocado, padrão do projeto)
  - Cobrir: `calcItemSavings(targetPrice, chosenPrice, qty)` → AC-03 (`(10−8)×3=6`), AC-04 (targetPrice null → 0), AC-05 (preço≥alvo → 0, sem negativo); `calcTotalSavings(matches, selections)` → AC-06 (soma 6+4=10), AC-09 (item não incluído fora), AC-10 (paridade fórmula admin)
  - Critério: `npm run test` → FALHA (módulo `./savings` não existe) = RED confirmado
  - Estimativa: 25min

- [x] **T-02 (GREEN)**: Implementar `src/lib/savings.ts`
  - Funções puras: `calcItemSavings` = `targetPrice == null ? 0 : Math.max(0, (targetPrice − chosenPrice)) × quantity`; `calcTotalSavings` soma sobre `included && supplierId` com preço do fornecedor escolhido
  - Contrato: ver design.md "Funções de cálculo". Fórmula idêntica a `savings.finalizedSavings` (RF-04)
  - Critério: `npm run test` → T-01 passa (GREEN), 0 failures
  - Estimativa: 20min

- [x] **T-03 (REFACTOR)**: Limpar `savings.ts` mantendo verde
  - Critério: `npm run test` verde + `npm run lint` 0 erros no arquivo
  - Estimativa: 10min

### API — expor targetPrice (RF-01)
- [x] **T-04**: Adicionar `targetPrice` ao map do `clientProduct` em `GET /api/comparison/[id]`
  - Arquivo: [src/app/api/comparison/[id]/route.ts](src/app/api/comparison/[id]/route.ts) — bloco `formattedComparison.matches.map`, objeto `clientProduct` (L60-68)
  - Mudança: `targetPrice: match.clientProduct.targetPrice` (campo já vem do `include`, só não era mapeado)
  - Critério: `npm run typecheck` exit 0; resposta JSON inclui `clientProduct.targetPrice` (number|null) — confere AC-01/AC-02 via `npm run verify:cycle` ou curl manual
  - Estimativa: 10min

### UI — tipo, cálculo e render (compare-client)
- [x] **T-05**: Adicionar `targetPrice?: number | null` ao tipo `ClientProduct`
  - Arquivo: [src/app/client/compare/compare-client.tsx](src/app/client/compare/compare-client.tsx) L60-65
  - Critério: `npm run typecheck` exit 0
  - Estimativa: 5min

- [x] **T-06**: Render economia por item (badge discreto sob preço escolhido)
  - Arquivo: compare-client.tsx (linha do match / bloco do preço escolhido ~L578-603)
  - Usa `calcItemSavings`; label textual "Economia" + valor (não só cor, a11y); oculto quando 0/null
  - Critério: AC-03/04/05 verificáveis manualmente; recalcula ao trocar fornecedor (AC-08)
  - Estimativa: 25min

- [x] **T-07**: Render economia total no resumo (card junto ao `bestPriceTotal`)
  - Arquivo: compare-client.tsx (bloco de resumo ~L499)
  - Usa `calcTotalSavings`; bloco oculto quando total = 0 (AC-07)
  - Critério: AC-06 (total correto) + AC-07 (oculto sem economia) manualmente
  - Estimativa: 20min

- [x] **T-08**: Dedup `formatCurrency` (decisão 2B)
  - Arquivo: compare-client.tsx — remover função local L112-117, importar de [src/lib/format.ts](src/lib/format.ts)
  - Critério: `npm run typecheck` + `npm run lint` 0 erros; sem referência órfã
  - Estimativa: 5min

### Validação Final
- [x] **T-09**: Verificação de render E2E (economia visível)
  - Ação: Playwright ou manual no fluxo upload→comparar; confirmar badge item + total
  - Critério: economia aparece p/ item com targetPrice; ausente sem targetPrice (AC-03/04)
  - Estimativa: 15min

- [x] **T-10**: Suíte completa
  - Comando: `npm run test`
  - Critério: 0 failures, 0 skipped (inclui savings.test.ts + sem regressão)
  - Estimativa: 5min

- [x] **T-11**: Typecheck + lint
  - Comandos: `npm run typecheck` && `npm run lint`
  - Critério: ambos exit 0
  - Estimativa: 5min

- [x] **T-12**: Smoke do ciclo de negócio (sem regressão comparar→pré-pedido)
  - Comando: `npm run verify:cycle`
  - Critério: ciclo passa (comparar→parecer→override→pré-pedido→aprovar intactos)
  - Estimativa: 5min

## Mapeamento AC → Tasks
| Acceptance Criteria | Tasks que validam |
|---|---|
| AC-01 (API expõe targetPrice) | T-04, T-12 |
| AC-02 (targetPrice null preservado) | T-01, T-04 |
| AC-03 (economia item correta) | T-01, T-02, T-06, T-09 |
| AC-04 (sem targetPrice → oculto) | T-01, T-02, T-06, T-09 |
| AC-05 (preço≥alvo, sem negativo) | T-01, T-02, T-06 |
| AC-06 (total correto) | T-01, T-02, T-07 |
| AC-07 (total oculto se 0) | T-07 |
| AC-08 (recalcula ao trocar fornecedor) | T-06, T-07 |
| AC-09 (item desmarcado sai do total) | T-01, T-02, T-07 |
| AC-10 (paridade com admin) | T-01, T-02 |

## Agentes & Skills sugeridos por bloco
| Bloco | Agente | Skill |
|-------|--------|-------|
| T-01..03 (cálculo TDD) | `backend-engineer` | `tdd-workflow`, `testing-patterns` |
| T-04 (API) | `backend-engineer` | `nextjs-react-expert` |
| T-05..08 (UI) | `frontend-engineer` | `frontend-ui-system`, `tailwind-patterns` |
| T-09 (E2E) | `qa-automation-engineer` | `e2e-playwright` |
| T-10..12 (validação) | — | `verification-before-completion` |

## Ordem de execução (dependências)
```
T-01 → T-02 → T-03        (lógica pura, base de tudo)
   └─ T-04 (API, paralelo após T-03)
   └─ T-05 → {T-06, T-07} → T-08   (UI, depende de T-02 p/ funções)
T-04 + T-08 done → T-09 → T-10 → T-11 → T-12   (validação final, sequencial)
```
