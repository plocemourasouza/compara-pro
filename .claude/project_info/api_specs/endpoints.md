# API Endpoints Specification

## Upload Management

### POST /api/upload/products
Upload supplier product list or client requirement list
```typescript
// Request
Content-Type: multipart/form-data
{
  file: File, // Excel or CSV
  type: 'SUPPLIER_PRODUCTS' | 'CLIENT_REQUIREMENTS'
}

// Response
{
  uploadId: string,
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
  totalRows: number,
  processedRows: number,
  errorRows: number,
  errors?: string[]
}
```

### GET /api/upload/history
Get upload history for current user's company
```typescript
// Response
{
  uploads: [{
    id: string,
    fileName: string,
    uploadType: string,
    status: string,
    isActive: boolean,
    priceChangeIndicator: 'UP' | 'DOWN' | 'SAME' | 'FIRST_UPLOAD',
    uploadedAt: string,
    totalRows: number
  }]
}
```

## Comparison Management

### POST /api/comparison/create
Create comparison from client upload
```typescript
// Request
{
  uploadId: string
}

// Response
{
  comparisonId: string,
  totalProducts: number,
  matchedProducts: number,
  unmatchedProducts: number,
  matches: [{
    clientProduct: Product,
    supplierMatches: [{
      supplier: Company,
      product: Product,
      price: number
    }],
    bestPrice: number,
    matchType: 'SKU' | 'CODE' | 'NAME'
  }]
}
```

### GET /api/comparison/:id
Get comparison details
### GET /api/comparison/history
Get comparison history for client

### POST /api/comparison/:id/manual-match
Manually match unmatched product
```typescript
// Request
{
  clientProductId: string,
  supplierProductId: string
}
```

## Pre-order Management

### POST /api/pre-order/create
Create pre-order from comparison
```typescript
// Request
{
  comparisonId: string,
  supplierId: string,
  selectedMatches: string[], // ComparisonMatch IDs
  notes?: string
}

// Response
{
  preOrderId: string,
  totalAmount: number,
  items: PreOrderItem[]
}
```

### GET /api/pre-order/list
List pre-orders (filtered by user role)
```typescript
// Response for CLIENT
{
  preOrders: [{
    id: string,
    supplier: Company,
    status: PreOrderStatus,
    totalAmount: number,
    createdAt: string,
    itemCount: number
  }]
}

// Response for SUPPLIER  
{
  preOrders: [{
    id: string,
    client: Company,
    status: PreOrderStatus,
    totalAmount: number,
    createdAt: string,
    itemCount: number
  }]
}
```

### PUT /api/pre-order/:id/respond
Supplier responds to pre-order
```typescript
// Request
{
  action: 'APPROVE' | 'REJECT',
  notes?: string
}
```

## Product Search

### GET /api/products/search
Search products for manual matching
```typescript
// Query params: q (search term), supplierId?, limit?
// Response
{
  products: [{
    id: string,
    sku: string,
    code: string,
    name: string,
    price: number,
    supplier: Company
  }]
}
```

## Notifications

### GET /api/notifications
Get user notifications
### PUT /api/notifications/:id/read
Mark notification as read
### POST /api/notifications/mark-all-read
Mark all notifications as read

## File Processing

### GET /api/upload/:id/status
Check upload processing status
### GET /api/upload/:id/errors
Get upload error details
### GET /api/upload/:id/preview
Preview uploaded data (first 10 rows)