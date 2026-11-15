CREATE TABLE `account` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY,
	`patient_id` text NOT NULL,
	`clinic_id` text NOT NULL,
	`doctor_id` text,
	`scheduled_at` integer NOT NULL,
	`duration_minutes` integer DEFAULT 15 NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`reason` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_appointments_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_appointments_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_appointments_doctor_id_user_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "appointments_status_check" CHECK("status" IN ('scheduled', 'completed', 'cancelled', 'no-show'))
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY,
	`actor_id` text,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_audit_log_actor_id_user_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "audit_log_action_check" CHECK("action" IN ('create', 'update', 'delete', 'view'))
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` text PRIMARY KEY,
	`patient_id` text NOT NULL,
	`issue_date` text NOT NULL,
	`certificate_type` text NOT NULL,
	`title` text NOT NULL,
	`diagnosis` text,
	`body` text NOT NULL,
	`issued_by` text,
	`notes` text,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_certificates_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_certificates_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_certificates_updated_by_user_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `diagnoses` (
	`id` text PRIMARY KEY,
	`visit_id` text NOT NULL,
	`icd_code` text NOT NULL,
	`description` text NOT NULL,
	`type` text DEFAULT 'primary' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_diagnoses_visit_id_visits_id_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE CASCADE,
	CONSTRAINT "diagnoses_type_check" CHECK("type" IN ('primary', 'secondary'))
);
--> statement-breakpoint
CREATE TABLE `drug_formulary` (
	`id` text PRIMARY KEY,
	`generic_name` text NOT NULL,
	`pharmacological_category` text NOT NULL,
	`atc_code` text,
	`aware_classification` text,
	`data` text NOT NULL,
	`source_edition` text DEFAULT 'EDA-2024' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `growth_standards` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`metric` text NOT NULL,
	`gender` text NOT NULL,
	`day` integer NOT NULL,
	`l` real NOT NULL,
	`m` real NOT NULL,
	`s` real NOT NULL,
	`sd4neg` real NOT NULL,
	`sd3neg` real NOT NULL,
	`sd2neg` real NOT NULL,
	`sd1neg` real NOT NULL,
	`sd0` real NOT NULL,
	`sd1` real NOT NULL,
	`sd2` real NOT NULL,
	`sd3` real NOT NULL,
	`sd4` real NOT NULL,
	CONSTRAINT `growth_metric_gender_day_unq` UNIQUE(`metric`,`gender`,`day`),
	CONSTRAINT "growth_metric_check" CHECK("metric" IN ('lhfa', 'wfa')),
	CONSTRAINT "growth_gender_check" CHECK("gender" IN ('boys', 'girls'))
);
--> statement-breakpoint
CREATE TABLE `immunizations` (
	`id` text PRIMARY KEY,
	`patient_id` text NOT NULL,
	`visit_id` text,
	`vaccine_key` text NOT NULL,
	`vaccine_name` text NOT NULL,
	`dose_number` integer DEFAULT 1 NOT NULL,
	`target_age_months` real NOT NULL,
	`status` text DEFAULT 'due' NOT NULL,
	`administered_date` integer,
	`lot_number` text,
	`site` text,
	`administered_by_id` text,
	`adverse_events` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_immunizations_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_immunizations_visit_id_visits_id_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_immunizations_administered_by_id_user_id_fk` FOREIGN KEY (`administered_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `lms_references` (
	`indicator` text NOT NULL,
	`sex` text NOT NULL,
	`x_axis` text NOT NULL,
	`x_value` real NOT NULL,
	`l` real NOT NULL,
	`m` real NOT NULL,
	`s` real NOT NULL,
	`version` text DEFAULT 'egyptian-2021' NOT NULL,
	`sd3neg` real,
	`sd2neg` real,
	`sd1neg` real,
	`sd0` real,
	`sd1` real,
	`sd2` real,
	`sd3` real,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `lms_references_pkey` PRIMARY KEY(`indicator`, `sex`, `x_axis`, `x_value`, `version`),
	CONSTRAINT "lms_references_indicator_check" CHECK("indicator" IN ('weight-for-age', 'length-for-age', 'weight-for-length', 'bmi-for-age', 'head-circumference-for-age')),
	CONSTRAINT "lms_references_sex_check" CHECK("sex" IN ('male', 'female')),
	CONSTRAINT "lms_references_xaxis_check" CHECK("x_axis" IN ('age', 'length'))
);
--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` text PRIMARY KEY,
	`visit_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`measured_at` integer NOT NULL,
	`indicator` text NOT NULL,
	`value` real NOT NULL,
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
	CONSTRAINT "measurements_indicator_check" CHECK("indicator" IN ('weight-for-age', 'length-for-age', 'weight-for-length', 'bmi-for-age', 'head-circumference-for-age'))
);
--> statement-breakpoint
CREATE TABLE `medical_notes` (
	`id` text PRIMARY KEY,
	`patient_id` text NOT NULL,
	`visit_id` text,
	`author_id` text,
	`title` text NOT NULL,
	`body` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_medical_notes_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_medical_notes_visit_id_visits_id_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_medical_notes_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `milestone_catalog` (
	`id` text PRIMARY KEY,
	`label` text NOT NULL,
	`arabic_label` text,
	`domain` text NOT NULL,
	`expected_age_months` integer NOT NULL,
	`age_label` text NOT NULL,
	`red_flag_warning` text,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` text PRIMARY KEY,
	`patient_id` text NOT NULL,
	`milestone_id` text NOT NULL,
	`is_achieved` integer DEFAULT false NOT NULL,
	`achieved_date` text,
	`notes` text,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_milestones_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_milestones_milestone_id_milestone_catalog_id_fk` FOREIGN KEY (`milestone_id`) REFERENCES `milestone_catalog`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_milestones_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_milestones_updated_by_user_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `milestones_patient_milestone_unq` UNIQUE(`patient_id`,`milestone_id`)
);
--> statement-breakpoint
CREATE TABLE `neonatal_formulary` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`generic_name` text NOT NULL,
	`category` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY,
	`clinic_id` text,
	`provider_id` text,
	`mrn` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`sex` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`phone` text,
	`address` text,
	`allergies` text,
	`gestational_age_weeks` real,
	`birth_weight_kg` real,
	`birth_length_cm` real,
	`birth_head_circumference_cm` real,
	`parent_name` text,
	`parent_phone` text,
	`notes` text,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_patients_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_patients_provider_id_user_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_patients_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_patients_updated_by_user_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `patients_clinic_mrn_unq` UNIQUE(`clinic_id`,`mrn`),
	CONSTRAINT "patients_sex_check" CHECK("sex" IN ('male', 'female'))
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY,
	`visit_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`prescribed_by_id` text,
	`medication_name` text NOT NULL,
	`dosage` text NOT NULL,
	`frequency` text NOT NULL,
	`duration_days` integer,
	`instructions` text,
	`prescribed_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_prescriptions_visit_id_visits_id_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_prescriptions_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_prescriptions_prescribed_by_id_user_id_fk` FOREIGN KEY (`prescribed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY,
	`key` text NOT NULL UNIQUE,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`role` text DEFAULT 'patient' NOT NULL,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`address` text,
	`api_key` text,
	`clinic_id` text,
	`phone` text
);
--> statement-breakpoint
CREATE TABLE `vaccinations` (
	`id` text PRIMARY KEY,
	`patient_id` text NOT NULL,
	`visit_id` text,
	`vaccine_id` text NOT NULL,
	`status` text DEFAULT 'due' NOT NULL,
	`administered_date` text,
	`due_date` text,
	`batch_number` text,
	`administered_by` text,
	`facility` text,
	`adverse_reactions` text,
	`notes` text,
	`created_by` text,
	`updated_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_vaccinations_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_vaccinations_visit_id_visits_id_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_vaccinations_vaccine_id_vaccine_catalog_id_fk` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccine_catalog`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_vaccinations_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_vaccinations_updated_by_user_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `vaccinations_patient_vaccine_unq` UNIQUE(`patient_id`,`vaccine_id`),
	CONSTRAINT "vaccinations_status_check" CHECK("status" IN ('due', 'scheduled', 'completed', 'missed', 'refused', 'contraindicated'))
);
--> statement-breakpoint
CREATE TABLE `vaccine_catalog` (
	`id` text PRIMARY KEY,
	`label` text NOT NULL,
	`arabic_label` text,
	`disease` text NOT NULL,
	`recommended_age_months` integer NOT NULL,
	`recommended_age_label` text NOT NULL,
	`schedule` text DEFAULT 'egypt-moh' NOT NULL,
	`is_mandatory_moh` integer DEFAULT true NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY,
	`patient_id` text NOT NULL,
	`clinic_id` text NOT NULL,
	`appointment_id` text,
	`doctor_id` text,
	`visited_at` integer NOT NULL,
	`age_months` real NOT NULL,
	`age_years` integer,
	`age_months_remainder` integer,
	`chief_complaint` text,
	`diagnosis` text,
	`symptoms` text,
	`physical_exam` text,
	`plan` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_visits_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_visits_clinic_id_clinics_id_fk` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_visits_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_visits_doctor_id_user_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `appointments_patient_idx` ON `appointments` (`patient_id`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `appointments_clinic_idx` ON `appointments` (`clinic_id`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `appointments_doctor_idx` ON `appointments` (`doctor_id`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `appointments_status_idx` ON `appointments` (`status`);--> statement-breakpoint
CREATE INDEX `audit_log_entity_idx` ON `audit_log` (`entity`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_log_actor_idx` ON `audit_log` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_log_action_idx` ON `audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `certificates_patient_idx` ON `certificates` (`patient_id`);--> statement-breakpoint
CREATE INDEX `certificates_date_idx` ON `certificates` (`issue_date`);--> statement-breakpoint
CREATE INDEX `diagnoses_visit_idx` ON `diagnoses` (`visit_id`);--> statement-breakpoint
CREATE INDEX `diagnoses_icd_idx` ON `diagnoses` (`icd_code`);--> statement-breakpoint
CREATE INDEX `drug_formulary_generic_idx` ON `drug_formulary` (`generic_name`);--> statement-breakpoint
CREATE INDEX `drug_formulary_category_idx` ON `drug_formulary` (`pharmacological_category`);--> statement-breakpoint
CREATE INDEX `growth_lookup_idx` ON `growth_standards` (`metric`,`gender`,`day`);--> statement-breakpoint
CREATE INDEX `immunizations_patient_idx` ON `immunizations` (`patient_id`,`target_age_months`);--> statement-breakpoint
CREATE INDEX `immunizations_status_idx` ON `immunizations` (`status`);--> statement-breakpoint
CREATE INDEX `lms_references_lookup_idx` ON `lms_references` (`indicator`,`sex`,`x_axis`,`version`,`x_value`);--> statement-breakpoint
CREATE INDEX `measurements_visit_idx` ON `measurements` (`visit_id`);--> statement-breakpoint
CREATE INDEX `measurements_indicator_idx` ON `measurements` (`indicator`);--> statement-breakpoint
CREATE INDEX `measurements_patient_date_idx` ON `measurements` (`patient_id`,`measured_at`);--> statement-breakpoint
CREATE INDEX `medical_notes_patient_idx` ON `medical_notes` (`patient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `medical_notes_visit_idx` ON `medical_notes` (`visit_id`);--> statement-breakpoint
CREATE INDEX `milestones_patient_idx` ON `milestones` (`patient_id`);--> statement-breakpoint
CREATE INDEX `neonatal_formulary_category_idx` ON `neonatal_formulary` (`category`);--> statement-breakpoint
CREATE INDEX `neonatal_formulary_generic_idx` ON `neonatal_formulary` (`generic_name`);--> statement-breakpoint
CREATE INDEX `patients_provider_idx` ON `patients` (`provider_id`);--> statement-breakpoint
CREATE INDEX `patients_clinic_idx` ON `patients` (`clinic_id`);--> statement-breakpoint
CREATE INDEX `patients_name_idx` ON `patients` (`last_name`,`first_name`);--> statement-breakpoint
CREATE INDEX `patients_dob_idx` ON `patients` (`date_of_birth`);--> statement-breakpoint
CREATE UNIQUE INDEX `patients_clinic_mrn_idx` ON `patients` (`clinic_id`,`mrn`);--> statement-breakpoint
CREATE INDEX `patients_active_idx` ON `patients` (`provider_id`,`created_at`,`id`) WHERE "patients"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `prescriptions_visit_idx` ON `prescriptions` (`visit_id`);--> statement-breakpoint
CREATE INDEX `prescriptions_patient_idx` ON `prescriptions` (`patient_id`);--> statement-breakpoint
CREATE INDEX `prescriptions_date_idx` ON `prescriptions` (`prescribed_at`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `vaccinations_patient_idx` ON `vaccinations` (`patient_id`);--> statement-breakpoint
CREATE INDEX `vaccinations_visit_idx` ON `vaccinations` (`visit_id`);--> statement-breakpoint
CREATE INDEX `vaccinations_status_idx` ON `vaccinations` (`status`);--> statement-breakpoint
CREATE INDEX `vaccinations_due_idx` ON `vaccinations` (`due_date`,`status`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `visits_patient_idx` ON `visits` (`patient_id`,`visited_at`);--> statement-breakpoint
CREATE INDEX `visits_clinic_idx` ON `visits` (`clinic_id`,`visited_at`);--> statement-breakpoint
CREATE INDEX `visits_doctor_idx` ON `visits` (`doctor_id`,`visited_at`);