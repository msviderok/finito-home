PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `payslip_line_items_new` (
	`id` integer PRIMARY KEY,
	`payslip_id` integer NOT NULL,
	`payment_category_id` integer NOT NULL,
	`units` numeric NOT NULL,
	`payment_date` integer NOT NULL,
	`created_at` integer NOT NULL,
	`created_by_id` integer NOT NULL,
	CONSTRAINT `fk_payslip_line_items_payslip_id_payslips_id_fk` FOREIGN KEY (`payslip_id`) REFERENCES `payslips`(`id`),
	CONSTRAINT `fk_payslip_line_items_payment_category_id_payment_categories_id_fk` FOREIGN KEY (`payment_category_id`) REFERENCES `payment_categories`(`id`),
	CONSTRAINT `fk_payslip_line_items_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
);--> statement-breakpoint
INSERT INTO `payslip_line_items_new` (`id`, `payslip_id`, `payment_category_id`, `units`, `payment_date`, `created_at`, `created_by_id`)
SELECT `pli`.`id`, `pli`.`payslip_id`, `r`.`payment_category_id`, `pli`.`units`, `pli`.`payment_date`, `pli`.`created_at`, `pli`.`created_by_id`
FROM `payslip_line_items` `pli`
INNER JOIN `rates` `r` ON `r`.`id` = `pli`.`rate_id`;--> statement-breakpoint
DROP TABLE `payslip_line_items`;--> statement-breakpoint
ALTER TABLE `payslip_line_items_new` RENAME TO `payslip_line_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
