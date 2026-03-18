CREATE TABLE `budget_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`previous_amount` real,
	`category_id` text,
	`period` text NOT NULL,
	`date` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
