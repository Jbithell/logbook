CREATE TABLE `trackers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text,
	`name` text NOT NULL,
	`description` text,
	`owner` integer NOT NULL,
	`created` integer NOT NULL,
	`lastHeard` integer DEFAULT NULL,
	`expectedNextCheckIn` integer DEFAULT NULL,
	`currentBoat` integer NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`currentBoat`) REFERENCES `boats`(`id`) ON UPDATE cascade ON DELETE cascade
);
ALTER TABLE log_entries ADD `tracker` integer DEFAULT NULL REFERENCES trackers(id);
CREATE UNIQUE INDEX `tracker_uuid_idx` ON `trackers` (`uuid`);