CREATE TABLE `employees` (
	`id` integer PRIMARY KEY,
	`name` text NOT NULL,
	`birthday` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_categories` (
	`id` integer PRIMARY KEY,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payslips` (
	`id` integer PRIMARY KEY,
	`employee_id` integer NOT NULL,
	CONSTRAINT `fk_payslips_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`)
);
--> statement-breakpoint
CREATE TABLE `rates` (
	`id` integer PRIMARY KEY,
	`value` integer NOT NULL,
	`created_at` integer NOT NULL,
	`payment_category_id` integer NOT NULL,
	CONSTRAINT `fk_rates_payment_category_id_payment_categories_id_fk` FOREIGN KEY (`payment_category_id`) REFERENCES `payment_categories`(`id`)
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE
);
--> statement-breakpoint
INSERT INTO `__new_users`(`id`, `name`, `email`) SELECT `id`, `name`, `email` FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `users_email_unique`;