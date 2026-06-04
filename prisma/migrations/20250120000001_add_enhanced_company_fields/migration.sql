-- Migration: Add Enhanced Company Fields
-- Description: Adiciona campos detalhados para empresas incluindo CNPJ, dados do responsável e endereço

-- 1. Create new enum for tax regimes
CREATE TYPE "public"."TaxRegime" AS ENUM ('MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- 2. Add new columns to companies table
ALTER TABLE "public"."companies" ADD COLUMN "legalName" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "cnpj" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "taxRegime" "public"."TaxRegime";
ALTER TABLE "public"."companies" ADD COLUMN "email" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "phone" TEXT;

-- Responsible person data
ALTER TABLE "public"."companies" ADD COLUMN "responsibleName" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "responsibleEmail" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "responsiblePhone" TEXT;

-- Address data
ALTER TABLE "public"."companies" ADD COLUMN "addressType" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "street" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "number" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "city" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "state" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "zipCode" TEXT;
ALTER TABLE "public"."companies" ADD COLUMN "addressReference" TEXT;

-- 3. Add unique constraint for CNPJ
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "companies_cnpj_key" ON "public"."companies"("cnpj") WHERE "cnpj" IS NOT NULL;

-- 4. Add indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_cnpj" ON "public"."companies"("cnpj") WHERE "cnpj" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_legal_name" ON "public"."companies"("legalName") WHERE "legalName" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_city" ON "public"."companies"("city") WHERE "city" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_state" ON "public"."companies"("state") WHERE "state" IS NOT NULL;

-- 5. Update statistics for better query planning
ALTER TABLE "public"."companies" ALTER COLUMN "cnpj" SET STATISTICS 1000;
ALTER TABLE "public"."companies" ALTER COLUMN "legalName" SET STATISTICS 1000;
