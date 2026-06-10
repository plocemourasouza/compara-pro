# Discovery: Economia na Tela do Cliente
**Feature:** economia-tela-cliente | **Data:** 2026-06-09 | **Status:** Draft

## Problema do Usuário
- **Quem sofre:** Comprador (CLIENT) na tela de sugestão de compra ([compare-client.tsx](src/app/client/compare/compare-client.tsx)).
- **O que acontece:** O cliente vê o melhor preço por item e o total (`bestPriceTotal`), mas **não vê quanto está economizando** vs. o preço-alvo que ele mesmo informou (`targetPrice`). A economia já é calculada e exibida no **dashboard admin** (`savings.finalizedSavings`), mas o cliente — quem decide a compra — não tem essa informação no momento da decisão.
- **Evidência:** Pedido explícito do usuário no Round 2 do dashboard admin: "a economia deve aparecer também na tela de sugestão de compra, no perfil do cliente". Adiado na época ("guarde para sessões à frente"). Ver [[economia-tela-sugestao-cliente]].
- **Frequência:** Toda comparação que o cliente roda (fluxo central do produto).

## Hipótese
Acreditamos que **exibir a economia por item e total na tela de comparação** vai **reforçar o valor da plataforma e aumentar a confiança na decisão de compra** para o **comprador** porque ele vê, no momento da escolha, o ganho concreto vs. o preço-alvo que definiu.

## Estado real do backend (verificado no código)
| Camada | Situação | Evidência |
|--------|----------|-----------|
| Schema | `targetPrice` existe no clientProduct; `baselinePrice` no PreOrderItem | schema.prisma L253 / L189 |
| Pré-pedido | Já snapshota `baselinePrice = clientProduct.targetPrice` | pre-order-service.ts L75, L204 |
| Dashboard admin | Já calcula `Σ max(0, baselinePrice − price) × qtd` | insights/route.ts (`savings.finalizedSavings`) |
| **API comparação** | **`/api/comparison/[id]` DESCARTA `targetPrice` ao formatar** ⚠️ | [id]/route.ts L58-68 (map de clientProduct não inclui targetPrice) |
| **UI compare-client** | **Não exibe economia** | compare-client.tsx (mostra bestPrice/bestPriceTotal, não economia) |

➡️ **"Backend pronto" é parcial:** o dado existe no DB, mas a rota que a tela consome não o expõe. Escopo real = expor 1 campo na API + cálculo/UI no cliente.

## Métricas de Sucesso
| Métrica | Baseline (atual) | Target | Como medir | Prazo |
|---------|------------------|--------|------------|-------|
| Economia visível por item na compare-client | 0 (não existe) | 100% dos itens com `targetPrice` não-null | Inspeção visual + Playwright | 1 sessão |
| Economia total visível no resumo | Não existe | Exibida quando ≥1 item tem economia | Inspeção visual | 1 sessão |
| Consistência com admin | — | Mesma fórmula `max(0, targetPrice − preço) × qtd` | Comparar com finalizedSavings | 1 sessão |

> POC sem usuários reais — métricas são de entrega/correção, não de adoção.

## Critério de Decisão
- **Sucesso:** economia por item + total exibida corretamente, fórmula idêntica à do admin, sem regressão no fluxo de comparação→pré-pedido.
- **Pivotar:** se a UI poluir a tela (densidade), simplificar para só o total.
- **Abandonar:** N/A (feature pequena, pedido firme do usuário).

## MVP Scope
- **Inclui:**
  - Expor `targetPrice` em `/api/comparison/[id]` (map do clientProduct).
  - Cálculo no cliente: economia item = `max(0, targetPrice − preço_escolhido) × qtd`, só quando `targetPrice` não-null e fornecedor escolhido.
  - Exibir economia por item (linha) + economia total no resumo, reusando `formatCurrency` ([format.ts](src/lib/format.ts)).
  - Estado vazio: item sem `targetPrice` → não mostra economia (sem "R$ 0,00" enganoso).
- **NÃO inclui:**
  - Persistir economia no perfil do cliente (histórico) — fase futura.
  - Mexer no fluxo de pré-pedido (já snapshota baselinePrice).
  - Gráficos/visualizações de economia no lado cliente.

## Prioridade
Impacto: Médio (2) × Confiança: Alta (3) / Esforço: Baixo (1)
**Score: (2 × 3) / 1 = 6** — alta prioridade relativa (quick win, pedido firme).

## Alternativas Consideradas
- **Não fazer nada:** cliente continua sem ver o valor que a plataforma gera no momento decisivo.
- **Só mostrar total (sem por-item):** descartado por ora — por-item é barato e mais informativo; pode virar fallback se densidade incomodar.
- **Calcular no backend e devolver pronto:** descartado p/ MVP — preço escolhido depende da seleção do usuário na UI (dinâmico); cálculo no cliente é mais simples. API só precisa expor `targetPrice`.
