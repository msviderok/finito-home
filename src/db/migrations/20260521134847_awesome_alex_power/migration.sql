ALTER TABLE `rates` ADD `previous_rate_id` integer REFERENCES rates(id);--> statement-breakpoint
CREATE UNIQUE INDEX `employee_category` ON `rates` (`employee_id`,`payment_category_id`);