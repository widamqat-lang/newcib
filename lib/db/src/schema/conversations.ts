import { pgTable, text, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// جدول المحادثات
export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  clientSessionId: text("client_session_id").notNull(),
  status: text("status").notNull().default("pending"), // pending | active | closed
  agentConnectedAt: timestamp("agent_connected_at", { withTimezone: true }),
  clientOnlineAt: timestamp("client_online_at", { withTimezone: true }), // آخر ظهور للعميل
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
  senderId: text("sender_id"), // agent ID if senderType is agent
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
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

export type Conversation = typeof conversationsTable.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messagesTable.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
