CREATE TABLE `guardian_links` (
	`user_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`relation` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `guardian_links_pk` PRIMARY KEY(`user_id`, `patient_id`),
	CONSTRAINT `fk_guardian_links_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_guardian_links_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `idempotency` (
	`id` text PRIMARY KEY,
	`request_hash` text NOT NULL UNIQUE,
	`key` text NOT NULL UNIQUE,
	`result` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `guardian_links_patient_id_idx` ON `guardian_links` (`patient_id`);