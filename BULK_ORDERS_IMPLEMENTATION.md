# Bulk Orders Feature - Implementation Guide

## Overview

This document provides a complete guide for the Bulk Orders feature implementation in your ecommerce platform. The feature allows distributors to place bulk orders for products, with admin controls for configuration and approval.

## 📋 Table of Contents

1. [Features](#features)
2. [Database Schema](#database-schema)
3. [Installation](#installation)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Usage Guide](#usage-guide)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## ✨ Features

### Admin Features
- Configure which products are available for bulk ordering
- Set ordering rules (pieces, sets, or both)
- Define pieces per set for set-based ordering
- View all bulk orders from distributors
- Approve or reject bulk orders
- View statistics and analytics
- Add notes to orders

### Distributor Features
- View available products for bulk ordering
- Create bulk orders with multiple items
- Choose order type (pieces or sets) based on configuration
- View order history
- Track order status (pending, approved, rejected)
- Add notes to orders

## 🗄️ Database Schema

### Tables Created

#### 1. `bulk_items`
Configuration table for products available for bulk ordering.

```sql
CREATE TABLE bulk_items (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allow_pieces BOOLEAN NOT NULL DEFAULT true,
  allow_sets BOOLEAN NOT NULL DEFAULT false,
  pieces_per_set INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 2. `bulk_orders`
Master table for bulk orders.

```sql
CREATE TABLE bulk_orders (
  id SERIAL PRIMARY KEY,
  distributor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 3. `bulk_order_items`
Line items for each bulk order.

```sql
CREATE TABLE bulk_order_items (
  id SERIAL PRIMARY KEY,
  bulk_order_id INTEGER NOT NULL REFERENCES bulk_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 🚀 Installation

### Step 1: Run the Migration Script

```bash
node scripts/migrate-bulk-orders.js
```

This script will:
- Create the three new tables
- Create necessary indexes
- Verify the table structure
- Display a summary of changes

### Step 2: Verify the Installation

Run the verification queries:

```bash
psql -U your_username -d your_database -f scripts/bulk-orders-verification.sql
```

Or manually verify tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('bulk_items', 'bulk_orders', 'bulk_order_items');
```

### Step 3: Restart Your Server

```bash
npm run dev
```

The new routes will be automatically registered in your Express app.

## 🔌 API Endpoints

### Distributor Endpoints

#### Get Available Bulk Items
```http
GET /api/bulk-items
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "productId": 10,
    "allowPieces": true,
    "allowSets": true,
    "piecesPerSet": 12,
    "productName": "Product A",
    "productPrice": "10.00",
    "productImage": "/images/product-a.jpg"
  }
]
```

#### Create Bulk Order
```http
POST /api/bulk-orders
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": 10,
      "orderType": "sets",
      "quantity": 5
    },
    {
      "productId": 12,
      "orderType": "pieces",
      "quantity": 100
    }
  ],
  "notes": "Urgent delivery required"
}
```

**Response:**
```json
{
  "order": {
    "id": 1,
    "distributorId": 5,
    "totalAmount": "1100.00",
    "status": "pending",
    "createdAt": "2026-01-05T10:30:00Z"
  },
  "items": [...]
}
```

#### Get Distributor's Bulk Orders
```http
GET /api/bulk-orders
Authorization: Bearer <token>
```

#### Get Single Order Details
```http
GET /api/bulk-orders/:id
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get All Bulk Items Configuration
```http
GET /api/admin/bulk-items
Authorization: Bearer <admin-token>
```

#### Create/Update Bulk Item Configuration
```http
POST /api/admin/bulk-items
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": 10,
  "allowPieces": true,
  "allowSets": true,
  "piecesPerSet": 12
}
```

#### Delete Bulk Item Configuration
```http
DELETE /api/admin/bulk-items/:id
Authorization: Bearer <admin-token>
```

#### Get All Bulk Orders
```http
GET /api/admin/bulk-orders?status=pending
Authorization: Bearer <admin-token>
```

#### Update Order Status
```http
PATCH /api/admin/bulk-orders/:id
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Order approved and will be processed"
}
```

#### Get Order Statistics
```http
GET /api/admin/bulk-orders/stats
Authorization: Bearer <admin-token>
```

## 🎨 Frontend Components

### Admin Components

#### 1. Bulk Items Management
**File:** `client/src/pages/admin/bulk-items-management.tsx`

**Features:**
- Configure products for bulk ordering
- Toggle pieces/sets availability
- Set pieces per set
- Edit/delete configurations

**Access:** `/admin/bulk-items-management`

#### 2. Bulk Orders Management
**File:** `client/src/pages/admin/bulk-orders.tsx`

**Features:**
- View all bulk orders
- Filter by status
- View order details with items
- Approve/reject orders
- View statistics dashboard

**Access:** `/admin/bulk-orders`

### Distributor Component

#### Distributor Bulk Orders
**File:** `client/src/pages/DistributorBulkOrders.tsx`

**Features:**
- Create new bulk orders
- Add multiple items dynamically
- Auto-calculate totals
- View order history
- Track order status

**Access:** `/distributor/bulk-orders` (or wherever you place it)

### API Service Layer
**File:** `client/src/services/bulk-orders.ts`

Contains all API functions for both admin and distributor operations.

## 📖 Usage Guide

### For Admins

#### 1. Configure Products for Bulk Ordering

1. Navigate to **Admin Panel → Bulk Items Management**
2. Click **"Add Product"**
3. Select a product from the dropdown
4. Choose ordering options:
   - ✅ **Allow ordering by pieces**: Customers can order individual pieces
   - ✅ **Allow ordering by sets**: Customers can order in sets
   - If sets enabled, specify **pieces per set** (e.g., 12)
5. Click **"Save"**

**Example Configuration:**
- Product: "Widget A"
- Allow Pieces: Yes
- Allow Sets: Yes
- Pieces per Set: 24

This means distributors can order Widget A either:
- By pieces (1, 2, 3, etc.)
- By sets (1 set = 24 pieces)

#### 2. Review and Approve Orders

1. Navigate to **Admin Panel → Bulk Orders**
2. View pending orders in the list
3. Click **"View"** to see order details
4. Click **"Change Status"**
5. Select new status (Approved/Rejected)
6. Optionally add notes
7. Click **"Update Status"**

### For Distributors

#### 1. Create a Bulk Order

1. Navigate to **Distributor Dashboard → Bulk Orders**
2. Click **"New Order"** tab
3. Click **"Add Item"** to add products
4. For each item:
   - Select **Product** from dropdown
   - Choose **Order Type** (Pieces or Sets)
   - Enter **Quantity**
   - View auto-calculated item total
5. Add optional **Notes**
6. Review **Grand Total** in the summary panel
7. Click **"Submit Order"**

#### 2. View Order History

1. Click **"Order History"** tab
2. View all past orders with status
3. Click **"View"** to see order details

## 🧪 Testing

### 1. Database Testing

Run the verification script:

```bash
psql -U postgres -d your_database -f scripts/bulk-orders-verification.sql
```

### 2. API Testing with cURL

**Create a bulk order:**
```bash
curl -X POST http://localhost:5000/api/bulk-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {
        "productId": 1,
        "orderType": "sets",
        "quantity": 5
      }
    ],
    "notes": "Test order"
  }'
