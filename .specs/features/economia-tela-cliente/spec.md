# Spec: Economia na Tela do Cliente
**Feature:** economia-tela-cliente | **Data:** 2026-06-10 | **Status:** Draft
**Referência:** [discovery.md](./discovery.md)

## Contexto
O comprador (CLIENT) decide a compra na tela de comparação ([compare-client.tsx](src/app/client/compare/compare-client.tsx)) mas não vê quanto economiza vs. o preço-alvo (`targetPrice`) que ele mesmo informou. O dado existe no DB e o admin já o usa, mas a rota `/api/comparison/[id]` descarta `targetPrice` ao formatar a resposta. Esta feature expõe o campo e exibe economia por item + total no lado cliente.

## Requisitos Funcionais

### RF-01: Expor `targetPrice` na API de comparação
- **Descrição:** O endpoint `GET /api/comparison/[id]` deve incluir `targetPrice` (number | null) no objeto `clientProduct` de cada match.
- **Usuário:** Sistema (consumido pela compare-client).
- **Fluxo principal:** Cliente abre comparação → API retorna cada match com `clientProduct.targetPrice` populado a partir da relação já incluída (`include.matches.clientProduct`).
- **Fluxos alternativos:** Produto sem preço-alvo → `targetPrice: null`.
- **Erros e exceções:** Sem mudança no contrato de erro existente (auth, 404, 400, 500 permanecem). Campo apenas adicionado, nenhum removido (backward-compatible).

### RF-02: Calcular economia por item
- **Descrição:** Para cada item incluído na seleção, calcular economia = `max(0, targetPrice − precoEscolhido) × quantidade`.
- **Usuário:** Comprador (cálculo client-side reativo à seleção).
- **Fluxo principal:** Item tem `targetPrice` não-null + fornecedor escolhido (`Selection.supplierId`) + quantidade → economia exibida na linha.
- **Fluxos alternativos:**
  - `targetPrice` null → item não exibe economia (nenhum "R$ 0,00").
  - `precoEscolhido ≥ targetPrice` → economia = 0 → não exibe valor de economia (ou exibe neutro, sem número negativo).
  - Item não incluído na seleção → não entra no cálculo.
- **Erros e exceções:** Nenhum estado de erro — cálculo puro derivado do estado já carregado.

### RF-03: Exibir economia total
- **Descrição:** Somatório das economias de todos os itens incluídos, exibido no resumo da comparação (junto/próximo ao `bestPriceTotal`).
- **Usuário:** Comprador.
- **Fluxo principal:** ≥1 item com economia > 0 → total exibido com `formatCurrency`.
- **Fluxos alternativos:** Nenhum item com economia → total = 0 → bloco de economia oculto (não exibe "Economia: R$ 0,00").
- **Erros e exceções:** Nenhum.

### RF-04: Consistência de fórmula com o admin
- **Descrição:** A fórmula da economia client-side deve ser idêntica à do dashboard admin: `Σ max(0, base − preço) × qtd`, onde base = `targetPrice` (cliente) / `baselinePrice` (snapshot no pré-pedido).
- **Usuário:** Sistema (garantia de consistência).
- **Fluxo principal:** Mesma expressão usada em [insights/route.ts](src/app/api/admin/dashboard/insights/route.ts) (`savings.finalizedSavings`).
- **Erros e exceções:** N/A.

## Requisitos Não-Funcionais
- **Performance:** Cálculo client-side O(n) sobre matches já em memória; sem novas chamadas de rede. Reatividade imperceptível (< 16ms p/ listas típicas de POC).
- **Segurança:** Sem mudança de superfície. Rota já exige `requireAuth(["CLIENT"])` e filtra por `clientId = user.company.id` (ownership preservado). `targetPrice` é dado do próprio cliente — sem vazamento cross-tenant.
- **Acessibilidade:** Economia exibida como texto legível (não só cor); contraste WCAG AA; valor anunciável por leitor de tela (não depender só de ícone/cor verde).
- **Disponibilidade:** Sem impacto — feature aditiva, degradação graciosa (sem targetPrice → tela funciona como hoje).

