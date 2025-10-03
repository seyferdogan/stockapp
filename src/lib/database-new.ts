import { db } from './db';
import { users, stockItems, warehouseInventory, stockRequests, stockRequestItems } from './schema';
import { User, StockItem, WarehouseInventory, StockRequestSubmission } from '@/types/stock';
import { eq, desc, asc, max } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// User Management
export const getUsers = async (): Promise<User[]> => {
  try {
    const result = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    
    return result.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as User['role'],
      storeLocation: user.storeLocation || undefined,
      createdAt: user.createdAt
    }));
    
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  const newUser = {
    id: nanoid(),
    name: userData.name,
    email: userData.email,
    role: userData.role,
    storeLocation: userData.storeLocation || null,
    createdAt: new Date().toISOString(),
  };

  const [result] = await db.insert(users).values(newUser).returning();
  
  return {
    id: result.id,
    name: result.name,
    email: result.email,
    role: result.role as User['role'],
    storeLocation: result.storeLocation || undefined,
    createdAt: result.createdAt
  };
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.storeLocation !== undefined) updateData.storeLocation = updates.storeLocation;

  const [result] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();
  
  return {
    id: result.id,
    name: result.name,
    email: result.email,
    role: result.role as User['role'],
    storeLocation: result.storeLocation || undefined,
    createdAt: result.createdAt
  };
};

export const deleteUser = async (userId: string): Promise<void> => {
  await db.delete(users).where(eq(users.id, userId));
};

// Stock Items Management
export const getStockItems = async (): Promise<StockItem[]> => {
  try {
    const result = await db
      .select()
      .from(stockItems)
      .orderBy(asc(stockItems.name));

    return result;
    
  } catch (err) {
    console.error('Error fetching stock items:', err);
    return [];
  }
};

export const createStockItem = async (item: Omit<StockItem, 'id'>): Promise<StockItem> => {
  const newItem = {
    id: nanoid(),
    name: item.name,
    sku: item.sku,
  };

  const [result] = await db.insert(stockItems).values(newItem).returning();
  return result;
};

// Warehouse Inventory Management
export const getWarehouseInventory = async (): Promise<WarehouseInventory[]> => {
  try {
    const result = await db
      .select()
      .from(warehouseInventory);
    
    return result.map(inventory => ({
      itemId: inventory.itemId,
      availableQuantity: inventory.availableQuantity
    }));
    
  } catch (err) {
    console.error('Error fetching inventory:', err);
    return [];
  }
};

export const addStock = async (itemId: string, quantity: number): Promise<void> => {
  // Check if inventory record exists
  const existingInventory = await db
    .select()
    .from(warehouseInventory)
    .where(eq(warehouseInventory.itemId, itemId))
    .limit(1);

  if (existingInventory.length > 0) {
    // Update existing inventory
    await db
      .update(warehouseInventory)
      .set({ 
        availableQuantity: existingInventory[0].availableQuantity + quantity
      })
      .where(eq(warehouseInventory.itemId, itemId));
  } else {
    // Create new inventory record
    await db.insert(warehouseInventory).values({
      id: nanoid(),
      itemId: itemId,
      availableQuantity: quantity
    });
  }
};

export const createNewProduct = async (
  product: Omit<StockItem, 'id'>, 
  initialQuantity: number
): Promise<void> => {
  // First create the stock item
  const newItem = {
    id: nanoid(),
    name: product.name,
    sku: product.sku,
  };

  const [stockItem] = await db.insert(stockItems).values(newItem).returning();

  // Then create the inventory entry
  await db.insert(warehouseInventory).values({
    id: nanoid(),
    itemId: stockItem.id,
    availableQuantity: initialQuantity
  });
};

export const deleteProduct = async (itemId: string): Promise<void> => {
  // Delete from warehouse_inventory first (foreign key constraint)
  await db.delete(warehouseInventory).where(eq(warehouseInventory.itemId, itemId));
  
  // Delete from stock_request_items (foreign key constraint)
  await db.delete(stockRequestItems).where(eq(stockRequestItems.itemId, itemId));
  
  // Then delete the stock item
  await db.delete(stockItems).where(eq(stockItems.id, itemId));
};

