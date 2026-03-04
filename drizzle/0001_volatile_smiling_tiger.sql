CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(100) NOT NULL,
	`icon` varchar(50) DEFAULT 'tag',
	`color` varchar(20) DEFAULT '#6366f1',
	`type` enum('income','expense','both') NOT NULL DEFAULT 'both',
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`invitedByUserId` int NOT NULL,
	`inviteCode` varchar(64) NOT NULL,
	`email` varchar(320),
	`status` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `family_invites_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `family_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investment_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(100) NOT NULL,
	`icon` varchar(50) DEFAULT 'trending-up',
	`color` varchar(20) DEFAULT '#10b981',
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investment_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investment_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`targetAmount` decimal(15,2) NOT NULL,
	`period` enum('monthly','annual') NOT NULL DEFAULT 'monthly',
	`year` int NOT NULL,
	`month` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investment_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`investmentDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` varchar(500) NOT NULL,
	`paymentMethod` enum('pix','credit','debit','cash','boleto') NOT NULL,
	`expenseType` enum('fixed','variable') NOT NULL DEFAULT 'variable',
	`transactionDate` date NOT NULL,
	`notes` text,
	`installmentGroupId` varchar(64),
	`installmentNumber` int,
	`totalInstallments` int,
	`isInstallment` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertThresholdPercent` int DEFAULT 80,
	`monthlyIncomeEstimate` decimal(15,2),
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_userId_unique` UNIQUE(`userId`)
);
