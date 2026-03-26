CREATE TABLE `activityLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bannerSlides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` text,
	`imageUrl` text NOT NULL,
	`mobileImageUrl` text,
	`ctaText` varchar(100),
	`ctaLink` varchar(500),
	`textColor` varchar(20) DEFAULT '#FFFFFF',
	`overlayOpacity` int NOT NULL DEFAULT 40,
	`sortOrder` int NOT NULL DEFAULT 0,
	`startDate` timestamp,
	`endDate` timestamp,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bannerSlides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`channels` varchar(100) NOT NULL,
	`audienceSegment` varchar(100) NOT NULL,
	`emailTemplateId` int,
	`whatsappTemplateKey` varchar(100),
	`messengerContent` text,
	`status` enum('draft','scheduled','sending','sent','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`recipientCount` int NOT NULL DEFAULT 0,
	`sentCount` int NOT NULL DEFAULT 0,
	`openedCount` int NOT NULL DEFAULT 0,
	`clickedCount` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageKey` varchar(100) NOT NULL,
	`blockType` varchar(50) NOT NULL,
	`title` varchar(255),
	`content` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentBlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientId` int,
	`templateKey` varchar(100) NOT NULL,
	`variables` text,
	`priority` enum('high','normal','low') NOT NULL DEFAULT 'normal',
	`status` enum('queued','sending','sent','failed') NOT NULL DEFAULT 'queued',
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`scheduledAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`htmlBody` text NOT NULL,
	`textBody` text,
	`category` enum('transactional','marketing','system') NOT NULL DEFAULT 'transactional',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailTemplates_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `mediaLibrary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` text NOT NULL,
	`url` text NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`width` int,
	`height` int,
	`altText` varchar(500),
	`tags` text,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaLibrary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel` enum('email','whatsapp','messenger') NOT NULL,
	`recipientId` int,
	`recipientContact` varchar(320) NOT NULL,
	`templateKey` varchar(100),
	`subject` varchar(500),
	`status` enum('queued','sent','delivered','read','failed','bounced') NOT NULL DEFAULT 'queued',
	`campaignId` int,
	`metadata` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `navigationItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location` enum('header','footer','mobile') NOT NULL,
	`label` varchar(100) NOT NULL,
	`url` varchar(500) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`parentId` int,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `navigationItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`previousStatus` varchar(50) NOT NULL,
	`newStatus` varchar(50) NOT NULL,
	`changedBy` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`type` enum('percentage','fixed','free_shipping') NOT NULL,
	`value` int NOT NULL,
	`minOrderAmount` int,
	`maxUsage` int,
	`usageCount` int NOT NULL DEFAULT 0,
	`perCustomerLimit` int,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `redirects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromPath` varchar(500) NOT NULL,
	`toPath` varchar(500) NOT NULL,
	`type` enum('301','302') NOT NULL DEFAULT '301',
	`active` boolean NOT NULL DEFAULT true,
	`hitCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `redirects_id` PRIMARY KEY(`id`),
	CONSTRAINT `redirects_fromPath_unique` UNIQUE(`fromPath`)
);
--> statement-breakpoint
CREATE TABLE `seoMeta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageType` enum('product','category','page','global') NOT NULL,
	`entityId` int,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`focusKeyword` varchar(255),
	`ogTitle` varchar(255),
	`ogDescription` text,
	`ogImage` text,
	`noIndex` boolean NOT NULL DEFAULT false,
	`canonicalUrl` varchar(500),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seoMeta_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shippingZones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`states` text,
	`flatRate` int NOT NULL,
	`freeShippingThreshold` int,
	`estimatedDays` varchar(50),
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `shippingZones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `staticPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`published` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staticPages_id` PRIMARY KEY(`id`),
	CONSTRAINT `staticPages_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `contentPosts` MODIFY COLUMN `category` enum('style','care','lifestyle','guides','news') NOT NULL DEFAULT 'style';--> statement-breakpoint
ALTER TABLE `categories` ADD `metaTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `categories` ADD `metaDescription` text;--> statement-breakpoint
ALTER TABLE `contentPosts` ADD `metaTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `contentPosts` ADD `metaDescription` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingCost` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingMethod` varchar(50) DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE `orders` ADD `trackingNumber` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `trackingUrl` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `refundedAmount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `products` ADD `compareAtPrice` int;--> statement-breakpoint
ALTER TABLE `products` ADD `sku` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `weight` int;--> statement-breakpoint
ALTER TABLE `products` ADD `metaTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `metaDescription` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `emailOptIn` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `whatsappOptIn` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `messengerPsid` varchar(255);