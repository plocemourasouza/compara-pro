-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Required for trigram fuzzy matching (gin_trgm_ops indexes added later in this migration)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "LinkRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'REPRESENTATIVE', 'CLIENT');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('SUPPLIER', 'CLIENT');

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- CreateEnum
CREATE TYPE "PreOrderStatus" AS ENUM ('ACTIVE', 'FINALIZED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('SUPPLIER_PRODUCTS', 'CLIENT_REQUIREMENTS');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PriceChange" AS ENUM ('UP', 'DOWN', 'SAME', 'FIRST_UPLOAD');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('SKU', 'CODE', 'NAME', 'MANUAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRE_ORDER_CREATED', 'PRE_ORDER_APPROVED', 'PRE_ORDER_REJECTED', 'UPLOAD_COMPLETED', 'UPLOAD_FAILED', 'PRICE_ALERT', 'MATCH_CREATED', 'COMPARISON_COMPLETED', 'SYSTEM_UPDATE');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('ANTHROPIC', 'OPENAI');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL,
    "companyId" TEXT,
    "preferences" JSONB,
    "activationCodeHash" TEXT,
    "activationExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "cnpj" TEXT,
    "type" "CompanyType" NOT NULL,
    "taxRegime" "TaxRegime",
    "email" TEXT,
    "phone" TEXT,
    "responsibleName" TEXT,
    "responsibleEmail" TEXT,
    "responsiblePhone" TEXT,
    "addressType" TEXT,
    "street" TEXT,
    "number" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "addressReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "representative_suppliers" (
    "id" TEXT NOT NULL,
    "representativeId" TEXT NOT NULL,
    "supplierCompanyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "representative_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_clients" (
    "id" TEXT NOT NULL,
    "supplierCompanyId" TEXT NOT NULL,
    "clientCompanyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_link_requests" (
    "id" TEXT NOT NULL,
    "supplierCompanyId" TEXT NOT NULL,
    "clientCompanyId" TEXT NOT NULL,
    "status" "LinkRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "supplier_link_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT,
    "quantity" INTEGER,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUploadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_orders" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT,
    "clientId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "PreOrderStatus" NOT NULL,
    "totalAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pre_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_order_items" (
    "id" TEXT NOT NULL,
    "preOrderId" TEXT NOT NULL,
    "matchId" TEXT,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "baselinePrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pre_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_history" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "processedRows" INTEGER NOT NULL,
    "errorRows" INTEGER NOT NULL,
    "uploadType" "UploadType" NOT NULL,
    "status" "UploadStatus" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "priceChangeIndicator" "PriceChange",
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "upload_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_products" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "originalRow" INTEGER NOT NULL,
    "sku" TEXT,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "targetPrice" DOUBLE PRECISION,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT,
    "quantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparisons" (
    "id" TEXT NOT NULL,
    "clientUploadId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "totalProducts" INTEGER NOT NULL,
    "matchedProducts" INTEGER NOT NULL,
    "unmatchedProducts" INTEGER NOT NULL,
    "bestPriceTotal" DOUBLE PRECISION,
    "previousTotal" DOUBLE PRECISION,
    "priceChangeIndicator" "PriceChange",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_matches" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "clientProductId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "bestPrice" DOUBLE PRECISION,
    "bestSupplierId" TEXT,
    "matchType" "MatchType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparison_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_matches" (
    "id" TEXT NOT NULL,
    "comparisonMatchId" TEXT NOT NULL,
    "supplierProductId" TEXT NOT NULL,
    "supplierCompanyId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "provider" "AiProvider" NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE INDEX "representative_suppliers_representativeId_idx" ON "representative_suppliers"("representativeId");

-- CreateIndex
CREATE INDEX "representative_suppliers_supplierCompanyId_idx" ON "representative_suppliers"("supplierCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "representative_suppliers_representativeId_supplierCompanyId_key" ON "representative_suppliers"("representativeId", "supplierCompanyId");

-- CreateIndex
CREATE INDEX "supplier_clients_supplierCompanyId_idx" ON "supplier_clients"("supplierCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_clients_supplierCompanyId_clientCompanyId_key" ON "supplier_clients"("supplierCompanyId", "clientCompanyId");

-- CreateIndex
CREATE INDEX "supplier_link_requests_supplierCompanyId_status_idx" ON "supplier_link_requests"("supplierCompanyId", "status");

-- CreateIndex
CREATE INDEX "supplier_link_requests_clientCompanyId_status_idx" ON "supplier_link_requests"("clientCompanyId", "status");

-- CreateIndex
CREATE INDEX "products_companyId_code_idx" ON "products"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "products_companyId_sku_key" ON "products"("companyId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_matches_comparisonMatchId_supplierCompanyId_key" ON "supplier_matches"("comparisonMatchId", "supplierCompanyId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "representative_suppliers" ADD CONSTRAINT "representative_suppliers_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "representative_suppliers" ADD CONSTRAINT "representative_suppliers_supplierCompanyId_fkey" FOREIGN KEY ("supplierCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_clients" ADD CONSTRAINT "supplier_clients_supplierCompanyId_fkey" FOREIGN KEY ("supplierCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_clients" ADD CONSTRAINT "supplier_clients_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_link_requests" ADD CONSTRAINT "supplier_link_requests_supplierCompanyId_fkey" FOREIGN KEY ("supplierCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_link_requests" ADD CONSTRAINT "supplier_link_requests_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "comparisons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_order_items" ADD CONSTRAINT "pre_order_items_preOrderId_fkey" FOREIGN KEY ("preOrderId") REFERENCES "pre_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_order_items" ADD CONSTRAINT "pre_order_items_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "comparison_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_order_items" ADD CONSTRAINT "pre_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_history" ADD CONSTRAINT "upload_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_products" ADD CONSTRAINT "uploaded_products_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "upload_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_clientUploadId_fkey" FOREIGN KEY ("clientUploadId") REFERENCES "upload_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_matches" ADD CONSTRAINT "comparison_matches_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "comparisons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_matches" ADD CONSTRAINT "comparison_matches_clientProductId_fkey" FOREIGN KEY ("clientProductId") REFERENCES "uploaded_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_matches" ADD CONSTRAINT "supplier_matches_comparisonMatchId_fkey" FOREIGN KEY ("comparisonMatchId") REFERENCES "comparison_matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_matches" ADD CONSTRAINT "supplier_matches_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_matches" ADD CONSTRAINT "supplier_matches_supplierCompanyId_fkey" FOREIGN KEY ("supplierCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- ===== Performance indexes + pg_trgm (squashed from 20250816000001; CONCURRENTLY removed: migrations run in a txn) =====
-- Migration: Add Performance Indexes
-- Description: Adiciona índices estratégicos para otimização de performance

-- 1. Users table indexes
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_company_id" ON "users" ("companyId");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");
CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users" ("createdAt");
CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users" ("deletedAt") WHERE "deletedAt" IS NULL;

-- 2. Companies table indexes
CREATE INDEX IF NOT EXISTS "idx_companies_type" ON "companies" ("type");
CREATE INDEX IF NOT EXISTS "idx_companies_name" ON "companies" ("name");
CREATE INDEX IF NOT EXISTS "idx_companies_created_at" ON "companies" ("createdAt");
CREATE INDEX IF NOT EXISTS "idx_companies_deleted_at" ON "companies" ("deletedAt") WHERE "deletedAt" IS NULL;

-- 3. Products table indexes (critical for matching)
CREATE INDEX IF NOT EXISTS "idx_products_company_id" ON "products" ("companyId");
CREATE INDEX IF NOT EXISTS "idx_products_sku" ON "products" ("sku") WHERE "sku" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_products_code" ON "products" ("code") WHERE "code" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_products_name_trigram" ON "products" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" ("category") WHERE "category" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_products_price" ON "products" ("price") WHERE "price" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_products_deleted_at" ON "products" ("deletedAt") WHERE "deletedAt" IS NULL;

-- Composite indexes for products (performance critical)
CREATE INDEX IF NOT EXISTS "idx_products_company_sku" ON "products" ("companyId", "sku") WHERE "sku" IS NOT NULL AND "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_products_company_code" ON "products" ("companyId", "code") WHERE "code" IS NOT NULL AND "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_products_company_deleted" ON "products" ("companyId", "deletedAt");

-- 4. UploadHistory table indexes
CREATE INDEX IF NOT EXISTS "idx_upload_history_company_id" ON "upload_history" ("companyId");
CREATE INDEX IF NOT EXISTS "idx_upload_history_type" ON "upload_history" ("uploadType");
CREATE INDEX IF NOT EXISTS "idx_upload_history_status" ON "upload_history" ("status");
CREATE INDEX IF NOT EXISTS "idx_upload_history_active" ON "upload_history" ("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "idx_upload_history_uploaded_at" ON "upload_history" ("uploadedAt");

-- Composite index for active supplier uploads (very important for matching)
CREATE INDEX IF NOT EXISTS "idx_upload_history_supplier_active" ON "upload_history" ("uploadType", "isActive", "status") WHERE "uploadType" = 'SUPPLIER_PRODUCTS' AND "isActive" = true AND "status" = 'COMPLETED';

-- 5. UploadedProducts table indexes (critical for performance)
CREATE INDEX IF NOT EXISTS "idx_uploaded_products_upload_id" ON "uploaded_products" ("uploadId");
CREATE INDEX IF NOT EXISTS "idx_uploaded_products_sku" ON "uploaded_products" ("sku") WHERE "sku" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_uploaded_products_code" ON "uploaded_products" ("code") WHERE "code" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_uploaded_products_name_trigram" ON "uploaded_products" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_uploaded_products_price" ON "uploaded_products" ("price") WHERE "price" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_uploaded_products_category" ON "uploaded_products" ("category") WHERE "category" IS NOT NULL;

-- 6. Comparisons table indexes
CREATE INDEX IF NOT EXISTS "idx_comparisons_client_upload_id" ON "comparisons" ("clientUploadId");
CREATE INDEX IF NOT EXISTS "idx_comparisons_client_id" ON "comparisons" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_comparisons_created_at" ON "comparisons" ("createdAt");

-- 7. ComparisonMatch table indexes
CREATE INDEX IF NOT EXISTS "idx_comparison_matches_comparison_id" ON "comparison_matches" ("comparisonId");
CREATE INDEX IF NOT EXISTS "idx_comparison_matches_client_product_id" ON "comparison_matches" ("clientProductId");
CREATE INDEX IF NOT EXISTS "idx_comparison_matches_best_supplier_id" ON "comparison_matches" ("bestSupplierId") WHERE "bestSupplierId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_comparison_matches_match_type" ON "comparison_matches" ("matchType");
CREATE INDEX IF NOT EXISTS "idx_comparison_matches_confidence" ON "comparison_matches" ("confidence");

-- 8. SupplierMatch table indexes
CREATE INDEX IF NOT EXISTS "idx_supplier_matches_comparison_match_id" ON "supplier_matches" ("comparisonMatchId");
CREATE INDEX IF NOT EXISTS "idx_supplier_matches_supplier_product_id" ON "supplier_matches" ("supplierProductId");
CREATE INDEX IF NOT EXISTS "idx_supplier_matches_supplier_company_id" ON "supplier_matches" ("supplierCompanyId");
CREATE INDEX IF NOT EXISTS "idx_supplier_matches_price" ON "supplier_matches" ("price");
CREATE INDEX IF NOT EXISTS "idx_supplier_matches_active" ON "supplier_matches" ("isActive") WHERE "isActive" = true;

-- 9. PreOrder table indexes
CREATE INDEX IF NOT EXISTS "idx_pre_orders_comparison_id" ON "pre_orders" ("comparisonId") WHERE "comparisonId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_pre_orders_client_id" ON "pre_orders" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_pre_orders_supplier_id" ON "pre_orders" ("supplierId");
CREATE INDEX IF NOT EXISTS "idx_pre_orders_status" ON "pre_orders" ("status");
CREATE INDEX IF NOT EXISTS "idx_pre_orders_created_at" ON "pre_orders" ("createdAt");
CREATE INDEX IF NOT EXISTS "idx_pre_orders_deleted_at" ON "pre_orders" ("deletedAt") WHERE "deletedAt" IS NULL;

-- Composite indexes for PreOrders
CREATE INDEX IF NOT EXISTS "idx_pre_orders_client_status" ON "pre_orders" ("clientId", "status") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_pre_orders_supplier_status" ON "pre_orders" ("supplierId", "status") WHERE "deletedAt" IS NULL;

-- 10. PreOrderItem table indexes
CREATE INDEX IF NOT EXISTS "idx_pre_order_items_pre_order_id" ON "pre_order_items" ("preOrderId");
CREATE INDEX IF NOT EXISTS "idx_pre_order_items_match_id" ON "pre_order_items" ("matchId") WHERE "matchId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_pre_order_items_product_id" ON "pre_order_items" ("productId");
CREATE INDEX IF NOT EXISTS "idx_pre_order_items_deleted_at" ON "pre_order_items" ("deletedAt") WHERE "deletedAt" IS NULL;

-- 11. Notifications table indexes
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("userId");
CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "notifications" ("type");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications" ("read");
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("createdAt");

-- Composite index for user notifications
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read_created" ON "notifications" ("userId", "read", "createdAt");

-- 12. Enable trigram extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 13. Add statistics targets for better query planning
ALTER TABLE "products" ALTER COLUMN "name" SET STATISTICS 1000;
ALTER TABLE "products" ALTER COLUMN "sku" SET STATISTICS 1000;
ALTER TABLE "products" ALTER COLUMN "code" SET STATISTICS 1000;
ALTER TABLE "uploaded_products" ALTER COLUMN "name" SET STATISTICS 1000;
ALTER TABLE "uploaded_products" ALTER COLUMN "sku" SET STATISTICS 1000;
ALTER TABLE "uploaded_products" ALTER COLUMN "code" SET STATISTICS 1000;