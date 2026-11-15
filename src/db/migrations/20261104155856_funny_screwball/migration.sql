ALTER TABLE `measurements` ADD `length_cm_at_measurement` real;--> statement-breakpoint
ALTER TABLE `patients` ADD `weight_kg` real;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `status_changed_at` integer;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_measurements` (
	`id` text PRIMARY KEY,
	`visit_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`measured_at` integer NOT NULL,
	`indicator` text NOT NULL,
	`value` real NOT NULL,
	`length_cm_at_measurement` real,
	`z_score` real,
	`percentile` real,
	`classification` text,
	`lms_l` real,
	`lms_m` real,
	`lms_s` real,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_measurements_visit_id_visits_id_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_measurements_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `measurements_visit_indicator_unq` UNIQUE(`visit_id`,`indicator`),
	CONSTRAINT "measurements_indicator_check" CHECK("indicator" IN ('weight-for-age', 'length-for-age', 'weight-for-length', 'bmi-for-age', 'head-circumference-for-age')),
	CONSTRAINT "measurements_wfl_requires_length" CHECK("indicator" <> 'weight-for-length' OR "length_cm_at_measurement" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_measurements`(`id`, `visit_id`, `patient_id`, `measured_at`, `indicator`, `value`, `z_score`, `percentile`, `classification`, `lms_l`, `lms_m`, `lms_s`, `created_at`, `updated_at`) SELECT `id`, `visit_id`, `patient_id`, `measured_at`, `indicator`, `value`, `z_score`, `percentile`, `classification`, `lms_l`, `lms_m`, `lms_s`, `created_at`, `updated_at` FROM `measurements`;--> statement-breakpoint
DROP TABLE `measurements`;--> statement-breakpoint
ALTER TABLE `__new_measurements` RENAME TO `measurements`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_prescriptions` (
	`id` text PRIMARY KEY,
	`visit_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`prescribed_by_id` text,
	`medication_name` text NOT NULL,
	`dosage` text NOT NULL,
	`frequency` text NOT NULL,
	`duration_days` integer,
	`instructions` text,
	`status` text DEFAULT 'active' NOT NULL,
	`status_changed_at` integer,
	`prescribed_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_prescriptions_visit_id_visits_id_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_prescriptions_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_prescriptions_prescribed_by_id_user_id_fk` FOREIGN KEY (`prescribed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "prescriptions_status_check" CHECK("status" IN ('active', 'completed', 'cancelled'))
);
--> statement-breakpoint
INSERT INTO `__new_prescriptions`(`id`, `visit_id`, `patient_id`, `prescribed_by_id`, `medication_name`, `dosage`, `frequency`, `duration_days`, `instructions`, `prescribed_at`, `created_at`, `updated_at`) SELECT `id`, `visit_id`, `patient_id`, `prescribed_by_id`, `medication_name`, `dosage`, `frequency`, `duration_days`, `instructions`, `prescribed_at`, `created_at`, `updated_at` FROM `prescriptions`;--> statement-breakpoint
DROP TABLE `prescriptions`;--> statement-breakpoint
ALTER TABLE `__new_prescriptions` RENAME TO `prescriptions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `measurements_visit_idx` ON `measurements` (`visit_id`);--> statement-breakpoint
CREATE INDEX `measurements_indicator_idx` ON `measurements` (`indicator`);--> statement-breakpoint
CREATE INDEX `measurements_patient_date_idx` ON `measurements` (`patient_id`,`measured_at`);--> statement-breakpoint
CREATE INDEX `prescriptions_visit_idx` ON `prescriptions` (`visit_id`);--> statement-breakpoint
CREATE INDEX `prescriptions_patient_idx` ON `prescriptions` (`patient_id`);--> statement-breakpoint
CREATE INDEX `prescriptions_date_idx` ON `prescriptions` (`prescribed_at`);--> statement-breakpoint
CREATE INDEX `prescriptions_patient_status_idx` ON `prescriptions` (`patient_id`,`status`);