```

**Get available bulk items:**
```bash
curl -X GET http://localhost:5000/api/bulk-items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Manual Testing Checklist

- [ ] Admin can configure products for bulk ordering
- [ ] Admin can set pieces/sets availability
- [ ] Distributor sees only configured products
- [ ] Order type dropdown shows only allowed options
- [ ] Totals calculate correctly for pieces
- [ ] Totals calculate correctly for sets
- [ ] Grand total updates when items change
- [ ] Order submits successfully
- [ ] Admin sees new orders in pending state
- [ ] Admin can approve orders
- [ ] Admin can reject orders
- [ ] Distributor sees updated status
- [ ] Order details display correctly

## 🔧 Troubleshooting

### Migration Issues

**Error: "relation already exists"**
- Tables already exist. Check if migration was run before.
- Solution: The script safely skips existing tables.

**Error: "permission denied"**
- Database user lacks CREATE TABLE permissions
- Solution: Run as superuser or grant permissions:
  ```sql
  GRANT CREATE ON SCHEMA public TO your_user;
  ```

### API Issues

**Error: "Unauthorized"**
- Missing or invalid authentication token
- Solution: Ensure user is logged in and token is valid

**Error: "Product not found"**
- Product ID doesn't exist or is deleted
- Solution: Verify product exists in database

**Error: "At least one of allow_pieces or allow_sets must be true"**
- Both ordering types are disabled
- Solution: Enable at least one ordering type

**Error: "pieces_per_set is required when allow_sets is true"**
- Sets enabled but pieces per set not specified
- Solution: Provide pieces_per_set value

### Frontend Issues

**Components not rendering**
- Check if routes are properly registered in your router
- Verify authentication middleware is configured

**API calls failing**
- Check network tab for error details
- Verify API endpoints match your server configuration
- Ensure Axios is configured with correct base URL

## 📁 Files Created

### Backend
- `shared/schema.ts` - Updated with new table definitions
- `server/handlers/bulk-orders-handlers.ts` - Business logic
- `server/routes/bulk-orders-routes.ts` - API routes
- `server/routes.ts` - Updated to register routes

### Frontend
- `client/src/services/bulk-orders.ts` - API service layer
- `client/src/pages/admin/bulk-items-management.tsx` - Admin config UI
- `client/src/pages/admin/bulk-orders.tsx` - Admin orders UI
- `client/src/pages/DistributorBulkOrders.tsx` - Distributor UI

### Scripts
- `scripts/migrate-bulk-orders.js` - Migration script
- `scripts/bulk-orders-verification.sql` - Verification queries

### Documentation
- `BULK_ORDERS_IMPLEMENTATION.md` - This file

## 🎯 Next Steps

1. **Add to Navigation Menus**
   - Add links to admin navigation for bulk items and orders
   - Add link to distributor dashboard for bulk orders

2. **Email Notifications** (Optional)
   - Send email when bulk order is submitted
   - Send email when order status changes

3. **Advanced Features** (Optional)
   - Bulk order templates
   - Auto-approval based on order value
   - Export bulk orders to Excel
   - Integrate with inventory management
   - Payment processing for bulk orders

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review verification queries in `bulk-orders-verification.sql`
3. Check server logs for detailed error messages
4. Verify database connection and permissions

## 📄 License

This implementation is part of your ecommerce platform.

---

**Implementation completed on:** January 5, 2026
**Version:** 1.0.0
