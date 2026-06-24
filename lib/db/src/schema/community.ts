import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const blogsTable = pgTable("blogs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImageUrl: text("cover_image_url"),
  tags: text("tags").array().notNull().default([]),
  authorId: integer("author_id")
    .notNull()
    .references(() => profilesTable.id),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const newsTable = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content"),
  externalUrl: text("external_url"),
  coverImageUrl: text("cover_image_url"),
  source: text("source"),
  tags: text("tags").array().notNull().default([]),
  authorId: integer("author_id").references(() => profilesTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  jobType: text("job_type").notNull().default("full-time"),
  workMode: text("work_mode").notNull().default("onsite"),
  description: text("description").notNull(),
  applyUrl: text("apply_url"),
  salary: text("salary"),
  tags: text("tags").array().notNull().default([]),
  postedById: integer("posted_by_id").references(() => profilesTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"),
  eventDate: timestamp("event_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  isVirtual: boolean("is_virtual").notNull().default(false),
  isLive: boolean("is_live").notNull().default(false),
  streamUrl: text("stream_url"),
  registrationUrl: text("registration_url"),
  coverImageUrl: text("cover_image_url"),
  tags: text("tags").array().notNull().default([]),
  organizerId: integer("organizer_id").references(() => profilesTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eventRsvpsTable = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => eventsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vaultItemsTable = pgTable("vault_items", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  visibility: text("visibility").notNull().default("private"),
  coverImageUrl: text("cover_image_url"),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant1Id: integer("participant1_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  participant2Id: integer("participant2_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversationsTable.id, { onDelete: "cascade" }),
  senderId: integer("sender_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Blog = typeof blogsTable.$inferSelect;
export type News = typeof newsTable.$inferSelect;
export type Job = typeof jobsTable.$inferSelect;
export type Event = typeof eventsTable.$inferSelect;
export type EventRsvp = typeof eventRsvpsTable.$inferSelect;
export type VaultItem = typeof vaultItemsTable.$inferSelect;
export type SupportTicket = typeof supportTicketsTable.$inferSelect;
export type Conversation = typeof conversationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
