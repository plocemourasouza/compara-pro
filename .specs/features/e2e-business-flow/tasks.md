# Tasks: E2E do Fluxo de Negócio
**Feature:** e2e-business-flow | **Data:** 2026-06-10 | **Estimativa:** ~2.5h
**Referências:** [spec.md](./spec.md) | [design.md](./design.md)

## Resumo
- Total de tasks: 9
- Dependências externas: dev server `:3000` + seed demo (global-setup já cobre); **precisa rodar localmente** (E2E não roda headless sem server).
- Verificação: `npm run test:e2e` (Playwright sobe o webServer automaticamente).
- ⚠️ E2E **exige server local** — bloqueado por preferência local-first só p/ *deploy*, não p/ rodar testes; mas o agente não sobe o server sem aval (sessão anterior negou o start).

## Tasks

### Helpers (base)
- [x] **T-01**: Criar `e2e/helpers/auth.ts` com `loginAs(page, email, password?)`
  - Extrai o bloco de login UI (form + "Entrar" + `waitForURL` do painel por papel)
  - Critério: importável; tipado (`DemoEmail`); sem `any`
  - Estimativa: 20min

- [x] **T-02**: Migrar ≥1 spec existente p/ usar `loginAs` (prova de reuso — AC-04)
  - Ex.: `e2e/client-routes.spec.ts` passa a chamar `loginAs(page, "comprador@demo.com")`
  - Critério: `npm run test:e2e e2e/client-routes.spec.ts` verde; bloco duplicado removido
  - Estimativa: 15min

### Spec do fluxo (incremental — validar cada etapa)
- [x] **T-03**: Esqueleto `e2e/business-flow.spec.ts` com `describe.serial` + 2 contexts
  - Cria `buyerCtx`/`supplierCtx`; `loginAs` em cada; teardown dos contexts
  - Critério: ambos logam, test "vazio" passa (só logins)
  - Estimativa: 20min

- [x] **T-04**: Etapa comprador — selecionar upload (Radix) + "Comparar" + ver resultados
  - Decisão 2: tentar `getByRole` p/ o Select; se flaky, adicionar `data-testid` mínimo
  - Critério: resultados da comparação visíveis; sem `pageerror` (AC-05)
  - Estimativa: 30min

- [x] **T-05**: Etapa comprador — ajustar seleção + "Confirmar pré-pedido"
  - Ajusta fornecedor/quantidade de ≥1 item; clica "Confirmar pré-pedido" (compare-client L795)
  - Critério: confirmação (toast/redirect) capturada (AC-01)
  - Estimativa: 25min

- [x] **T-06**: Etapa representante — ver o pré-pedido em `/supplier/pre-orders`
  - Localiza o pré-pedido criado (mais recente / valor estável — Decisão 4)
  - Critério: pré-pedido visível na lista (AC-02)
  - Estimativa: 20min

- [x] **T-07**: Etapa representante — "Aprovar" + assert status final
  - Clica "Aprovar" (pre-orders-client L178) → assert status "aprovado" na UI
  - Critério: AC-03 verde
  - Estimativa: 20min

- [ ] **T-08 (condicional)**: Parecer/override no fluxo (se `ParecerPanel` acessível)
  - Registra parecer antes da aprovação; valida persistência (AC-06)
  - Critério: parecer persiste; OU documentar gap residual + atualizar [[backlog-deferred-items]]
  - Estimativa: 25min

### Validação
- [x] **T-09**: Rodar suíte E2E completa (sem regressão nos 16 specs)
  - Comando: `npm run test:e2e`
  - Critério: todos verdes, novo incluso; sem flaky em 2 execuções seguidas
  - Estimativa: 15min

## Mapeamento AC → Tasks
| AC | Tasks |
|----|-------|
| AC-01 (cria pré-pedido pela UI) | T-04, T-05 |
| AC-02 (representante vê) | T-06 |
| AC-03 (aprova, status final) | T-07 |
| AC-04 (helper reusado ≥2 specs) | T-01, T-02, T-03 |
| AC-05 (Radix estável) | T-04 |
| AC-ERROR-01 (falha aponta etapa) | T-03..T-07 (asserts por etapa) |
| AC-06 (parecer, condicional) | T-08 |

## Agentes & Skills
| Bloco | Agente | Skill |
|-------|--------|-------|
| T-01..09 | `qa-automation-engineer` | `e2e-playwright`, `webapp-testing` |
| T-04 (Radix) — se mexer no componente | `frontend-engineer` | `frontend-ui-system` |

## Ordem
```
T-01 → T-02 (helper + reuso)
T-01 → T-03 → T-04 → T-05 → T-06 → T-07 → [T-08] → T-09  (fluxo incremental)
```
