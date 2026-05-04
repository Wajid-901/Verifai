import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const emailUploadsTable = pgTable("email_uploads", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  totalEmails: integer("total_emails").notNull(),
  validCount: integer("valid_count").notNull(),
  invalidCount: integer("invalid_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EmailUpload = typeof emailUploadsTable.$inferSelect;
export type InsertEmailUpload = typeof emailUploadsTable.$inferInsert;
