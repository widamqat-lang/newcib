import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Append-only history: every time a customer (re)submits data for a stage
// (signup form, account creation, verification code), we record a snapshot
// here so the admin panel can show "السجل" (history) per box/customer.
export const clientStageLogsTable = pgTable("client_stage_logs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  stage: text("stage").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertClientStageLogSchema = createInsertSchema(
  clientStageLogsTable,
).omit({ id: true, createdAt: true });
export type InsertClientStageLog = z.infer<typeof insertClientStageLogSchema>;
export type ClientStageLog = typeof clientStageLogsTable.$inferSelect;
