# Design: E2E do Fluxo de Negócio
**Feature:** e2e-business-flow | **Data:** 2026-06-10 | **Status:** Draft
**Referência:** [spec.md](./spec.md)

## Arquitetura

### Estrutura de arquivos
```
e2e/
  helpers/
    auth.ts          ← NOVO: loginAs(page, email, password?) + painel esperado por papel
    selectors.ts     ← NOVO (opcional): helpers de Radix Select (selectOption por nome)
  business-flow.spec.ts  ← NOVO: o fluxo comprador→fornecedor pela UI
```

### Fluxo de execução (cross-role em 1 spec)
```
test.describe.serial("fluxo de negócio")   // serial: evita corrida entre papéis
  buyerCtx = browser.newContext()          // sessão isolada do comprador
  supplierCtx = browser.newContext()       // sessão isolada do representante
  ──────────────────────────────────────────────
  [comprador] loginAs(buyerPage, comprador@demo.com)
   → /client/compare → Select upload → "Comparar"
   → ajusta seleção (fornecedor + quantidade) → "Confirmar pré-pedido"
   → captura confirmação (toast/redirect)
  ──────────────────────────────────────────────
  [representante] loginAs(supplierPage, representante@demo.com)
   → /supplier/pre-orders → localiza o pré-pedido → "Aprovar"
   → assert status final "aprovado" na UI
```
**Dois contexts** (não logout/login na mesma página) → isolamento limpo de cookies, sem flakiness de troca de sessão.

### Componentes / pontos da UI envolvidos
- **Login:** form `input[name="email"]`/`input[name="password"]` + botão "Entrar" (padrão já usado nos specs).
- **Comparar:** [compare-client.tsx](src/app/client/compare/compare-client.tsx) — Radix `Select` de upload; botão "Comparar"; botão **"Confirmar pré-pedido"** (L755/795); `confirming` → "Enviando...".
- **Aprovar:** [pre-orders-client.tsx](src/app/supplier/pre-orders/pre-orders-client.tsx) — `onApprove`/"Aprovar" (L178) via DataTable → `POST /api/pre-order/bulk-action`.
- **Parecer (condicional):** [parecer-panel.tsx](src/components/compare/parecer-panel.tsx).

## Modelo de Dados
**Nenhuma alteração.** Usa seed demo existente. Sem migration/RLS.

## Contratos

### Helper de login
```typescript
// e2e/helpers/auth.ts
type DemoEmail =
  | "comprador@demo.com"
  | "representante@demo.com"
  | "admin@demo.com";

export async function loginAs(
  page: Page,
  email: DemoEmail,
  password = "demo1234",
): Promise<void>;
// preenche form, clica "Entrar", waitForURL do painel do papel
```

### Helper de Radix Select (opcional)
```typescript
// e2e/helpers/selectors.ts
export async function selectByText(
  page: Page,
  trigger: Locator,
  optionText: string | RegExp,
): Promise<void>;
// abre o trigger, clica a opção por role "option" + nome
```

## Decisões Técnicas

### Decisão 1: Cross-role — dois contexts vs logout sequencial
- **Contexto:** O fluxo cruza comprador e representante.
- **Opções:**
  - A: Logout + login na mesma page — Contras: flaky (limpeza de cookie/estado), lento.
  - B: `browser.newContext()` por papel no mesmo test — Prós: isolamento real, paralelizável internamente; Contras: 2 contexts p/ gerenciar.
- **Decisão:** **B**, dentro de `describe.serial`.
- **Consequências:** Test um pouco mais verboso, porém estável e legível.

### Decisão 2: Estabilidade de Radix Select *(RF-03)*
- **Contexto:** Radix Select abre portal/listbox; cliques diretos são flaky (memória [[backlog-deferred-items]]).
- **Opções:**
  - A: `getByRole("combobox")` + `getByRole("option", { name })` — Prós: sem mudar código; Contras: depende de roles corretos do Radix.
  - B: Adicionar `data-testid` no trigger e nas options — Prós: máxima estabilidade; Contras: toca o componente.
- **Decisão:** Tentar **A** primeiro; cair p/ **B** (adicionar `data-testid` mínimo) só se A for flaky. Documentar o que foi preciso.
- **Consequências:** Mudança no componente apenas se necessário, registrada na task.

### Decisão 3: Parecer/override — incluído condicional
- **Contexto:** Backlog cita "parecer → override"; `verify-cycle.cjs` não cobre. UI tem `ParecerPanel`.
- **Decisão:** Incluir registro de parecer **se** o painel estiver acessível no fluxo sem reescrever a UI; senão, registrar como gap residual no spec (comentário + atualizar [[backlog-deferred-items]]).
- **Consequências:** Não bloqueia o happy path principal (AC-01..03).

### Decisão 4: Determinismo — criar o próprio pré-pedido
- **Contexto:** Specs paralelos + seed compartilhado.
- **Decisão:** O spec cria seu próprio pré-pedido no fluxo (não assume um pré-existente); localiza-o por algo estável (ex.: ser o mais recente do representante, ou marcar via valor). `describe.serial` isola dos demais.
- **Consequências:** Tolera reexecução; não depende de ordem.

## Impacto em Features Existentes
- **16 specs existentes:** sem impacto — novo arquivo. `loginAs` pode ser adotado por eles depois (RF-02/AC-04 exige uso em ≥2 specs → migrar ≥1 existente + o novo).
- **compare-client / pre-orders-client:** sem mudança, salvo `data-testid` mínimo se Decisão 2 cair p/ B.
- **verify-cycle.cjs:** permanece (smoke de API).

## Constitution Check
- [x] Comportamento real testado (fluxo de negócio ponta-a-ponta).
- [x] Sem migration/RLS.
- [x] Anti-flaky: `waitForURL`/`expect` em vez de timeouts fixos.
- [x] Surgical: 1 spec + 1-2 helpers; componente só se inevitável.
