import axios from "axios";

// ========================
// TYPES
// ========================

export interface BulkItem {
  id: number;
  productId: number;
  allowPieces: boolean;
  allowSets: boolean;
  piecesPerSet: number | null;
  createdAt: string;
  updatedAt: string;
  productName?: string;
  productPrice?: string;
  productImage?: string;
  productSku?: string;
  productStock?: number;
  productDescription?: string;
}

export interface BulkOrderItem {
  id?: number;
  bulkOrderId?: number;
  productId: number;
  orderType: "pieces" | "sets";
  quantity: number;
  unitPrice?: string;
  totalPrice?: string;
  createdAt?: string;
  productName?: string;
  productImage?: string;
  productSku?: string;
}

export interface BulkOrder {
  id: number;
  distributorId: number;
  totalAmount: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  distributorName?: string;
  distributorEmail?: string;
  distributorUsername?: string;
  items?: BulkOrderItem[];
}

export interface CreateBulkOrderRequest {
  items: Array<{
    productId: number;
    orderType: "pieces" | "sets";
    quantity: number;
  }>;
  notes?: string;
}

export interface UpdateBulkOrderStatusRequest {
  status: "pending" | "approved" | "rejected";
  notes?: string;
}

export interface BulkOrderStats {
  byStatus: Array<{
    status: string;
    count: number;
    totalAmount: string;
  }>;
  total: number;
}

// ========================
// API FUNCTIONS
// ========================

/**
 * Get all products available for bulk ordering
 * Used by distributors to see what they can order
 */
export async function getAvailableBulkItems(): Promise<BulkItem[]> {
  const response = await axios.get("/api/bulk-items");
  return response.data;
}

/**
 * Get all bulk items configuration (admin only)
 */
export async function getAllBulkItems(): Promise<BulkItem[]> {
  const response = await axios.get("/api/admin/bulk-items");
  return response.data;
}

/**
 * Get single bulk item by ID (admin only)
 */
export async function getBulkItemById(id: number): Promise<BulkItem> {
  const response = await axios.get(`/api/admin/bulk-items/${id}`);
  return response.data;
}

/**
 * Create or update bulk item configuration (admin only)
 */
export async function createBulkItem(data: {
  productId: number;
  allowPieces: boolean;
  allowSets: boolean;
  piecesPerSet?: number;
}): Promise<BulkItem> {
  const response = await axios.post("/api/admin/bulk-items", data);
  return response.data;
}

/**
 * Update bulk item configuration (admin only)
 */
export async function updateBulkItem(
  id: number,
  data: Partial<{
    allowPieces: boolean;
    allowSets: boolean;
    piecesPerSet: number;
  }>
): Promise<BulkItem> {
  const response = await axios.put(`/api/admin/bulk-items/${id}`, data);
  return response.data;
}

/**
 * Delete bulk item configuration (admin only)
 */
export async function deleteBulkItem(id: number): Promise<void> {
  await axios.delete(`/api/admin/bulk-items/${id}`);
}

/**
 * Create a new bulk order (distributor)
 */
export async function createBulkOrder(
  data: CreateBulkOrderRequest
): Promise<{ order: BulkOrder; items: BulkOrderItem[] }> {
  const response = await axios.post("/api/bulk-orders", data);
  return response.data;
}

/**
 * Get bulk orders for logged-in distributor
 */
export async function getDistributorBulkOrders(): Promise<BulkOrder[]> {
  const response = await axios.get("/api/bulk-orders");
  return response.data;
}

/**
 * Get single bulk order by ID
 * Distributors can only see their own, admins can see all
 */
export async function getBulkOrderById(id: number): Promise<BulkOrder> {
  const response = await axios.get(`/api/bulk-orders/${id}`);
  return response.data;
}

/**
 * Get all bulk orders (admin only)
 */
export async function getAllBulkOrders(
  status?: "pending" | "approved" | "rejected"
): Promise<BulkOrder[]> {
  const response = await axios.get("/api/admin/bulk-orders", {
    params: { status },
  });
  return response.data;
}

/**
 * Get single bulk order by ID (admin view)
 */
export async function getAdminBulkOrderById(id: number): Promise<BulkOrder> {
  const response = await axios.get(`/api/admin/bulk-orders/${id}`);
  return response.data;
}

/**
 * Update bulk order status (admin only)
 */
export async function updateBulkOrderStatus(
  id: number,
  data: UpdateBulkOrderStatusRequest
): Promise<BulkOrder> {
  const response = await axios.patch(`/api/admin/bulk-orders/${id}`, data);
  return response.data;
}

/**
 * Delete bulk order (admin only)
 */
export async function deleteBulkOrder(id: number): Promise<void> {
  await axios.delete(`/api/admin/bulk-orders/${id}`);
}

/**
 * Get bulk order statistics (admin only)
 */
export async function getBulkOrderStats(): Promise<BulkOrderStats> {
  const response = await axios.get("/api/admin/bulk-orders/stats");
  return response.data;
}
