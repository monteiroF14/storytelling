CREATE TABLE `storyline` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`steps` text,
	`total_steps` integer,
	`status` text DEFAULT 'ongoing',
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text,
	`username` text,
	`current_storyline_id` integer,
	`current_storyline_step` integer,
	`completed_storylines` text DEFAULT '[]',
	FOREIGN KEY (`current_storyline_id`) REFERENCES `storyline`(`id`) ON UPDATE no action ON DELETE no action
);
