# Database Schema Updates Required

## Current Schema Analysis
Based on the existing Prisma schema, we need several updates to support the new requirements.

## Required Schema Changes

### 1. Upload History Tables

```prisma
model UploadHistory {
  id          String      @id @default(cuid())
  companyId   String
  company     Company     @relation(fields: [companyId], references: [id])
  fileName    String
  fileSize    Int
  totalRows   Int
  processedRows Int
  errorRows   Int
  uploadType  UploadType  // SUPPLIER_PRODUCTS, CLIENT_REQUIREMENTS
  status      UploadStatus // PROCESSING, COMPLETED, FAILED
  isActive    Boolean     @default(false) // Only one active per company for suppliers
  priceChangeIndicator PriceChange? // UP, DOWN, SAME, FIRST_UPLOAD
  uploadedAt  DateTime    @default(now())
  processedAt DateTime?
  
  products    UploadedProduct[]
  
  @@map("upload_history")
}

model UploadedProduct {
  id            String        @id @default(cuid())
  uploadId      String
  upload        UploadHistory @relation(fields: [uploadId], references: [id])
  originalRow   Int           // Row number in original file
  sku           String?
  code          String?
  name          String
  price         Float?
  description   String?
  category      String?
  unit          String?
  
  @@map("uploaded_products")
}

enum UploadType {
  SUPPLIER_PRODUCTS
  CLIENT_REQUIREMENTS
}

enum UploadStatus {
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum PriceChange {
  UP
  DOWN
  SAME
  FIRST_UPLOAD
}
```

### 2. Enhanced Comparison System

```prisma
model Comparison {
  id              String            @id @default(cuid())
  clientUploadId  String
  clientUpload    UploadHistory     @relation("ClientComparison", fields: [clientUploadId], references: [id])
  totalProducts   Int
  matchedProducts Int
  unmatchedProducts Int
  bestPriceTotal  Float?
  previousTotal   Float?
  priceChangeIndicator PriceChange?
  createdAt       DateTime         @default(now())
  
  matches         ComparisonMatch[]
  preOrders       PreOrder[]
  
  @@map("comparisons")
}

model ComparisonMatch {
  id            String     @id @default(cuid())
  comparisonId  String
  comparison    Comparison @relation(fields: [comparisonId], references: [id])
  clientProductId String
  clientProduct UploadedProduct @relation("ClientProduct", fields: [clientProductId], references: [id])
  
  supplierMatches SupplierMatch[]
  bestPrice       Float?
  bestSupplierId  String?
  matchType       MatchType // SKU, CODE, NAME, MANUAL
  confidence      Float     // 0-1 for name matching
  
  @@map("comparison_matches")
}

model SupplierMatch {
  id                String          @id @default(cuid())
  matchId           String
  match             ComparisonMatch @relation(fields: [matchId], references: [id])
  supplierProductId String
  supplierProduct   UploadedProduct @relation("SupplierProduct", fields: [supplierProductId], references: [id])
  price             Float
  supplierId        String
  supplier          Company         @relation("SupplierMatches", fields: [supplierId], references: [id])
  
  @@map("supplier_matches")
}

enum MatchType {
  SKU
  CODE
  NAME
  MANUAL
}
```

### 3. Enhanced PreOrder System

```prisma
model PreOrder {
  id           String            @id @default(cuid())
  comparisonId String
  comparison   Comparison        @relation(fields: [comparisonId], references: [id])
  clientId     String
  client       Company           @relation("ClientPreOrders", fields: [clientId], references: [id])
  supplierId   String
  supplier     Company           @relation("SupplierPreOrders", fields: [supplierId], references: [id])
  status       PreOrderStatus
  totalAmount  Float?
  notes        String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  respondedAt  DateTime?
  
  items        PreOrderItem[]
  
  @@map("pre_orders")
}

// Update existing PreOrderItem to reference comparison matches
model PreOrderItem {
  id        String          @id @default(cuid())
  preOrderId String
  preOrder  PreOrder        @relation(fields: [preOrderId], references: [id])
  matchId   String
  match     ComparisonMatch @relation(fields: [matchId], references: [id])
  quantity  Int             @default(1)
  price     Float
  totalPrice Float
  
  @@map("pre_order_items")  
}
```

### 4. Notification System

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  title     String
  message   String
  data      Json?            // Additional data for the notification
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())
  
  @@map("notifications")
}

enum NotificationType {
  PRE_ORDER_CREATED
  PRE_ORDER_APPROVED
  PRE_ORDER_REJECTED
  UPLOAD_COMPLETED
  UPLOAD_FAILED
  PRICE_ALERT
}
```

### 5. Update existing models

```prisma
// Add relations to existing Company model
model Company {
  // ... existing fields
  uploadHistory     UploadHistory[]
  clientComparisons Comparison[]     @relation("ClientComparison")
  supplierMatches   SupplierMatch[]  @relation("SupplierMatches")
  clientPreOrders   PreOrder[]       @relation("ClientPreOrders")
  supplierPreOrders PreOrder[]       @relation("SupplierPreOrders")
}

// Add relations to existing User model  
model User {
  // ... existing fields
  notifications Notification[]
}
```

## Migration Strategy
1. Create new tables first (UploadHistory, Comparison, etc.)
2. Migrate existing Product data to UploadHistory format
3. Update existing PreOrder references
4. Add new enum types
5. Update existing relations