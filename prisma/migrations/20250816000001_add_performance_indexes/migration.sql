-- Migration: Add Performance Indexes
-- Description: Adiciona índices estratégicos para otimização de performance

-- 1. Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_company_id" ON "users" ("companyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_role" ON "users" ("role");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_created_at" ON "users" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_deleted_at" ON "users" ("deletedAt") WHERE "deletedAt" IS NULL;

-- 2. Companies table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_type" ON "companies" ("type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_name" ON "companies" ("name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_created_at" ON "companies" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_deleted_at" ON "companies" ("deletedAt") WHERE "deletedAt" IS NULL;

-- 3. Products table indexes (critical for matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_company_id" ON "products" ("companyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_sku" ON "products" ("sku") WHERE "sku" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_code" ON "products" ("code") WHERE "code" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_name_trigram" ON "products" USING gin ("name" gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_category" ON "products" ("category") WHERE "category" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_price" ON "products" ("price") WHERE "price" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_deleted_at" ON "products" ("deletedAt") WHERE "deletedAt" IS NULL;

-- Composite indexes for products (performance critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_company_sku" ON "products" ("companyId", "sku") WHERE "sku" IS NOT NULL AND "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_company_code" ON "products" ("companyId", "code") WHERE "code" IS NOT NULL AND "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_company_deleted" ON "products" ("companyId", "deletedAt");

-- 4. UploadHistory table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_upload_history_company_id" ON "upload_history" ("companyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_upload_history_type" ON "upload_history" ("uploadType");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_upload_history_status" ON "upload_history" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_upload_history_active" ON "upload_history" ("isActive") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_upload_history_uploaded_at" ON "upload_history" ("uploadedAt");

-- Composite index for active supplier uploads (very important for matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_upload_history_supplier_active" ON "upload_history" ("uploadType", "isActive", "status") WHERE "uploadType" = 'SUPPLIER_PRODUCTS' AND "isActive" = true AND "status" = 'COMPLETED';

-- 5. UploadedProducts table indexes (critical for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_uploaded_products_upload_id" ON "uploaded_products" ("uploadId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_uploaded_products_sku" ON "uploaded_products" ("sku") WHERE "sku" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_uploaded_products_code" ON "uploaded_products" ("code") WHERE "code" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_uploaded_products_name_trigram" ON "uploaded_products" USING gin ("name" gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_uploaded_products_price" ON "uploaded_products" ("price") WHERE "price" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_uploaded_products_category" ON "uploaded_products" ("category") WHERE "category" IS NOT NULL;

-- 6. Comparisons table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_comparisons_client_upload_id" ON "comparisons" ("clientUploadId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_comparisons_client_id" ON "comparisons" ("clientId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_comparisons_created_at" ON "comparisons" ("createdAt");

-- 7. ComparisonMatch table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_comparison_matches_comparison_id" ON "comparison_matches" ("comparisonId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_comparison_matches_client_product_id" ON "comparison_matches" ("clientProductId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_comparison_matches_best_supplier_id" ON "comparison_matches" ("bestSupplierId") WHERE "bestSupplierId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_comparison_matches_match_type" ON "comparison_matches" ("matchType");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_comparison_matches_confidence" ON "comparison_matches" ("confidence");

-- 8. SupplierMatch table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_supplier_matches_comparison_match_id" ON "supplier_matches" ("comparisonMatchId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_supplier_matches_supplier_product_id" ON "supplier_matches" ("supplierProductId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_supplier_matches_supplier_company_id" ON "supplier_matches" ("supplierCompanyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_supplier_matches_price" ON "supplier_matches" ("price");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_supplier_matches_active" ON "supplier_matches" ("isActive") WHERE "isActive" = true;

-- 9. PreOrder table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_orders_comparison_id" ON "pre_orders" ("comparisonId") WHERE "comparisonId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_orders_client_id" ON "pre_orders" ("clientId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_orders_supplier_id" ON "pre_orders" ("supplierId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_orders_status" ON "pre_orders" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_orders_created_at" ON "pre_orders" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_orders_deleted_at" ON "pre_orders" ("deletedAt") WHERE "deletedAt" IS NULL;

-- Composite indexes for PreOrders
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_orders_client_status" ON "pre_orders" ("clientId", "status") WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_orders_supplier_status" ON "pre_orders" ("supplierId", "status") WHERE "deletedAt" IS NULL;

-- 10. PreOrderItem table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_order_items_pre_order_id" ON "pre_order_items" ("preOrderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_order_items_match_id" ON "pre_order_items" ("matchId") WHERE "matchId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_order_items_product_id" ON "pre_order_items" ("productId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pre_order_items_deleted_at" ON "pre_order_items" ("deletedAt") WHERE "deletedAt" IS NULL;

-- 11. Notifications table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_type" ON "notifications" ("type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_read" ON "notifications" ("read");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("createdAt");

-- Composite index for user notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_user_read_created" ON "notifications" ("userId", "read", "createdAt");

-- 12. Enable trigram extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 13. Add statistics targets for better query planning
ALTER TABLE "products" ALTER COLUMN "name" SET STATISTICS 1000;
ALTER TABLE "products" ALTER COLUMN "sku" SET STATISTICS 1000;
ALTER TABLE "products" ALTER COLUMN "code" SET STATISTICS 1000;
ALTER TABLE "uploaded_products" ALTER COLUMN "name" SET STATISTICS 1000;
ALTER TABLE "uploaded_products" ALTER COLUMN "sku" SET STATISTICS 1000;
ALTER TABLE "uploaded_products" ALTER COLUMN "code" SET STATISTICS 1000;