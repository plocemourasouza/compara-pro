# MVP User Stories

## Supplier Stories

### Product Management
- **As a supplier**, I want to upload my product list via Excel/CSV so that clients can see my current offerings
- **As a supplier**, I want to view my upload history so that I can track what lists I've submitted
- **As a supplier**, I want to see price change indicators on my uploads so that I know if my prices went up or down
- **As a supplier**, I want only my latest upload to be active for comparisons so that clients see current prices

### Pre-order Management  
- **As a supplier**, I want to receive notifications when clients create pre-orders with my products
- **As a supplier**, I want to view pre-order details so that I can decide whether to accept or reject
- **As a supplier**, I want to approve or reject pre-orders so that I can control my sales commitments
- **As a supplier**, I want to see pre-order status so that I can track my pending and confirmed orders

## Client Stories

### Product Comparison
- **As a client**, I want to upload my product requirement list via Excel/CSV so that I can find suppliers
- **As a client**, I want the system to automatically match my products with supplier offerings by SKU, code, or name
- **As a client**, I want to see the best prices for each product so that I can make informed purchasing decisions
- **As a client**, I want to manually search for products when auto-matching fails so that I don't miss opportunities

### Pre-order Management
- **As a client**, I want to select products from comparison results so that I can create a pre-order
- **As a client**, I want to remove unwanted products before saving as pre-order so that I only order what I need
- **As a client**, I want to view my pre-order status so that I know which suppliers have responded
- **As a client**, I want to see my comparison history so that I can track my procurement activities
- **As a client**, I want to see price trend indicators so that I know if prices are improving or worsening

## Admin Stories

### System Management
- **As an admin**, I want to manage user accounts so that I can control platform access
- **As an admin**, I want to manage company profiles so that I can organize users properly  
- **As an admin**, I want to view system metrics so that I can monitor platform usage
- **As an admin**, I want to manage product categories so that comparisons are more accurate

## Technical Stories

### File Processing
- **As a system**, I need to validate uploaded files for required fields (SKU, code, name, price)
- **As a system**, I need to process Excel and CSV formats reliably
- **As a system**, I need to store upload history for audit purposes
- **As a system**, I need to calculate price change indicators between uploads

### Matching Algorithm
- **As a system**, I need to match products by SKU first, then code, then name similarity
- **As a system**, I need to handle multiple suppliers having the same product
- **As a system**, I need to identify the best price among matched products
- **As a system**, I need to flag unmatched products for manual review