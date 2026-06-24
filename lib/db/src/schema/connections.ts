import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

export const connectionsTable = pgTable("connections", {
  id: serial("id").primaryKey(),
  fromProfileId: integer("from_profile_id")
    .notNull()
    .references(() => profilesTable.id),
  toProfileId: integer("to_profile_id")
    .notNull()
    .references(() => profilesTable.id),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConnectionSchema = createInsertSchema(connectionsTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connectionsTable.$inferSelect;
