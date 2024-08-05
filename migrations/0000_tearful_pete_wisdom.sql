CREATE TABLE `auth_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text(32),
	`user` integer NOT NULL,
	`created_at` text,
	`valid` integer,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
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
	`created` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`source` text NOT NULL,
	`user` integer DEFAULT NULL,
	`lat` real DEFAULT -91,
	`long` real DEFAULT -181,
	`title` text DEFAULT NULL,
	`description` text DEFAULT NULL,
	`` text DEFAULT [object Object],
	FOREIGN KEY (`boat`) REFERENCES `boats`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE set null ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_passwords` (
	`userId` integer PRIMARY KEY NOT NULL,
	`pre_salt` text(16) NOT NULL,
	`post_salt` text(16) NOT NULL,
	`hash` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
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
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`boat`) REFERENCES `boats`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_uuid_idx` ON `auth_sessions` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `boats_uuid_idx` ON `boats` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `boats_public_link_idx` ON `boats` (`uuid`);--> statement-breakpoint
CREATE INDEX `log_entries_user_idx` ON `log_entries` (`user`);--> statement-breakpoint
CREATE INDEX `log_entries_boat_idx` ON `log_entries` (`boat`);--> statement-breakpoint
CREATE INDEX `log_entries_timestamp_idx` ON `log_entries` (`timestamp`);--> statement-breakpoint
CREATE INDEX `log_entries_lat_idx` ON `log_entries` (`lat`);--> statement-breakpoint
CREATE INDEX `log_entries_long_idx` ON `log_entries` (`long`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);