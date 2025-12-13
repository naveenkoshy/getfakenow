ALTER TABLE `orders` MODIFY COLUMN `shippingAddress` text NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingEmail` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingPhone` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingCity` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingState` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingPostalCode` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingCountry` varchar(100) DEFAULT 'Malaysia' NOT NULL;