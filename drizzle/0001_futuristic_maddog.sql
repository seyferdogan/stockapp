ALTER TABLE `stock_items` ADD `barcode` text;--> statement-breakpoint
ALTER TABLE `stock_requests` ADD `rejected_at` text;--> statement-breakpoint
ALTER TABLE `stock_requests` ADD `cancelled_at` text;--> statement-breakpoint
ALTER TABLE `stock_requests` ADD `processed_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `stock_requests` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `stock_requests` ADD `warehouse_notes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` text;