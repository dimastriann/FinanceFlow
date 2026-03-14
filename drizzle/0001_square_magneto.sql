CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_name` text DEFAULT 'John Doe' NOT NULL,
	`theme` text DEFAULT 'dark' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`is_biometric_enabled` integer DEFAULT false NOT NULL
);
