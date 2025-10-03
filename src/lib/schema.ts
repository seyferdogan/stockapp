import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // 'admin' | 'warehouse-manager' | 'store-manager'
  storeLocation: text('store_location'),
  passwordHash: text('password_hash'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Stock items table
export const stockItems = sqliteTable('stock_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode'),
});

// Warehouse inventory table
export const warehouseInventory = sqliteTable('warehouse_inventory', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => stockItems.id, { onDelete: 'cascade' }),
  availableQuantity: integer('available_quantity').notNull().default(0),
});

// Stock requests table
export const stockRequests = sqliteTable('stock_requests', {
  id: text('id').primaryKey(),
  requestNumber: integer('request_number').notNull().unique(),
  storeLocation: text('store_location').notNull(),
  comments: text('comments').notNull().default(''),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'shipped' | 'rejected' | 'cancelled'
  submittedAt: text('submitted_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  processedAt: text('processed_at'),
  shippedAt: text('shipped_at'),
  rejectedAt: text('rejected_at'),
  cancelledAt: text('cancelled_at'),
  userId: text('user_id').references(() => users.id),
  processedBy: text('processed_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  warehouseNotes: text('warehouse_notes'),
});

// Stock request items table (junction table)
export const stockRequestItems = sqliteTable('stock_request_items', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => stockRequests.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => stockItems.id, { onDelete: 'cascade' }),
  requestedQuantity: integer('requested_quantity').notNull(),
});

// NextAuth.js tables
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('sessionToken').notNull().unique(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires').notNull(),
});

export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires').notNull(),
});
