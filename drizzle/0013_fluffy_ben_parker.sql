CREATE TABLE `adminInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`invitedBy` int NOT NULL,
	`role` enum('admin') NOT NULL DEFAULT 'admin',
	`status` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminInvites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `activityLog` ADD `ipAddress` varchar(45);