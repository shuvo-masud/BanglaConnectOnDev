import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"),
  bio: text("bio"),
  country: text("country").notNull().default(""),
  city: text("city"),
  skills: text("skills").array().notNull().default([]),
  interests: text("interests").array().notNull().default([]),
  professionalField: text("professional_field"),
  profession: text("profession"),
  specialties: text("specialties").array().notNull().default([]),
  mentorAvailable: boolean("mentor_available").notNull().default(false),
  mentorStatus: text("mentor_status").notNull().default("approved"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
