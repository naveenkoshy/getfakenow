CREATE TABLE `customerEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(255),
	`eventType` varchar(50) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`metadata` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerTagAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tagId` int NOT NULL,
	`assignedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerTagAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#6B7280',
	`description` text,
	`autoAssign` boolean NOT NULL DEFAULT false,
	`autoAssignRule` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerTags_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerTags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `emailOptIn` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `authProvider` enum('manus','google','facebook','email') DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `googleId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `facebookId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `profileCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingStep` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `addressLine1` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `addressLine2` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `state` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `postalCode` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(100) DEFAULT 'Malaysia';--> statement-breakpoint
ALTER TABLE `users` ADD `addressVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `marketingConsent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `consentDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `smsOptIn` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `messengerOptIn` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `customerGroup` varchar(50) DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `users` ADD `lifetimeValue` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalOrders` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `averageOrderValue` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `firstPurchaseDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `lastPurchaseDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `referralSource` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `utmSource` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `utmMedium` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `utmCampaign` varchar(255);