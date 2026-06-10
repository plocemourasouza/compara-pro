# Tasks: F6 — Parar Staging do Lado Fornecedor
**Feature:** f6-supplier-staging-cleanup | **Data:** 2026-06-10 | **Estimativa:** ~2h
**Referências:** [spec.md](./spec.md) | [design.md](./design.md)

## Resumo
- Total de tasks: 10
- Dependências: nenhuma de schema. Verificação final (`verify:cycle`/E2E) precisa server local.
- ⚠️ **Ordem obrigatória:** migrar leitores (T-02..T-06) ANTES de parar o write (T-07). Inverter quebra autocomplete + match manual.

## Tasks

### RF-01 — migrar `searchProducts` (TDD)
- [ ] **T-01 (RED)**: Teste de `searchProducts` lendo catálogo
  - Arquivo: `src/lib/services/optimized-product-matcher.search.test.ts` (ou colocado conforme padrão)
  - Cobrir: retorna produtos de `products` (supplier), shape público mantido, filtro `price>0`/`companyId` (AC-01)
  - Critério: `npm run test` → FALHA (ainda lê staging) = RED
  - Estimativa: 20min

- [x] **T-02 (GREEN)**: Trocar query de `searchProducts` p/ `prisma.product`
  - Arquivo: [optimized-product-matcher.ts](src/lib/services/optimized-product-matcher.ts) L930-962 — `where` + `findMany` + `map`
  - Replicar filtros de `getCarteiraSupplierProducts` (Decisão 3)
  - Critério: T-01 passa; `npm run typecheck` exit 0
  - Estimativa: 25min

### RF-02 — migrar match manual
- [x] **T-03**: Mapear o chamador do match manual (impacto cross-camada)
  - Verificar UI que chama `createManualMatchAction` — qual id ela passa (staging vs catálogo)
  - Critério: documentado qual fonte a UI usa hoje; plano de ajuste se necessário
  - Estimativa: 15min

- [ ] **T-04 (RED)**: Teste do match manual resolvendo id de catálogo
  - Cobrir: id de `products` SUPPLIER → ok; id inexistente/não-supplier → erro claro (AC-02, AC-ERROR-01)
  - Critério: `npm run test` → FALHA = RED
  - Estimativa: 20min

- [x] **T-05 (GREEN)**: Migrar `matching.ts` p/ `prisma.product.findUnique`
  - Arquivo: [matching.ts](src/lib/actions/matching.ts) L28-33 — resolver catálogo + validar `company.type==="SUPPLIER"`
  - Critério: T-04 passa; typecheck 0
  - Estimativa: 20min

- [x] **T-06**: Ajustar chamador (UI) se T-03 apontou id de staging
  - Garantir que a opção de match manual usa id de `products`
  - Critério: typecheck 0; (verificação visual no T-09)
  - Estimativa: 15min

### RF-03 — parar write staging supplier
- [x] **T-07**: Guard no `uploadedProduct.create` (só não-supplier)
  - Arquivo: [file-processor.ts](src/lib/services/file-processor.ts) L238 — `if (uploadType !== "SUPPLIER_PRODUCTS") { create(...) }`
  - Critério: typecheck 0; client (CLIENT_REQUIREMENTS) continua gravando
  - Estimativa: 10min

- [ ] **T-08**: Teste do processador — supplier não grava staging, client grava
  - Cobrir: AC-03 (supplier → 0 staging novo, catálogo atualizado) + AC-04 (client → staging com targetPrice)
  - Critério: `npm run test` verde
  - Estimativa: 25min

### Validação
- [x] **T-09**: Anti-regressão — `verify:cycle` + E2E (precisa server)
  - Comando: `npm run dev` (separado) + `npm run verify:cycle` (+ E2E se disponível)
  - Critério: ciclo comparar→match→pré-pedido→aprovar intacto (AC-05); autocomplete + match manual funcionam
  - Estimativa: 20min

- [x] **T-10**: Suíte + typecheck + lint
  - Comandos: `npm run test` && `npm run typecheck` && `npm run lint`
  - Critério: todos verdes/exit 0
  - Estimativa: 10min

## Mapeamento AC → Tasks
| AC | Tasks |
|----|-------|
| AC-01 (searchProducts catálogo) | T-01, T-02 |
| AC-02 (match manual catálogo) | T-04, T-05 |
| AC-03 (supplier não grava staging) | T-07, T-08 |
| AC-04 (client grava staging) | T-08 |
| AC-05 (sem regressão) | T-09 |
| AC-ERROR-01 (id inexistente) | T-04, T-05 |

## Agentes & Skills
| Bloco | Agente | Skill |
|-------|--------|-------|
| T-01..08 | `backend-engineer` | `tdd-workflow`, `prisma-expert`, `postgres-optimization` |
| T-06 (UI match manual) | `frontend-engineer` | `frontend-ui-system` |
| T-09..10 | `qa-automation-engineer` | `verification-before-completion` |

## Ordem (crítica)
```
T-01→T-02 (searchProducts)  ┐
T-03→T-04→T-05→T-06 (match) ┼─ leitores migrados PRIMEIRO
                            ┘
        └──────────────► T-07→T-08 (parar write) ──► T-09→T-10 (verificar)
```
