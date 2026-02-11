import { pgTable, serial, integer, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const applicationStatus = [
	'applied',
	'screening',
	'interview',
	'offer',
	'hired',
	'rejected',
	'withdrawn'
] as const;
export type ApplicationStatus = (typeof applicationStatus)[number];

export const employeeStatus = [
	'onboarding',
	'active',
	'inactive',
	'terminated',
	'resigned'
] as const;
export type EmployeeStatus = (typeof employeeStatus)[number];

export const role = [
	'admin',
	'leadership',
	'talentManagement',
	'hiringManager',
	'manager',
	'employee',
	'applicant'
] as const;
export type Role = (typeof role)[number];

export const applicants = pgTable('applicant', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	status: text('status', { enum: applicationStatus }).notNull().default('applied'),
	resumeUrl: text('resume_url'),
	notes: text('notes'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const employees = pgTable('employee', {
	id: serial('id').primaryKey(),
	userId: text('user_id').references(() => user.id),
	personalEmail: text('personal_email').notNull().unique(),
	workEmail: text('work_email').unique(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	status: text('status', { enum: employeeStatus }).notNull().default('onboarding'),
	role: text('role', { enum: role }).notNull().default('employee'),
	department: text('department'),
	position: text('position'),
	applicantId: integer('applicant_id').references(() => applicants.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const documentType = ['resume', 'contract', 'id_proof', 'other'] as const;
export type DocumentType = (typeof documentType)[number];

export const entityType = ['applicant', 'employee'] as const;
export type EntityType = (typeof entityType)[number];

export const documents = pgTable('document', {
	id: serial('id').primaryKey(),
	entityType: text('entity_type', { enum: entityType }).notNull(),
	entityId: integer('entity_id').notNull(),
	name: text('name').notNull(),
	type: text('type', { enum: documentType }).notNull().default('other'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const documentVersions = pgTable('document_version', {
	id: serial('id').primaryKey(),
	documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
	version: integer('version').notNull(),
	branch: text('branch').notNull().default('main'),
	url: text('url').notNull(),
	storagePath: text('storage_path').notNull(),
	storageProvider: text('storage_provider').notNull(), // 'local' | 'vercel-blob'
	mimeType: text('mime_type'),
	size: integer('size'),
	uploadedBy: text('uploaded_by').references(() => user.id),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const entryStatus = ['pending', 'approved', 'rejected'] as const;
export type EntryStatus = (typeof entryStatus)[number];

export const timeEntries = pgTable('time_entry', {
	id: serial('id').primaryKey(),
	employeeId: integer('employee_id').references(() => employees.id).notNull(),
	date: timestamp('date').notNull(),
	startTime: timestamp('start_time').notNull(),
	endTime: timestamp('end_time'),
	breakDuration: integer('break_duration').default(0), // in minutes
	status: text('status', { enum: entryStatus }).notNull().default('pending'),
	notes: text('notes'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const absenceType = ['vacation', 'sick', 'other'] as const;
export type AbsenceType = (typeof absenceType)[number];

export const absenceRequests = pgTable('absence_request', {
	id: serial('id').primaryKey(),
	employeeId: integer('employee_id').references(() => employees.id).notNull(),
	startDate: timestamp('start_date').notNull(),
	endDate: timestamp('end_date').notNull(),
	type: text('type', { enum: absenceType }).notNull(),
	reason: text('reason'),
	status: text('status', { enum: entryStatus }).notNull().default('pending'),
	reviewerNote: text('reviewer_note'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const notificationType = ['info', 'warning', 'success', 'error'] as const;
export type NotificationType = (typeof notificationType)[number];

export const notifications = pgTable('notification', {
	id: serial('id').primaryKey(),
	userId: text('user_id').references(() => user.id).notNull(),
	message: text('message').notNull(),
	type: text('type', { enum: notificationType }).notNull().default('info'),
	read: boolean('read').notNull().default(false),
	// actually let's use boolean if supported or stick to safe defaults. Schema generally uses what drives database.
	// user table uses text for id.
	relatedEntityType: text('related_entity_type'), // 'time_entry', 'absence_request'
	relatedEntityId: integer('related_entity_id'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});



export * from './auth-schema';
