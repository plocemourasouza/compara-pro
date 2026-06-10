# Design: F6 — Parar Staging do Lado Fornecedor
**Feature:** f6-supplier-staging-cleanup | **Data:** 2026-06-10 | **Status:** Draft
**Referência:** [spec.md](./spec.md)

## Arquitetura

### Sequência segura (ordem obrigatória)
```
1. RF-01  migrar searchProducts        → lê prisma.product
2. RF-02  migrar match manual          → resolve id de prisma.product
   ── (catálogo agora é o ÚNICO leitor supplier) ──
3. RF-03  parar write staging supplier → uploadedProduct.create só p/ client
4. verificar (verify:cycle + E2E + units)
```
Inverter a ordem (parar write antes de migrar) **quebra** autocomplete + match manual. Cada passo é commit-able e verificável isolado.

### Pontos de mudança
| Arquivo | Mudança |
|---------|---------|
| [optimized-product-matcher.ts](src/lib/services/optimized-product-matcher.ts) L930-962 | `where` + `findMany` de `uploadedProduct` → `prisma.product` (campos equivalentes); ajustar `map` de retorno |
| [matching.ts](src/lib/actions/matching.ts) L28-33 | `prisma.uploadedProduct.findUnique` → `prisma.product.findUnique`; validar `company.type === "SUPPLIER"` via relação do catálogo |
| [file-processor.ts](src/lib/services/file-processor.ts) L238 | envolver `uploadedProduct.create` em guard `if (uploadType !== "SUPPLIER_PRODUCTS")` |

## Modelo de Dados
**Sem alteração de schema.** `UploadedProduct` permanece (usado por client requirements + demanda). `products` (catálogo) já tem os campos necessários (name/sku/code/price/quantity/company). Sem migration/RLS.

## Contratos
Ambos os contratos públicos **inalterados** — só a fonte interna muda:
```typescript
// optimized-product-matcher.ts — assinatura mantida
static async searchProducts(query: string, supplierId?: string, limit?: number): Promise<SupplierProductResult[]>

// matching.ts — assinatura mantida
createManualMatchAction(comparisonId, supplierProductId, ...): Promise<Result>
//   supplierProductId passa a ser um products.id (catálogo) em vez de uploadedProduct.id
```
> ⚠️ Semântica de `supplierProductId`: hoje é id de `UploadedProduct`; passa a ser id de `products`. Verificar o **chamador** (UI de match manual) — a opção que ela oferece precisa usar o id do catálogo. Confirmar na implementação (impacto cross-camada).

## Decisões Técnicas

### Decisão 1: Guard do write vs branch separado
- **Contexto:** parar staging só p/ supplier.
- **Opções:** A) `if (uploadType !== "SUPPLIER_PRODUCTS") create(...)`; B) mover create p/ dentro do `else` do bloco de validação (client).
- **Decisão:** **A** — guard explícito junto ao `create`, mínimo diff, intenção clara.
- **Consequências:** 1 linha de guard; client intocado.

### Decisão 2: Dados supplier legados em UploadedProduct
- **Contexto:** registros antigos de staging supplier ficam órfãos após RF-03.
- **Opções:** A) deixar inertes (ninguém lê após migração); B) script de limpeza `delete where uploadType=SUPPLIER_PRODUCTS`.
- **Decisão:** **A** p/ o MVP (não-bloqueador, sem risco — ninguém lê). B só se houver pressão de tamanho de tabela; tratar à parte.
- **Consequências:** tabela mantém histórico supplier inerte; documentar em [[backlog-deferred-items]].

### Decisão 3: `searchProducts` — paridade de filtros
- **Contexto:** staging filtrava `upload.status=COMPLETED`, `isActive`, `price>0`. Catálogo usa `isActive`, `deletedAt=null`, `price>0`.
- **Decisão:** replicar o filtro do `getCarteiraSupplierProducts` (já validado como fonte) p/ consistência. `companyId` quando `supplierId` informado.
- **Consequências:** resultados consistentes com o matching principal (uma fonte, um filtro).

## Impacto em Features Existentes
- **Matching principal (comparação):** sem impacto — já usa catálogo.
- **Autocomplete/busca + match manual:** mudam de fonte; comportamento equivalente (mesma origem do matching).
- **Cliente (requirements/targetPrice/pré-pedido/economia):** **sem impacto** — caminho client intocado (RF-04).
- **Chamador do match manual (UI):** verificar que passa id de catálogo (Decisão/Contrato acima).

## Constitution Check
- [x] Ordem segura documentada (leitores antes do write).
- [x] Sem migration/RLS.
- [x] Surgical: 3 arquivos + verificação do chamador de match manual.
- [x] TDD viável: `searchProducts` e guard testáveis; `verify:cycle` como anti-regressão.