export const deleteStockRequest = async (requestId: string): Promise<void> => {
  // First delete the request items (foreign key constraint)
  await db.delete(stockRequestItems).where(eq(stockRequestItems.requestId, requestId));
  
  // Then delete the main request
  await db.delete(stockRequests).where(eq(stockRequests.id, requestId));
};

// Stock Requests Management
export const getStockRequests = async (): Promise<StockRequestSubmission[]> => {
  try {
    // Get all stock requests
    const requests = await db
      .select()
      .from(stockRequests)
      .orderBy(desc(stockRequests.submittedAt));

    // Get all request items for these requests
    const requestIds = requests.map(r => r.id);
    const items = requestIds.length > 0 ? await db
      .select()
      .from(stockRequestItems)
      .where(eq(stockRequestItems.requestId, requestIds[0])) // We'll need to do this differently
      : [];

    // For now, let's get items for each request individually
    const result: StockRequestSubmission[] = [];
    
    for (const request of requests) {
      const requestItems = await db
        .select()
        .from(stockRequestItems)
        .where(eq(stockRequestItems.requestId, request.id));

      result.push({
        id: request.id,
        requestNumber: request.requestNumber,
        storeLocation: request.storeLocation,
        items: requestItems.map(item => ({
          itemId: item.itemId,
          requestedQuantity: item.requestedQuantity
        })),
        comments: request.comments || '',
        status: request.status as StockRequestSubmission['status'],
        submittedAt: request.submittedAt,
        processedAt: request.processedAt || undefined,
        shippedAt: request.shippedAt || undefined
      });
    }

    return result;
    
  } catch (err) {
    console.error('Error fetching stock requests:', err);
    return [];
  }
};

export const createStockRequest = async (request: Omit<StockRequestSubmission, 'id'>): Promise<void> => {
  // Get the next request number
  const maxRequestNumber = await db
    .select({ max: max(stockRequests.requestNumber) })
    .from(stockRequests);
  
  const nextRequestNumber = (maxRequestNumber[0]?.max || 0) + 1;

  // Create the main request
  const newRequest = {
    id: nanoid(),
    requestNumber: nextRequestNumber,
    storeLocation: request.storeLocation,
    comments: request.comments,
    status: request.status,
    submittedAt: request.submittedAt,
    processedAt: request.processedAt || null,
    shippedAt: request.shippedAt || null,
    userId: null, // We'll add user tracking later with auth
  };

  const [stockRequest] = await db.insert(stockRequests).values(newRequest).returning();

  // Create the request items
  const requestItems = request.items.map(item => ({
    id: nanoid(),
    requestId: stockRequest.id,
    itemId: item.itemId,
    requestedQuantity: item.requestedQuantity
  }));

  await db.insert(stockRequestItems).values(requestItems);
};

export const updateRequestStatus = async (
  requestId: string, 
  status: 'pending' | 'accepted' | 'shipped'
): Promise<void> => {
  const updates: any = { status };
  
  if (status === 'accepted') {
    updates.processedAt = new Date().toISOString();
  } else if (status === 'shipped') {
    updates.shippedAt = new Date().toISOString();
  }

  await db
    .update(stockRequests)
    .set(updates)
    .where(eq(stockRequests.id, requestId));

  // If accepting request, decrease inventory
  if (status === 'accepted') {
    // Get the request items to decrease inventory
    const requestItems = await db
      .select()
      .from(stockRequestItems)
      .where(eq(stockRequestItems.requestId, requestId));

    // Decrease inventory for each item
    for (const item of requestItems) {
      const currentInventory = await db
        .select()
        .from(warehouseInventory)
        .where(eq(warehouseInventory.itemId, item.itemId))
        .limit(1);

      if (currentInventory.length > 0) {
        const newQuantity = Math.max(0, currentInventory[0].availableQuantity - item.requestedQuantity);
        
        await db
          .update(warehouseInventory)
          .set({ availableQuantity: newQuantity })
          .where(eq(warehouseInventory.itemId, item.itemId));
      }
    }
  }
};
