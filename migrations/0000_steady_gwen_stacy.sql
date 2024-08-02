CREATE TABLE `boats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text DEFAULT NULL,
	`name` text NOT NULL,
	`description` text,
	`owner` integer NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `log_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`boat` integer NOT NULL,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`user` integer DEFAULT NULL,
	FOREIGN KEY (`boat`) REFERENCES `boats`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE set null ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text,
	`first_name` text NOT NULL,
	`surname` text NOT NULL,
	`email` text NOT NULL,
	`permission_type` text DEFAULT 'VIEW-ONLY'
);
--> statement-breakpoint
CREATE TABLE `users_to_boats` (
	`user` integer NOT NULL,
	`boat` integer NOT NULL,
	PRIMARY KEY(`boat`, `user`),
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`boat`) REFERENCES `boats`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uuid_idx` ON `boats` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `public_link_idx` ON `boats` (`uuid`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `log_entries` (`user`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_idx` ON `users` (lower(`email`));