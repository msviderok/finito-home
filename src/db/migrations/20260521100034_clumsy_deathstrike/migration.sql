CREATE TABLE `payslip_line_items` (
	`id` integer PRIMARY KEY,
	`payslip_id` integer NOT NULL,
	`rate_id` integer NOT NULL,
	`units` numeric NOT NULL,
	`payment_date` integer NOT NULL,
	`total_amount_cents` integer NOT NULL,
	`created_at` integer NOT NULL,
	`created_by_id` integer NOT NULL,
	CONSTRAINT `fk_payslip_line_items_payslip_id_payslips_id_fk` FOREIGN KEY (`payslip_id`) REFERENCES `payslips`(`id`),
	CONSTRAINT `fk_payslip_line_items_rate_id_rates_id_fk` FOREIGN KEY (`rate_id`) REFERENCES `rates`(`id`),
	CONSTRAINT `fk_payslip_line_items_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
ALTER TABLE `rates` RENAME COLUMN `value` TO `amount_cents`;--> statement-breakpoint
ALTER TABLE `payslips` ADD `payment_date` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `created_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `payslips` ADD `created_by_id` integer NOT NULL REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `rates` ADD `employee_id` integer NOT NULL REFERENCES employees(id);--> statement-breakpoint
ALTER TABLE `rates` ADD `effective_from` integer NOT NULL;