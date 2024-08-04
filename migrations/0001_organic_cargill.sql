CREATE TABLE `auth_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text,
	`user` integer NOT NULL,
	`created_at` text,
	`valid` integer,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_uuid_idx` ON `auth_sessions` (`uuid`);