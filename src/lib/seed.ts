import { db } from './db';
import { users, stockItems, warehouseInventory, stockRequests, stockRequestItems } from './schema';
import { nanoid } from 'nanoid';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.delete(stockRequestItems);
  await db.delete(stockRequests);
  await db.delete(warehouseInventory);
  await db.delete(stockItems);
  await db.delete(users);

  // Create users
  const adminId = nanoid();
  const warehouseManagerId = nanoid();
  const storeManagerSydneyId = nanoid();
  const storeManagerMelbourneId = nanoid();

  await db.insert(users).values([
    {
      id: adminId,
      name: 'Admin User',
      email: 'admin@stockapp.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: warehouseManagerId,
      name: 'Warehouse Manager',
      email: 'warehouse@stockapp.com',
      role: 'warehouse-manager',
      createdAt: new Date().toISOString(),
    },
    {
      id: storeManagerSydneyId,
      name: 'Sydney Store Manager',
      email: 'sydney@stockapp.com',
      role: 'store-manager',
      storeLocation: 'Sydney',
      createdAt: new Date().toISOString(),
    },
    {
      id: storeManagerMelbourneId,
      name: 'Melbourne Store Manager',
      email: 'melbourne@stockapp.com',
      role: 'store-manager',
      storeLocation: 'Melbourne',
      createdAt: new Date().toISOString(),
    },
  ]);

  // Create stock items
  const stockItemsData = [
    { id: nanoid(), name: 'iPhone 15 Pro', sku: 'IPH15P-256' },
    { id: nanoid(), name: 'Samsung Galaxy S24', sku: 'SGS24-128' },
    { id: nanoid(), name: 'MacBook Air M3', sku: 'MBA-M3-13' },
    { id: nanoid(), name: 'iPad Pro 12.9"', sku: 'IPD-PRO-129' },
    { id: nanoid(), name: 'AirPods Pro 2', sku: 'APP-2ND' },
    { id: nanoid(), name: 'Apple Watch Series 9', sku: 'AWS9-45MM' },
    { id: nanoid(), name: 'Dell XPS 13', sku: 'DXP13-I7' },
    { id: nanoid(), name: 'Sony WH-1000XM5', sku: 'SWH-1000XM5' },
  ];

  await db.insert(stockItems).values(stockItemsData);

  // Create warehouse inventory
  const inventoryData = stockItemsData.map(item => ({
    id: nanoid(),
    itemId: item.id,
    availableQuantity: Math.floor(Math.random() * 100) + 20, // Random quantity between 20-120
  }));

  await db.insert(warehouseInventory).values(inventoryData);

  // Create some sample stock requests
  const request1Id = nanoid();
  const request2Id = nanoid();

  await db.insert(stockRequests).values([
    {
      id: request1Id,
      requestNumber: 1,
      storeLocation: 'Sydney',
      comments: 'Urgent restock needed for weekend sale',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      userId: storeManagerSydneyId,
    },
    {
      id: request2Id,
      requestNumber: 2,
      storeLocation: 'Melbourne',
      comments: 'Regular monthly restock',
      status: 'accepted',
      submittedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      processedAt: new Date().toISOString(),
      userId: storeManagerMelbourneId,
    },
  ]);

  // Create stock request items
  await db.insert(stockRequestItems).values([
    {
      id: nanoid(),
      requestId: request1Id,
      itemId: stockItemsData[0].id, // iPhone 15 Pro
      requestedQuantity: 10,
    },
    {
      id: nanoid(),
      requestId: request1Id,
      itemId: stockItemsData[4].id, // AirPods Pro 2
      requestedQuantity: 15,
    },
    {
      id: nanoid(),
      requestId: request2Id,
      itemId: stockItemsData[1].id, // Samsung Galaxy S24
      requestedQuantity: 8,
    },
    {
      id: nanoid(),
      requestId: request2Id,
      itemId: stockItemsData[2].id, // MacBook Air M3
      requestedQuantity: 5,
    },
  ]);

  console.log('✅ Database seeded successfully!');
}

// Run if called directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}
