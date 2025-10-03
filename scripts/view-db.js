const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'local.db');
const db = new Database(dbPath);

console.log('📊 StockApp Database Contents\n');

// Users
console.log('👥 USERS:');
const users = db.prepare('SELECT * FROM users').all();
console.table(users);

// Stock Items
console.log('\n📦 STOCK ITEMS:');
const stockItems = db.prepare('SELECT * FROM stock_items').all();
console.table(stockItems);

// Warehouse Inventory
console.log('\n🏪 WAREHOUSE INVENTORY:');
const inventory = db.prepare(`
  SELECT si.name, si.sku, wi.availableQuantity 
  FROM warehouse_inventory wi 
  JOIN stock_items si ON wi.itemId = si.id
`).all();
console.table(inventory);

// Stock Requests
console.log('\n📋 STOCK REQUESTS:');
const requests = db.prepare(`
  SELECT sr.id, sr.requestNumber, sr.storeLocation, sr.status, u.name as userName, sr.comments
  FROM stock_requests sr 
  LEFT JOIN users u ON sr.userId = u.id
`).all();
console.table(requests);

// Stock Request Items
console.log('\n📝 STOCK REQUEST ITEMS:');
const requestItems = db.prepare(`
  SELECT sr.requestNumber, si.name as itemName, sri.requestedQuantity
  FROM stock_request_items sri
  JOIN stock_requests sr ON sri.requestId = sr.id
  JOIN stock_items si ON sri.itemId = si.id
  ORDER BY sr.requestNumber
`).all();
console.table(requestItems);

db.close();
console.log('\n✅ Database view complete!');
