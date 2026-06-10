# Spec: E2E do Fluxo de Negócio (UI ponta-a-ponta)
**Feature:** e2e-business-flow | **Data:** 2026-06-10 | **Status:** Draft
**Tipo:** Técnico (testes) — discovery pulado (não toca usuário final).

## Contexto
Hoje o fluxo comprador→fornecedor é coberto **só no nível de API** por [scripts/verify-cycle.cjs](scripts/verify-cycle.cjs) (criar comparação → selecionar → create-batch → fornecedor vê → aprovar). O Playwright (16 specs) cobre auth + render de todas as telas + padrão de listas, **mas não o fluxo de negócio pela UI**. Falta um E2E que exercite o caminho real do usuário no browser, pegando regressões que a API não pega (estado de seleção, Radix selects, botões de confirmação, navegação cross-role). Ver [[backlog-deferred-items]].

## Requisitos Funcionais

### RF-01: E2E do caminho comprador→fornecedor pela UI
- **Descrição:** Um spec Playwright que dirige o fluxo completo no browser, em uma sessão, cruzando os dois papéis (comprador e representante/fornecedor).
- **Usuário:** Comprador (`comprador@demo.com`) + Representante (`representante@demo.com`), senha `demo1234` (seed demo, idempotente via global-setup).
- **Fluxo principal (happy path):**
  1. Comprador faz login → `/client/compare`.
  2. Seleciona um upload de requisitos (Radix Select) e dispara "Comparar".
  3. Resultados renderizam; ajusta seleção (fornecedor escolhido + quantidade) de ≥1 item.
  4. Confirma o pré-pedido (botão de criar pré-pedido / create-batch).
  5. Logout/troca de sessão → Representante faz login.
  6. Representante vê o pré-pedido na lista/tela de pré-pedidos.
  7. Aprova o pré-pedido.
  8. Estado final do pré-pedido = aprovado (visível na UI).
- **Fluxos alternativos:**
  - **Parecer + override** (se a UI expõe `ParecerPanel`): comprador/representante registra parecer antes de aprovar. **Incluído se viável**; senão, documentar como gap residual.
- **Erros e exceções:** Spec falha com mensagem clara em cada etapa (assert por etapa, não só no fim). Sem `pageerror` de runtime durante o fluxo.

### RF-02: Helper de login reutilizável
- **Descrição:** Extrair o padrão de login UI (hoje duplicado em vários specs) para um helper `e2e/helpers/auth.ts` reutilizável (`loginAs(page, email)`).
- **Usuário:** Suíte E2E.
- **Fluxo principal:** `loginAs(page, "comprador@demo.com")` preenche form, clica "Entrar", espera URL do painel.
- **Erros e exceções:** Timeout de login → erro explícito.

### RF-03: Seleção robusta de Radix Select
- **Descrição:** Interagir com os `Select` do Radix de forma estável (abrir por role/trigger, escolher opção por nome), evitando flakiness. Adicionar `data-testid` onde necessário (mudança mínima no componente).
- **Usuário:** Suíte E2E.
- **Erros e exceções:** Se opção não existe (seed vazio) → falha clara apontando seed.

## Requisitos Não-Funcionais
- **Determinismo:** Spec idempotente — roda repetidas vezes sem poluir estado a ponto de quebrar (cria seu próprio pré-pedido; não depende de ordem entre specs). Tolerar dados pré-existentes do seed.
- **Performance:** Fluxo completo < 60s local (1 worker p/ o cross-role evita corrida de sessão).
- **Isolamento:** Não derrubar os outros 16 specs (paralelos). Cross-role pode exigir contexts separados ou serial.
- **Manutenção:** Sem hard-coded de IDs; localizar por texto/role/testid.

## Acceptance Criteria
- [ ] **AC-01:** Dado o seed demo, quando o spec roda, então comprador loga, compara, ajusta seleção e confirma um pré-pedido pela UI sem `pageerror`.
- [ ] **AC-02:** Dado o pré-pedido criado, quando o representante loga, então ele o vê na tela de pré-pedidos.
- [ ] **AC-03:** Dado o pré-pedido visível, quando o representante aprova pela UI, então o status final exibido é "aprovado".
- [ ] **AC-04:** Dado o helper `loginAs`, quando usado em ≥2 specs, então ambos autenticam sem duplicar o bloco de login.
- [ ] **AC-05:** Dado um Radix Select de upload/fornecedor, quando o spec seleciona uma opção por nome, então a seleção reflete na UI de forma estável (sem retry manual).
- [ ] **AC-ERROR-01:** Dado um passo que falha (ex.: nenhum upload no seed), quando o spec roda, então a falha aponta a etapa exata.
- [ ] **AC-06 (condicional):** Se `ParecerPanel` está no fluxo, então o spec registra um parecer antes da aprovação e valida que persiste.

## Fora do Escopo
- Substituir `verify-cycle.cjs` (continua como smoke rápido de API).
- Testar todos os caminhos de erro de negócio (foco no happy path + 1 erro estrutural).
- Visual regression / screenshots.
- CI (rodar E2E no GitHub Actions) — bloqueado, ver [[ci-deferred-until-deploy]] / [[local-first-no-deploy]].

## Dependências
- Dev server local em `:3000` (Playwright `webServer` sobe via `npm run dev`).
- Seed demo idempotente (`e2e/global-setup.ts` → `seed-demo.cjs`); usuários comprador/representante/admin.
- DB Postgres `localhost:5435/price_comparison`.

## Constitution Check
- Sem `.specs/memory/constitution.md`. Padrões globais:
  - [ ] Teste verifica comportamento real (fluxo de negócio), não só "passa".
  - [ ] Surgical: novo spec + helper; `data-testid` só onde necessário.
  - [ ] Fail-visível: assert por etapa.
  - [ ] Sem flakiness mascarada (nada de `waitForTimeout` arbitrário; usar `waitForURL`/`expect`).
