-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'SUPPLIER', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."CompanyType" AS ENUM ('SUPPLIER', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."PreOrderStatus" AS ENUM ('ACTIVE', 'FINALIZED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."UploadType" AS ENUM ('SUPPLIER_PRODUCTS', 'CLIENT_REQUIREMENTS');

-- CreateEnum
CREATE TYPE "public"."UploadStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PriceChange" AS ENUM ('UP', 'DOWN', 'SAME', 'FIRST_UPLOAD');

-- CreateEnum
CREATE TYPE "public"."MatchType" AS ENUM ('SKU', 'CODE', 'NAME', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('PRE_ORDER_CREATED', 'PRE_ORDER_APPROVED', 'PRE_ORDER_REJECTED', 'UPLOAD_COMPLETED', 'UPLOAD_FAILED', 'PRICE_ALERT', 'MATCH_CREATED', 'COMPARISON_COMPLETED', 'SYSTEM_UPDATE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."CompanyType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pre_orders" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT,
    "clientId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "public"."PreOrderStatus" NOT NULL,
    "totalAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pre_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pre_order_items" (
    "id" TEXT NOT NULL,
    "preOrderId" TEXT NOT NULL,
    "matchId" TEXT,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pre_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."upload_history" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "processedRows" INTEGER NOT NULL,
    "errorRows" INTEGER NOT NULL,
    "uploadType" "public"."UploadType" NOT NULL,
    "status" "public"."UploadStatus" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "priceChangeIndicator" "public"."PriceChange",
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "upload_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."uploaded_products" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "originalRow" INTEGER NOT NULL,
    "sku" TEXT,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT,
    "quantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comparisons" (
    "id" TEXT NOT NULL,
    "clientUploadId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "totalProducts" INTEGER NOT NULL,
    "matchedProducts" INTEGER NOT NULL,
    "unmatchedProducts" INTEGER NOT NULL,
    "bestPriceTotal" DOUBLE PRECISION,
    "previousTotal" DOUBLE PRECISION,
    "priceChangeIndicator" "public"."PriceChange",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comparison_matches" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "clientProductId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "bestPrice" DOUBLE PRECISION,
    "bestSupplierId" TEXT,
    "matchType" "public"."MatchType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparison_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supplier_matches" (
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
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_companyId_sku_key" ON "public"."products"("companyId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_matches_comparisonMatchId_supplierCompanyId_key" ON "public"."supplier_matches"("comparisonMatchId", "supplierCompanyId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pre_orders" ADD CONSTRAINT "pre_orders_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "public"."comparisons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pre_orders" ADD CONSTRAINT "pre_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pre_orders" ADD CONSTRAINT "pre_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pre_order_items" ADD CONSTRAINT "pre_order_items_preOrderId_fkey" FOREIGN KEY ("preOrderId") REFERENCES "public"."pre_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pre_order_items" ADD CONSTRAINT "pre_order_items_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."comparison_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pre_order_items" ADD CONSTRAINT "pre_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_history" ADD CONSTRAINT "upload_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."uploaded_products" ADD CONSTRAINT "uploaded_products_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "public"."upload_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comparisons" ADD CONSTRAINT "comparisons_clientUploadId_fkey" FOREIGN KEY ("clientUploadId") REFERENCES "public"."upload_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comparisons" ADD CONSTRAINT "comparisons_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comparison_matches" ADD CONSTRAINT "comparison_matches_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "public"."comparisons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comparison_matches" ADD CONSTRAINT "comparison_matches_clientProductId_fkey" FOREIGN KEY ("clientProductId") REFERENCES "public"."uploaded_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_matches" ADD CONSTRAINT "supplier_matches_comparisonMatchId_fkey" FOREIGN KEY ("comparisonMatchId") REFERENCES "public"."comparison_matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_matches" ADD CONSTRAINT "supplier_matches_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "public"."uploaded_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_matches" ADD CONSTRAINT "supplier_matches_supplierCompanyId_fkey" FOREIGN KEY ("supplierCompanyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
