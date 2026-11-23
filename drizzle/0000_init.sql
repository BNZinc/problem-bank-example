CREATE TABLE `problems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace` text DEFAULT 'local' NOT NULL,
	`subject` text NOT NULL,
	`grade` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`difficulty` integer DEFAULT 3 NOT NULL,
	`stem` text NOT NULL,
	`choices` text DEFAULT '[]' NOT NULL,
	`answer` text DEFAULT '' NOT NULL,
	`explanation` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `problems_workspace_idx` ON `problems` (`workspace`,`id`);--> statement-breakpoint
CREATE TABLE `worksheets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace` text DEFAULT 'local' NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`problem_ids` text DEFAULT '[]' NOT NULL,
	`with_answers` integer DEFAULT true NOT NULL,
	`columns` integer DEFAULT 2 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `worksheets_workspace_idx` ON `worksheets` (`workspace`,`id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`seen_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`ai_day` text DEFAULT '' NOT NULL
);
