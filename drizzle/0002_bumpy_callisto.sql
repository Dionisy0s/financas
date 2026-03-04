CREATE TABLE `recurring_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` varchar(500) NOT NULL,
	`paymentMethod` enum('pix','credit','debit','cash','boleto') NOT NULL,
	`expenseType` enum('fixed','variable') NOT NULL DEFAULT 'fixed',
	`dayOfMonth` int NOT NULL,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastGeneratedYear` int,
	`lastGeneratedMonth` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurring_transactions_id` PRIMARY KEY(`id`)
);
