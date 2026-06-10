# Spec: F6 — Parar Staging do Lado Fornecedor
**Feature:** f6-supplier-staging-cleanup | **Data:** 2026-06-10 | **Status:** Draft
**Tipo:** Técnico (refactor/limpeza de dados) — discovery pulado.

## Contexto
`FileProcessor` grava **toda** linha de upload em `UploadedProduct` (staging) e, **só** para `SUPPLIER_PRODUCTS`, também faz upsert no catálogo `products` ([file-processor.ts L238, L247](src/lib/services/file-processor.ts)). O catálogo `products` já é a **fonte única** do matching principal (`getCarteiraSupplierProducts` lê `prisma.product`, [optimized-product-matcher.ts L283](src/lib/services/optimized-product-matcher.ts)). Logo, o staging supplier é redundante — exceto por **2 leitores secundários** que ainda dependem dele. Objetivo: migrar esses 2 leitores p/ o catálogo e **parar de gravar o staging supplier**, sem tocar o staging **client** (que guarda `targetPrice`/`quantity`, fonte da economia e do pré-pedido). Ver [[backlog-deferred-items]].

## Precondição (verificada) — bloqueadores reais
`UploadedProduct` (supplier-side) ainda é lido por:
| Leitor | Local | Uso |
|--------|-------|-----|
| `searchProducts` | [optimized-product-matcher.ts L930-962](src/lib/services/optimized-product-matcher.ts) | autocomplete/busca filtrando `uploadType: SUPPLIER_PRODUCTS` |
| `createManualMatch*` | [matching.ts L28-33](src/lib/actions/matching.ts) | resolve `supplierProductId` como id de `UploadedProduct` (type SUPPLIER) |

➡️ **Parar o write antes de migrar esses 2 quebra autocomplete + match manual.** A ordem importa: migrar leitores → depois parar write.

### 🐛 Bug latente descoberto (eleva a prioridade do F6)
`SupplierMatch.supplierProductId` é **FK → `Product`** (schema L307-308, `@relation("SupplierProduct", references: [id])` em `Product`). 
- **Fluxo principal** grava `supplierMatch.product.id` = **`Product.id`** ([optimized-product-matcher.ts L632](src/lib/services/optimized-product-matcher.ts), fonte `getCarteiraSupplierProducts` → `prisma.product`) ✅ consistente com a FK.
- **Match manual** ([matching.ts L69/82/102](src/lib/actions/matching.ts)) grava `supplierProductId` = **`UploadedProduct.id`** (fonte `searchProducts` → `uploadedProduct`). ❌ **id de UploadedProduct num campo FK→Product.**
- Consequência: match manual ou **viola a FK no insert** (falha em prod com FK enforced) ou nunca foi exercido sob a constraint. Migrar `searchProducts`+match manual p/ `products` (RF-01/RF-02) **corrige o bug** além de habilitar o RF-03.
- **Verificação exige exercitar o match manual com DB** (a FK só dispara no insert real); `verify:cycle` hoje cobre auto-match, **não** o manual — ampliar a verificação.

## Requisitos Funcionais

### RF-01: Migrar `searchProducts` p/ o catálogo `products`
- **Descrição:** A busca de produtos de fornecedor passa a ler `prisma.product` (catálogo) em vez de `uploadedProduct` filtrado por `SUPPLIER_PRODUCTS`.
- **Fluxo principal:** mesma assinatura/retorno público; troca a query interna para `products` (campos equivalentes: name/sku/code/price/company).
- **Erros e exceções:** retorno vazio quando catálogo não tem match (igual hoje); sem quebra de contrato do método.

### RF-02: Migrar match manual p/ o catálogo `products`
- **Descrição:** `createManualMatch*` resolve o `supplierProductId` como id de `products` (catálogo), não de `UploadedProduct`.
- **Fluxo principal:** valida que o produto é de empresa `SUPPLIER` via `products.company.type`.
- **Erros e exceções:** id inexistente/não-supplier → erro de validação claro (igual semântica atual).

### RF-03: Parar de gravar staging supplier
- **Descrição:** `FileProcessor` grava `UploadedProduct` **somente** para uploads que **não** são `SUPPLIER_PRODUCTS` (i.e., client requirements continuam gravando).
- **Fluxo principal:** linha supplier → só `upsertCatalogProduct` (catálogo); linha client → `uploadedProduct.create` (mantido).
- **Erros e exceções:** falha de upsert de catálogo continua reportada por linha (igual hoje).

### RF-04: Preservar 100% o lado cliente
- **Descrição:** Upload de `CLIENT_REQUIREMENTS` continua escrevendo `UploadedProduct` com `targetPrice`/`quantity` — fonte da feature economia e do pré-pedido.
- **Erros e exceções:** N/A — nenhuma mudança no caminho client.

## Requisitos Não-Funcionais
- **Segurança:** sem mudança de auth/ownership; queries de catálogo já filtram `companyId`/`type`.
- **Performance:** ler `products` (indexado, fonte única) ≥ tão rápido quanto staging; menos escrita por upload supplier (remove N inserts de staging).
- **Compatibilidade:** contratos públicos de `searchProducts` e match manual inalterados.
- **Dados legados:** registros `UploadedProduct` supplier antigos podem permanecer (inertes) ou ser limpos — decidir no design (cleanup opcional, não-bloqueador).

## Acceptance Criteria
- [ ] **AC-01:** Dado um catálogo com produtos de fornecedor, quando `searchProducts(query)` roda, então retorna resultados do `products` (não de `UploadedProduct`), com o mesmo shape público.
- [ ] **AC-02:** Dado um produto de fornecedor no catálogo, quando o match manual usa seu id, então o match é criado e validado como SUPPLIER.
- [ ] **AC-03:** Dado um upload `SUPPLIER_PRODUCTS`, quando processado, então **nenhuma** linha nova é criada em `UploadedProduct` e o catálogo `products` é atualizado.
- [ ] **AC-04:** Dado um upload `CLIENT_REQUIREMENTS`, quando processado, então `UploadedProduct` é criado com `targetPrice`/`quantity` (inalterado).
- [ ] **AC-05:** Dado o fluxo comprador→fornecedor, quando rodo `verify:cycle` + E2E, então não há regressão (comparar/match/pré-pedido/aprovar intactos).
- [ ] **AC-ERROR-01:** Dado um id de produto inexistente no match manual, quando chamado, então retorna erro claro (sem 500 silencioso).
- [ ] **AC-07 (fix FK):** Dado um match manual de um produto de fornecedor do catálogo, quando criado, então `SupplierMatch.supplierProductId` recebe um **`Product.id`** válido (FK satisfeita) — exercitado contra DB real.

## Fora do Escopo
- Remover o model `UploadedProduct` do schema (ainda usado pelo client + demanda).
- Migração/backfill de dados supplier legados (cleanup é opcional, tratar à parte se decidido).
- Mudar o algoritmo de matching.
- Lado cliente (intocado).

## Dependências
- Catálogo `products` como fonte única do supplier (✅ já é p/ matching principal).
- Testes: `verify:cycle` + `searchProducts`/match manual cobertos por unit/integration.

## Constitution Check
- Sem constitution.md. Padrões globais:
  - [ ] TDD: testes p/ `searchProducts` (catálogo) + guard do write antes de mudar.
  - [ ] Ordem segura: migrar leitores → só então parar write (senão quebra).
  - [ ] Fail-visível: erros de match/upsert por linha preservados.
  - [ ] Surgical: 3 arquivos (file-processor, optimized-product-matcher, matching).
