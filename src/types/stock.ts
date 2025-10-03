export interface StockItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
}

export interface StockRequest {
  itemId: string;
  requestedQuantity: number;
}

export interface StockRequestForm {
  items: StockRequest[];
  comments: string;
  storeLocation: string;
}

export interface WarehouseInventory {
  itemId: string;
  availableQuantity: number;
}

export type RequestStatus = 'pending' | 'accepted' | 'shipped' | 'rejected' | 'cancelled';

export interface StockRequestSubmission {
  id: string;
  requestNumber?: number;
  storeLocation: string;
  items: StockRequest[];
  comments: string;
  status: RequestStatus;
  submittedAt: string;
  processedAt?: string;
  shippedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  userId?: string;
  processedBy?: string;
  rejectionReason?: string;
  warehouseNotes?: string;
}

export type UserRole = 'admin' | 'warehouse-manager' | 'store-manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeLocation?: string; // Only for store managers
  createdAt: string;
}
