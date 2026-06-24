import { pgTable, foreignKey, serial, integer, text, timestamp, unique, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const connections = pgTable("connections", {
	id: serial().primaryKey().notNull(),
	fromProfileId: integer("from_profile_id").notNull(),
	toProfileId: integer("to_profile_id").notNull(),
	status: text().default('pending').notNull(),
	message: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.fromProfileId],
			foreignColumns: [profiles.id],
			name: "connections_from_profile_id_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.toProfileId],
			foreignColumns: [profiles.id],
			name: "connections_to_profile_id_profiles_id_fk"
		}),
]);

export const profiles = pgTable("profiles", {
	id: serial().primaryKey().notNull(),
	clerkId: text("clerk_id").notNull(),
	fullName: text("full_name").notNull(),
	role: text().default('student').notNull(),
	bio: text(),
	country: text().default(').notNull(),
	city: text(),
	skills: text().array().default([""]).notNull(),
	interests: text().array().default([""]).notNull(),
	professionalField: text("professional_field"),
	profession: text(),
	specialties: text().array().default([""]).notNull(),
	mentorAvailable: boolean("mentor_available").default(false).notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	mentorStatus: text("mentor_status").default('approved').notNull(),
}, (table) => [
	unique("profiles_clerk_id_unique").on(table.clerkId),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().default('general').notNull(),
	eventDate: timestamp("event_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	location: text(),
	isVirtual: boolean("is_virtual").default(false).notNull(),
	registrationUrl: text("registration_url"),
	coverImageUrl: text("cover_image_url"),
	tags: text().array().default([""]).notNull(),
	organizerId: integer("organizer_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isLive: boolean("is_live").default(false).notNull(),
	streamUrl: text("stream_url"),
}, (table) => [
	foreignKey({
			columns: [table.organizerId],
			foreignColumns: [profiles.id],
			name: "events_organizer_id_profiles_id_fk"
		}),
]);

export const jobs = pgTable("jobs", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	company: text().notNull(),
	location: text().notNull(),
	jobType: text("job_type").default('full-time').notNull(),
	workMode: text("work_mode").default('onsite').notNull(),
	description: text().notNull(),
	applyUrl: text("apply_url"),
	salary: text(),
	tags: text().array().default([""]).notNull(),
	postedById: integer("posted_by_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.postedById],
			foreignColumns: [profiles.id],
			name: "jobs_posted_by_id_profiles_id_fk"
		}),
]);

export const blogs = pgTable("blogs", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	excerpt: text(),
	coverImageUrl: text("cover_image_url"),
	tags: text().array().default([""]).notNull(),
	authorId: integer("author_id").notNull(),
	published: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "blogs_author_id_profiles_id_fk"
		}),
]);

export const news = pgTable("news", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	summary: text().notNull(),
	content: text(),
	externalUrl: text("external_url"),
	coverImageUrl: text("cover_image_url"),
	source: text(),
	tags: text().array().default([""]).notNull(),
	authorId: integer("author_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "news_author_id_profiles_id_fk"
		}),
]);

export const conversations = pgTable("conversations", {
	id: serial().primaryKey().notNull(),
	participant1Id: integer("participant1_id").notNull(),
	participant2Id: integer("participant2_id").notNull(),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.participant1Id],
			foreignColumns: [profiles.id],
			name: "conversations_participant1_id_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.participant2Id],
			foreignColumns: [profiles.id],
			name: "conversations_participant2_id_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const eventRsvps = pgTable("event_rsvps", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_rsvps_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "event_rsvps_user_id_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	conversationId: integer("conversation_id").notNull(),
	senderId: integer("sender_id").notNull(),
	content: text().notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_conversations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [profiles.id],
			name: "messages_sender_id_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const supportTickets = pgTable("support_tickets", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	subject: text().notNull(),
	description: text().notNull(),
	status: text().default('open').notNull(),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "support_tickets_user_id_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const vaultItems = pgTable("vault_items", {
	id: serial().primaryKey().notNull(),
	ownerId: integer("owner_id").notNull(),
	title: text().notNull(),
	description: text(),
	content: text(),
	visibility: text().default('private').notNull(),
	coverImageUrl: text("cover_image_url"),
	fileUrl: text("file_url"),
	fileType: text("file_type"),
	tags: text().array().default([""]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [profiles.id],
			name: "vault_items_owner_id_profiles_id_fk"
		}).onDelete("cascade"),
]);
