# Price Comparison Platform - Business Requirements

## Business Model
**SaaS Platform** connecting suppliers and clients for efficient price comparison and procurement.

## Target Market
- **Size**: Small to medium enterprises (SMEs)
- **Sectors**: Retail, supermarkets, wholesalers, warehouses
- **Volume**: 100-10,000 products per query
- **Users**: 5 users expected during MVP validation
- **Transactions**: 100-1,000 transactions/month

## Core Value Proposition
1. **No Installation Required**: Web-based SaaS eliminating software installation
2. **Time Efficiency**: Eliminates manual file exchange between suppliers and clients
3. **Automated Comparison**: Instant price comparison across multiple suppliers
4. **Streamlined Procurement**: From upload to pre-order in one platform

## User Roles & Permissions
- **ADMIN**: System administration, user/company management
- **SUPPLIER**: Product upload, pre-order management
- **CLIENT**: Product upload, comparison, pre-order creation

## Core Workflows

### Supplier Workflow
1. Upload product lists (Excel/CSV)
2. Maintain product catalog
3. View upload history with price change indicators
4. Receive and approve/reject pre-orders
5. View pre-order notifications and status

### Client Workflow  
1. Upload product requirement lists (Excel/CSV)
2. View automatic price comparisons
3. Manual product search for unmatched items
4. Create pre-orders by selecting desired products
5. Track pre-order status and supplier responses
6. View comparison history with price trend indicators

## MVP Critical Features
1. **File Upload System** (Excel/CSV support)
2. **Product Matching Algorithm** (SKU, code, name-based)
3. **Price Comparison Engine**
4. **Pre-order Management**
5. **Upload History with Price Trends**
6. **User & Company Management**
7. **Notification System**

## Business Rules
- Only latest supplier upload is active for comparisons
- All uploads are saved for historical reference
- Client has purchasing autonomy (no internal approval needed)
- Supplier approval converts pre-order to confirmed order
- Price trend indicators show comparison with previous uploads