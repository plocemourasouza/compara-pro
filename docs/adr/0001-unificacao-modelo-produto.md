# ADR 0001 — Unificação do modelo de produto (catálogo ↔ matching)

- **Status:** Proposta (aguardando aprovação antes da migração)
- **Data:** 2026-06
- **Contexto da feature:** F6 do plano de pendências

## Contexto

Hoje existem **dois conceitos paralelos de produto**, sem sincronização:

| Tabela | Origem | Quem usa | Estado |
|---|---|---|---|
| `products` (catálogo) | CRUD manual (telas admin/fornecedor) | telas de produtos, dashboard | 0 linhas hoje |
| `uploaded_products` | parsing de planilhas (`FileProcessor`) | **todo o matching**, `SupplierMatch`, `PreOrderItem` | fonte de verdade atual |

O **matching lê só `uploaded_products`** (do upload ativo do fornecedor). O catálogo `products` não
alimenta nada do fluxo de comparação — é um cadastro paralelo. Campos quase idênticos
(`sku, code, name, price, description, category, unit`). Decisão do usuário: **integrar o catálogo ao
matching** (unificar o conceito).

## Decisão

Adotar o **catálogo (`products`) como fonte única**, alimentado pelos uploads:

1. **Upload → upsert no catálogo.** Ao processar uma planilha de fornecedor, o `FileProcessor`
   **upserta** cada linha em `products` por chave `(companyId, sku)` (fallback `(companyId, code)` ou
   `(companyId, name)` quando não há sku). Atualiza preço/quantidade; cria o que é novo.
2. **Conceito de "ativo" no catálogo.** Acrescentar `isActive`/`lastUploadId` por produto (ou marcar
   itens fora do último upload como inativos), preservando o comportamento de "lista vigente" que hoje
   vive em `UploadHistory.isActive`.
3. **Matching lê `products`.** O motor (`OptimizedProductMatcher`) passa a cruzar as necessidades do
   comprador contra os `products` ativos dos fornecedores, no lugar de `uploaded_products`.
4. **Relacionamentos.** `SupplierMatch.supplierProductId` e `PreOrderItem.productId` passam a referenciar
   `products`. (`PreOrderItem` hoje aponta para `uploaded_products` — ver ADR implícita do fix anterior.)
5. **`uploaded_products` vira histórico/staging.** Mantida apenas como registro bruto do upload
   (auditoria), sem ser lida pelo matching.

## Alternativas consideradas

- **B — Upload-centric (deprecar `products`):** manter o matching em `uploaded_products` e tornar as
  telas de catálogo apenas uma visão do upload ativo. Menos esforço, mas perde a edição manual do
  catálogo e contraria a escolha do usuário ("catálogo alimenta o matching"). **Rejeitada.**
- **C — Manter separado + documentar:** zero código, mas mantém a confusão de dois conceitos.
  **Rejeitada** (já era o estado atual).

## Plano de migração (faseado, reversível)

1. **Schema:** adicionar a `products` os campos que faltam (`quantity`, `isActive`/`lastUploadId`) e os
   índices `(companyId, sku)` / `(companyId, code)`. `prisma migrate` (não `db push`) para versionar.
2. **Backfill:** copiar os `uploaded_products` dos uploads **ativos** para `products` (upsert).
3. **FileProcessor:** passar a upsertar em `products` a cada upload (mantendo a escrita em
   `uploaded_products` como staging por um período).
4. **Matching:** repontar `OptimizedProductMatcher` para ler `products` ativos; ajustar
   `SupplierMatch`/`PreOrderItem` conforme os relacionamentos novos.
5. **Telas:** `admin/products` e `supplier/products` passam a refletir a fonte unificada.
6. **Verificação:** `scripts/verify-cycle.cjs` deve manter o resultado (3 matches, totais, ciclo →
   FINALIZED) sobre o novo modelo; testes de regressão.
7. **Limpeza (depois de estável):** remover leituras de `uploaded_products` no matching.

## Riscos

- **Dados de produção:** comparações e pré-pedidos existentes referenciam `uploaded_products`. A
  migração precisa preservar/portar essas referências (ou aceitar que o histórico antigo aponta para o
  staging). Mitigar com backfill + janela de compatibilidade.
- **Chave de upsert:** produtos sem `sku` exigem fallback (`code`/`name`) — risco de duplicar ou
  colidir. Definir a precedência da chave com cuidado.
- **"Lista vigente":** replicar corretamente a semântica de `UploadHistory.isActive` no catálogo para
  não comparar contra preços velhos.

## Rollback

Migração versionada (`prisma migrate`) → `migrate resolve`/revert. Enquanto o matching ainda puder ler
`uploaded_products`, a volta é trocar o ponto de leitura de volta.

## Pendências de decisão (para aprovação)

- [ ] Confirmar a **chave de upsert** (sku → code → name?).
- [ ] Confirmar como portar **comparações/pré-pedidos existentes** (backfill vs. histórico congelado).
- [ ] Confirmar onde mora o "ativo": flag em `products` vs. derivar do último upload.
