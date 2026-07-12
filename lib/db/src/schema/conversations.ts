import { pgTable, text, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// جدول المحادثات
export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  clientSessionId: text("client_session_id").notNull(),
  status: text("status").notNull().default("pending"), // pending | active | closed
  agentConnectedAt: timestamp("agent_connected_at", { withTimezone: true }),
  clientOnlineAt: timestamp("client_online_at", { withTimezone: true }),
  messageCount: serial("message_count").notNull().default(0), // عداد الرسائل
  lastSummaryAt: timestamp("last_summary_at", { withTimezone: true }), // آخر تلخيص
  isAgentTransferRequested: boolean("is_agent_transfer_requested").notNull().default(false), // طلب تحويل للموظف
  botActive: boolean("bot_active").notNull().default(true), // حالة الـ bot (نشط/صامت)
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// جدول الرسائل
export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: serial("conversation_id").notNull(),
  senderType: text("sender_type").notNull(), // client | bot | agent
  senderId: text("sender_id"),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// جدول ملخصات المحادثة (للكفاءة)
export const conversationSummariesTable = pgTable("conversation_summaries", {
  id: serial("id").primaryKey(),
  conversationId: serial("conversation_id").notNull(),
  summary: text("summary").notNull(), // ملخص المحادثة
  messageCount: serial("message_count").notNull(), // عدد الرسائل وقت الملخص
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Schemas
export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ 
  id: true, 
  createdAt: true 
});

export const insertConversationSummarySchema = createInsertSchema(conversationSummariesTable).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversationsTable.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messagesTable.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ConversationSummary = typeof conversationSummariesTable.$inferSelect;
export type InsertConversationSummary = z.infer<typeof insertConversationSummarySchema>;
