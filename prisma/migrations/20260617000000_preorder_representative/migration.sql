-- Regra: todo pré-pedido tem 1 representante (agência) e 1 cliente.
-- O representante vem da carteira (supplier_clients): a agência que cadastrou
-- o cliente naquele fornecedor. Pré-pedido herda essa agência.
--
-- Estratégia staged (preserva dados existentes): add nulo -> backfill -> NOT NULL -> FK.
-- Em base nova as tabelas estão vazias, então os UPDATEs são no-op.

-- 1) Colunas nulas
ALTER TABLE "supplier_clients" ADD COLUMN "representativeCompanyId" TEXT;
ALTER TABLE "pre_orders" ADD COLUMN "representativeId" TEXT;

-- 2) Backfill carteira: agência mais antiga que representa o fornecedor
UPDATE "supplier_clients" sc
SET "representativeCompanyId" = sub.rep
FROM (
  SELECT DISTINCT ON (rs."supplierCompanyId")
         rs."supplierCompanyId" AS sup,
         rs."representativeCompanyId" AS rep
  FROM "representative_suppliers" rs
  ORDER BY rs."supplierCompanyId", rs."createdAt" ASC, rs."id" ASC
) sub
WHERE sc."supplierCompanyId" = sub.sup;

-- 3) Backfill pré-pedidos: agência da carteira (fornecedor, cliente);
--    fallback = agência mais antiga do fornecedor
UPDATE "pre_orders" po
SET "representativeId" = COALESCE(
  (SELECT sc."representativeCompanyId"
   FROM "supplier_clients" sc
   WHERE sc."supplierCompanyId" = po."supplierId"
     AND sc."clientCompanyId" = po."clientId"),
  (SELECT rs."representativeCompanyId"
   FROM "representative_suppliers" rs
   WHERE rs."supplierCompanyId" = po."supplierId"
   ORDER BY rs."createdAt" ASC, rs."id" ASC
   LIMIT 1)
);

-- 4) Obrigatórias
ALTER TABLE "supplier_clients" ALTER COLUMN "representativeCompanyId" SET NOT NULL;
ALTER TABLE "pre_orders" ALTER COLUMN "representativeId" SET NOT NULL;

-- 5) Índices
CREATE INDEX "supplier_clients_representativeCompanyId_idx" ON "supplier_clients"("representativeCompanyId");
CREATE INDEX "pre_orders_representativeId_idx" ON "pre_orders"("representativeId");

-- 6) Chaves estrangeiras -> companies(id)
ALTER TABLE "supplier_clients"
  ADD CONSTRAINT "supplier_clients_representativeCompanyId_fkey"
  FOREIGN KEY ("representativeCompanyId") REFERENCES "companies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pre_orders"
  ADD CONSTRAINT "pre_orders_representativeId_fkey"
  FOREIGN KEY ("representativeId") REFERENCES "companies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
