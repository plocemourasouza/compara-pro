# Design: Economia na Tela do Cliente
**Feature:** economia-tela-cliente | **Data:** 2026-06-10 | **Status:** Draft
**Referência:** [spec.md](./spec.md)

## Arquitetura

### Fluxo de Dados
```
DB (clientProduct.targetPrice)
  │  já incluído via include.matches.clientProduct
  ▼
GET /api/comparison/[id]  ── [MUDANÇA RF-01] adiciona targetPrice ao map do clientProduct
  │  JSON: matches[].clientProduct.targetPrice: number | null
  ▼
compare-client.tsx (Client Component)
  │  estado: comparison (Match[]) + selections (Record<id, Selection{supplierId, quantity, included}>)
  ▼
cálculo derivado (puro, client-side):
  economiaItem(match, selection) = max(0, targetPrice − precoEscolhido) × quantity
  economiaTotal = Σ economiaItem (apenas included && targetPrice != null)
  ▼
render: badge de economia por linha + card "Economia total" no resumo
```

Nenhuma chamada de rede nova. Cálculo reativo ao `selections` (mesma dependência que já recalcula `bestPriceTotal`/grupos).

### Componentes Envolvidos
- **`GET /api/comparison/[id]`** ([route.ts](src/app/api/comparison/[id]/route.ts)): adicionar `targetPrice` ao objeto `clientProduct` no `formattedComparison.matches.map`. **API Route justificada:** rota de leitura já existente e é a fonte de dados da tela — não é mutation, não cabe Server Action; mudança é aditiva (1 campo).
- **`compare-client.tsx`** (Client Component, já é `"use client"` — justificado por estado interativo de seleção): adicionar campo ao tipo `ClientProduct`, função de cálculo, e UI.
- **Helper de cálculo:** função pura `calcItemSavings` / `calcTotalSavings` — extraível p/ testar isolado (decisão 3).
- Sem Server Actions novas. Sem componentes novos.

## Modelo de Dados

### Alterações no Schema
**Nenhuma.** `clientProduct.targetPrice Float?` já existe (schema.prisma L253). `PreOrderItem.baselinePrice` (L189) já populado.

### Migrations necessárias
Nenhuma.

### Políticas RLS
N/A — projeto usa auth por JWT + filtro de ownership na query (`clientId = user.company.id`), não RLS Supabase. Sem mudança de superfície de acesso; `targetPrice` é dado do próprio tenant.

## Contratos

### API (mudança aditiva no response de GET /api/comparison/[id])
```typescript
// matches[].clientProduct — campo adicionado:
clientProduct: {
  id: string;
  sku: string | null;
  code: string | null;
  name: string;
  description: string | null;
  category: string | null;
  unit: string | null;
  targetPrice: number | null; // ← NOVO (RF-01)
}
```

### Tipos TypeScript (compare-client.tsx)
```typescript
interface ClientProduct {
  id: string;
  name: string;
  sku?: string;
  code?: string;
  targetPrice?: number | null; // ← NOVO
}
```

### Funções de cálculo (puras, testáveis)
```typescript
// economia de um item; null/≤0 → 0
function calcItemSavings(
  targetPrice: number | null | undefined,
  chosenPrice: number | null | undefined,
  quantity: number,
): number; // max(0, (targetPrice ?? 0 menos chosenPrice)) × qty, 0 quando targetPrice nullish

// soma sobre itens incluídos com fornecedor escolhido
function calcTotalSavings(matches, selections): number;
```
> Assinaturas conceituais — implementação no Phase 4. Mesma fórmula de `savings.finalizedSavings` (RF-04).

## Decisões Técnicas

### Decisão 1: Posição visual da economia *(resolve ambiguidade 1 da spec)*
- **Contexto:** Onde mostrar economia por item e total sem poluir a tela.
- **Opções:**
  - A: Coluna nova na tabela — Contras: aumenta densidade horizontal, quebra layout em telas estreitas.
  - B: Badge/linha discreta sob o preço escolhido (item) + card no bloco de resumo ao lado de `bestPriceTotal` (total) — Prós: baixa fricção, reusa estrutura existente; Contras: nenhum relevante.
- **Decisão:** **B.** Economia por item = texto/badge discreto (verde, com label textual "Economia" — não só cor, p/ a11y AC NF) próximo ao preço escolhido; economia total = card no resumo junto ao `bestPriceTotal`.
- **Consequências:** Mudança contida no JSX existente; sem novo componente; fácil esconder quando economia=0 (RF-03/AC-07).

### Decisão 2: Dedup do `formatCurrency` *(resolve ambiguidade 2 da spec)*
- **Contexto:** Cópia local em compare-client.tsx L112 + canônico em [format.ts](src/lib/format.ts).
- **Opções:**
  - A: Manter cópia local — Contras: drift, duplicação.
  - B: Importar de format.ts e remover a cópia local — Prós: fonte única; Contras: micro-mudança fora do escopo estrito.
- **Decisão:** **B**, oportunístico — já estamos editando o arquivo; remover a duplicata é 2 linhas e reduz drift. Skill global "remova o que suas mudanças orfanaram" favorece. Se a cópia local tiver divergência de comportamento, manter comportamento e só consolidar a assinatura.
- **Consequências:** 1 import + delete da função local; todos os usos no arquivo passam a usar o canônico.

### Decisão 3: Cálculo client-side vs backend *(confirma MVP do discovery)*
- **Contexto:** Economia depende do fornecedor escolhido, que é estado dinâmico da UI.
- **Decisão:** **Client-side**, função pura. Backend só expõe `targetPrice`. Evita round-trip a cada troca de seleção (AC-08).
- **Consequências:** Funções puras testáveis por unit (RED-GREEN); paridade com admin garantida por teste (AC-10).

## Impacto em Features Existentes
- **`/api/comparison/[id]`**: mudança aditiva, backward-compatible — consumidores existentes ignoram campo novo. Sem regressão.
- **Pré-pedido (create-batch)**: **sem impacto** — `baselinePrice` já snapshota `targetPrice`; não tocamos esse fluxo.
- **Dashboard admin (`savings.finalizedSavings`)**: **sem impacto** — só reusamos a fórmula como oráculo de teste.
- **Comparação legada `/api/compare`**: **sem impacto** — fora do caminho da tela.
- **Verificado sem impacto:** parecer/override/aprovação (fluxo fornecedor), seed, storage.

## Constitution Check
- Sem constitution.md → padrões globais (CLAUDE.md):
- [x] API Route justificada (leitura existente, não mutation) — exceção ao "Server Actions default" documentada acima.
- [x] Sem schema change → sem migration/RLS.
- [x] Surgical: 2 arquivos (API route + compare-client) + possível helper de cálculo.
- [x] TDD: lógica pura isolável → testável antes da UI.
- [x] Backward-compatible: nenhum campo removido.
