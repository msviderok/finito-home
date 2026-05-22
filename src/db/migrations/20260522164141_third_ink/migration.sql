ALTER TABLE `payslip_line_items` ADD `create_at_amount_cents` integer;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_rates` (
	`id` integer PRIMARY KEY,
	`amount_cents` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`payment_category_id` integer NOT NULL,
	`effective_from` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_rates_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`),
	CONSTRAINT `fk_rates_payment_category_id_payment_categories_id_fk` FOREIGN KEY (`payment_category_id`) REFERENCES `payment_categories`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_rates`(`id`, `amount_cents`, `employee_id`, `payment_category_id`, `effective_from`, `created_at`) SELECT `id`, `amount_cents`, `employee_id`, `payment_category_id`, `effective_from`, `created_at` FROM `rates`;--> statement-breakpoint
DROP TABLE `rates`;--> statement-breakpoint
ALTER TABLE `__new_rates` RENAME TO `rates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;