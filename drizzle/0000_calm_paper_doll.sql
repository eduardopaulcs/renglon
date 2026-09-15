CREATE TABLE `folders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`parent_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `folders_uuid_unique` ON `folders` (`uuid`);--> statement-breakpoint
CREATE INDEX `folders_parent_idx` ON `folders` (`parent_id`);--> statement-breakpoint
CREATE TABLE `note_tags` (
	`note_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`note_id`, `tag_id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `note_tags_tag_idx` ON `note_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`folder_id` integer,
	`pinned` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`deleted_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notes_uuid_unique` ON `notes` (`uuid`);--> statement-breakpoint
CREATE INDEX `notes_folder_idx` ON `notes` (`folder_id`);--> statement-breakpoint
CREATE INDEX `notes_active_updated_idx` ON `notes` (`deleted_at`,`archived`,`updated_at`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_uuid_unique` ON `tags` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);