## Acceptance Criteria

- [ ] **AC-01:** Dado um match cujo `clientProduct` tem `targetPrice` no DB, quando `GET /api/comparison/[id]` responde, então o JSON inclui `clientProduct.targetPrice` com o valor numérico.
- [ ] **AC-02:** Dado um match cujo `clientProduct.targetPrice` é null, quando a API responde, então `clientProduct.targetPrice` é `null` (não ausente, não 0).
- [ ] **AC-03:** Dado um item incluído com `targetPrice=10`, preço escolhido `8` e quantidade `3`, quando a tela renderiza, então exibe economia do item = `R$ 6,00` (`(10−8)×3`).
- [ ] **AC-04:** Dado um item com `targetPrice` null, quando a tela renderiza, então o item NÃO exibe nenhum valor de economia.
- [ ] **AC-05:** Dado um item com preço escolhido ≥ `targetPrice`, quando a tela renderiza, então a economia do item é `0` e nenhum valor negativo é exibido.
- [ ] **AC-06:** Dados 2 itens incluídos com economias `R$ 6,00` e `R$ 4,00`, quando a tela renderiza, então a economia total exibida é `R$ 10,00`.
- [ ] **AC-07:** Dado que nenhum item incluído tem economia > 0, quando a tela renderiza, então o bloco de economia total fica oculto.
- [ ] **AC-08:** Dado que o usuário muda o fornecedor escolhido de um item, quando a seleção muda, então a economia do item e o total recalculam reativamente.
- [ ] **AC-09:** Dado que um item é desmarcado (não incluído), quando a seleção muda, então sua economia sai do total.
- [ ] **AC-10:** Dada a mesma comparação finalizada como pré-pedido, quando comparo a economia da tela com `savings.finalizedSavings` do admin, então os valores são iguais (mesma fórmula).

## Fora do Escopo
- Persistir/mostrar economia no histórico do perfil do cliente (fase futura).
- Gráficos ou visualizações de economia no lado cliente.
- Alterar o cálculo ou snapshot de `baselinePrice` no pré-pedido (já implementado).
- Economia na tela de comparação legada `/api/compare` (a tela usa `/api/comparison/[id]`).
- Mudança no fluxo comprador→fornecedor (parecer, override, aprovação).

## Dependências
- `clientProduct.targetPrice` presente no schema (✅ existe, schema.prisma L253).
- Relação `matches.clientProduct` já incluída em `/api/comparison/[id]` (✅ L28-41).
- `Selection.quantity` e seleção de fornecedor no estado da compare-client (✅ L95-99).

## Constitution Check
- Sem `.specs/memory/constitution.md` no projeto — check formal não aplicável.
- Padrões globais aplicáveis (CLAUDE.md/SKILLS.md):
  - [ ] TDD: AC-01..10 mapeiam para testes (unit no cálculo + API; Playwright no render).
  - [ ] TypeScript strict: adicionar `targetPrice?: number | null` ao tipo `ClientProduct`; sem `any`.
  - [ ] Sem regressão: rodar suíte completa + `verify-cycle.cjs` após mudança.
  - [ ] Surgical: tocar só API formatter + compare-client; não "melhorar" código vizinho.
  - [ ] Fail visível: item sem targetPrice degrada explícito (oculta), nunca mostra 0 enganoso.

## Ambiguidades não-resolvidas (decidir no design)
1. **Posição visual** da economia por item (badge na linha? coluna? abaixo do preço) e do total (card no resumo? ao lado do bestPriceTotal?). → `frontend-engineer` + skill de UI no design.
2. **Dedup do `formatCurrency`**: existe cópia local em compare-client.tsx L112 + canônico em [format.ts](src/lib/format.ts). Design decide se consolida (fora do escopo estrito, mas barato).
