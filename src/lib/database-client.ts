import { User, StockItem, WarehouseInventory, StockRequestSubmission } from '@/types/stock';

// User Management
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) throw new Error('Failed to create user');
  return await response.json();
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  const response = await fetch('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, updates }),
  });
  
  if (!response.ok) throw new Error('Failed to update user');
  return await response.json();
};

export const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch('/api/users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  
  if (!response.ok) throw new Error('Failed to delete user');
};

// Stock Items Management
export const getStockItems = async (): Promise<StockItem[]> => {
  try {
    const response = await fetch('/api/stock-items');
    if (!response.ok) throw new Error('Failed to fetch stock items');
    return await response.json();
  } catch (err) {
    console.error('Error fetching stock items:', err);
    return [];
  }
};

export const createStockItem = async (item: Omit<StockItem, 'id'>): Promise<StockItem> => {
  const response = await fetch('/api/stock-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  
  if (!response.ok) throw new Error('Failed to create stock item');
  return await response.json();
};

export const getStockItemByBarcode = async (barcode: string): Promise<StockItem | null> => {
  try {
    const response = await fetch(`/api/stock-items/barcode?barcode=${encodeURIComponent(barcode)}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch stock item');
    return await response.json();
  } catch (err) {
    console.error('Error fetching stock item by barcode:', err);
    return null;
  }
};

// Warehouse Inventory Management
export const getWarehouseInventory = async (): Promise<WarehouseInventory[]> => {
  try {
    const response = await fetch('/api/inventory');
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return await response.json();
  } catch (err) {
    console.error('Error fetching inventory:', err);
    return [];
  }
};

export const addStock = async (itemId: string, quantity: number): Promise<void> => {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addStock', itemId, quantity }),
  });
  
  if (!response.ok) throw new Error('Failed to add stock');
};

export const createNewProduct = async (
  product: Omit<StockItem, 'id'>, 
  initialQuantity: number
): Promise<void> => {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createProduct', product, initialQuantity }),
  });
  
  if (!response.ok) throw new Error('Failed to create product');
};

export const deleteProduct = async (itemId: string): Promise<void> => {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteProduct', itemId }),
  });
  
  if (!response.ok) throw new Error('Failed to delete product');
};

// Stock Requests Management
export const getStockRequests = async (): Promise<StockRequestSubmission[]> => {
  try {
    const response = await fetch('/api/stock-requests');
    if (!response.ok) throw new Error('Failed to fetch stock requests');
    return await response.json();
  } catch (err) {
    console.error('Error fetching stock requests:', err);
    return [];
  }
};

export const createStockRequest = async (request: Omit<StockRequestSubmission, 'id'>): Promise<void> => {
  const response = await fetch('/api/stock-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', request }),
  });
  
  if (!response.ok) throw new Error('Failed to create stock request');
};

export const updateStockRequest = async (
  requestId: string,
  updates: {
    items?: StockRequest[];
    comments?: string;
    storeLocation?: string;
  }
): Promise<void> => {
  const response = await fetch('/api/stock-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', requestId, updates }),
  });
  
  if (!response.ok) throw new Error('Failed to update stock request');
};

export const updateRequestStatus = async (
  requestId: string, 
  status: 'pending' | 'accepted' | 'shipped' | 'rejected' | 'cancelled',
  options?: {
    processedBy?: string;
    rejectionReason?: string;
    warehouseNotes?: string;
  }
): Promise<void> => {
  const response = await fetch('/api/stock-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateStatus', requestId, status, options }),
  });
  
  if (!response.ok) throw new Error('Failed to update request status');
};

export const deleteStockRequest = async (requestId: string): Promise<void> => {
  const response = await fetch('/api/stock-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', requestId }),
  });
  
  if (!response.ok) throw new Error('Failed to delete stock request');
};
