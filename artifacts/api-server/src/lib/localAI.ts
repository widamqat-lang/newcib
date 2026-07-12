/**
 * Local AI Core - CIB Prime Smart Assistant
 * نظام ذكاء اصطناعي محلي للرد على استفسارات العملاء
 */

// ============================================
// محتوى الموقع المحلي (Local Content Database)
// ============================================
const SITE_CONTENT = {
  // معلومات عن CIB Prime
  about: {
    title: "CIB Prime - تفعيل الساعات الذكية",
    description: "خدمة مميزة من البنك التجاري الدولي (CIB) لتفعيل الساعات الذكية مجاناً لعملاء CIB المؤهلين",
    features: [
      "ساعات ذكية مجانية بألوان متنوعة",
      "حماية بنكية متقدمة 256-bit",
      "دعم على مدار الساعة 24/7",
      "سحب على سيارة BMW",
      "تمويل مرن للمنازل والسيارات"
    ]
  },

  // الساعات الذكية
  watches: {
    title: "مجموعة الساعات الذكية",
    colors: [
      { id: "purple", name: "بنفسجي", nameAr: "ساعة اورورا البنفسجي" },
      { id: "white", name: "أبيض", nameAr: "ساعة اورورا ابيض" },
      { id: "green", name: "أخضر", nameAr: "ساعة اورورا اخضر" },
      { id: "rosegold", name: "روز جولد", nameAr: "ساعة اورورا المريخي" },
      { id: "black", name: "أسود", nameAr: "ساعة اورورا اسود" },
      { id: "orange", name: "برتقالي", nameAr: "ساعة اورورا البرتقالي" },
      { id: "gold", name: "ذهبي", nameAr: "ساعة اورورا الذهبي" },
      { id: "silver", name: "فضي", nameAr: "ساعة اورورا الفضي" },
      { id: "blue", name: "أزرق", nameAr: "ساعة اورورا الأزرق" }
    ],
    price: "مجاني",
    condition: "متاح لعملاء CIB المؤهلين"
  },

  // خطوات التفعيل
  activationSteps: [
    { step: 1, title: "تسجيل البيانات", description: "أدخل اسمك ورقم الموبايل والرقم القومي" },
    { step: 2, title: "تسجيل الدخول", description: "أدخل بيانات حسابك البنكي" },
    { step: 3, title: "رمز التحقق", description: "استلم رمز التحقق على موبايلك" },
    { step: 4, title: "اختيار الساعة", description: "اختر لون ساعتك المفضل" },
    { step: 5, title: "الموافقة", description: "انتظر موافقة البنك" },
    { step: 6, title: "استلام الساعة", description: "استلم ساعتك من أقرب فرع CIB" }
  ],

  // شروط التفعيل
  eligibility: [
    "أن تكون عميلاً في البنك التجاري الدولي (CIB)",
    "أن يكون لديك حساب بنكي نشط",
    "أن يكون رقم الموبايل مسجلاً لدى البنك",
    "أن يكون الرقم القومي صحيحاً ومسجلاً",
    "عدم وجود قيود على حسابك البنكي"
  ],

  // الأسئلة الشائعة
  faq: {
    "كيف احصل على الساعة": {
      answer: "للحصول على الساعة الذكية مجاناً:\n1️⃣ سجل بياناتك (الاسم، الموبايل، الرقم القومي)\n2️⃣ أدخل بيانات حسابك البنكي\n3️⃣ استلم رمز التحقق\n4️⃣ اختر لون ساعتك\n5️⃣ انتظر موافقة البنك\n6️⃣ استلم ساعتك من أقرب فرع CIB"
    },
    "هل الساعة مجانية": {
      answer: "نعم، الساعة الذكية مجانية بالكامل لعملاء CIB المؤهلين. لا تحتاج لدفع أي مبلغ."
    },
    "كم تستغرق المدة": {
      answer: "بعد اكتمال التسجيل والموافقة، ستتمكن من استلام ساعتك من أقرب فرع CIB خلال عدة أيام عمل."
    },
    "ما هي الالوان": {
      answer: "لدينا 9 ألوان عصرية:\n• بنفسجي • أبيض • أخضر\n• روز جولد • أسود • برتقالي\n• ذهبي • فضي • أزرق\n\nجميعها متاحة مجاناً!"
    },
    "هل يمكنني تغيير اللون": {
      answer: "نعم، يمكنك اختيار اللون المفضل لديك من بين 9 ألوان متاحة عند مرحلة اختيار الساعة."
    },
    "ما هو السحب على سيارة": {
      answer: "خدمة السحب على سيارة من CIB تتيح لك:\n🚗 فرصتك للفوز بسيارة أحلامك\n💰 استخدم بطاقتك الائتمانية\n📈 كل عملية شراء تزيد فرصك\n\nسجل الآن واحصل على فرصتك!"
    },
    "هل يمكنني تمويل سيارة": {
      answer: "نعم، نقدم خدمات تمويل مرنة تشمل:\n• السحب على سيارة أحلامك\n• تمويل المنازل\n• تمويل التعليم\n\nيُرجى زيارة أقرب فرع CIB أو التواصل مع مدير حسابك."
    },
    "ما هو رقم البنك": {
      answer: "للاستفسارات والمساعدة:\n📞 اتصل بنا: 19666\nمتاح على مدار الساعة"
    }
  },

  // كلمات مفتاحية للبحث
  keywords: {
    ساعة: "watches",
    ساعات: "watches",
    مجاني: "watches",
    لون: "watches",
    الوان: "watches",
    تفعيل: "activationSteps",
    تسجيل: "activationSteps",
    حساب: "eligibility",
    تمويل: "about",
    سيارة: "about",
    سحب: "about",
    رقم: "faq"
  }
};

// ============================================
// الكلمات المحفزة الحرجة (طلب تحويل للموظف)
// ============================================
const AGENT_REQUEST_TRIGGERS = [
  "التواصل مع الموظف",
  "بدأ محادثة مع الموظف",
  "اتحدث مع موظف",
  "موظف حقيقي",
  "شخص حقيقي",
  "محامي",
  "الغي المعاملة",
  "إلغاء المعاملة",
  "إلغاء الحساب",
  "فتح حساب جديد",
  "تقديم شكوى"
];

// ============================================
// التحليل الذكي للمحتوى (Local Search Engine)
// ============================================
function searchLocalContent(query: string): { answer: string; source: string } | null {
  const lowerQuery = query.toLowerCase().trim();
  
  // البحث في FAQ
  for (const [key, faq] of Object.entries(SITE_CONTENT.faq)) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      return {
        answer: faq.answer,
        source: `faq:${key}`
      };
    }
  }

  // البحث بواسطة الكلمات المفتاحية
  for (const [keyword, contentKey] of Object.entries(SITE_CONTENT.keywords)) {
    if (lowerQuery.includes(keyword)) {
      const content = SITE_CONTENT[contentKey as keyof typeof SITE_CONTENT];
      if (content && typeof content === 'object') {
        if ('title' in content) {
          return {
            answer: `${content.title}\n\n${(content as any).description || ''}`,
            source: `content:${contentKey}`
          };
        }
      }
    }
  }

  // البحث في الألوان
  if (lowerQuery.includes('لون') || lowerQuery.includes('الوان') || lowerQuery.includes('ساعة')) {
    const colorsList = SITE_CONTENT.watches.colors.map(c => `• ${c.name} (${c.nameAr})`).join('\n');
    return {
      answer: `لدينا ${SITE_CONTENT.watches.colors.length} ألوان عصرية:\n${colorsList}\n\nالساعة مجانية لجميع العملاء المؤهلين!`,
      source: "watches:colors"
    };
  }

  // البحث في خطوات التفعيل
  if (lowerQuery.includes('خطوه') || lowerQuery.includes('خطوات') || lowerQuery.includes('كيف') || lowerQuery.includes('احصل')) {
    const steps = SITE_CONTENT.activationSteps.map(s => 
      `${s.step}️⃣ ${s.title}: ${s.description}`
    ).join('\n');
    return {
      answer: `خطوات الحصول على الساعة الذكية:\n${steps}`,
      source: "activationSteps"
    };
  }

  // البحث في الشروط
  if (lowerQuery.includes('شرط') || lowerQuery.includes('شروط') || lowerQuery.includes('مؤهل') || lowerQuery.includes('استحق')) {
    const eligibility = SITE_CONTENT.eligibility.map(e => `✓ ${e}`).join('\n');
    return {
      answer: `شروط التفعيل:\n${eligibility}`,
      source: "eligibility"
    };
  }

  return null;
}

// ============================================
// فحص طلب الموظف
// ============================================
function checkAgentRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return AGENT_REQUEST_TRIGGERS.some(trigger => lowerMessage.includes(trigger.toLowerCase()));
}

// ============================================
// معالجة الردود الذكية
// ============================================
interface SmartReplyOptions {
  message: string;
  conversationContext?: string;
  clientName?: string;
  isBotActive: boolean;
}

function generateSmartReply(options: SmartReplyOptions): { 
  reply: string; 
  requestAgentTransfer: boolean;
  reactivateBot: boolean;
  context: string;
} {
  const { message, conversationContext, clientName, isBotActive } = options;
  const lowerMessage = message.toLowerCase().trim();

  // 1️⃣ فحص طلب الموظف أولاً
  if (checkAgentRequest(message)) {
    return {
      reply: "✅ تم تسجيل طلبك! سيتم توصيلك بأحد ممثلي خدمة العملاء قريباً.\n\nفي هذه الأثناء، يمكنني مساعدتك في:\n• الاستفسارات العامة\n• خطوات التفعيل\n• معلومات عن الساعات\n\nاضغط على الزر أدناه لبدء المحادثة:",
      requestAgentTransfer: true,
      reactivateBot: false,
      context: "AGENT_REQUEST"
    };
  }

  // 2️⃣ إذا كان الـ bot غير نشط وسؤال جديد → إعادة تفعيل الـ bot
  if (!isBotActive) {
    return {
      reply: `مرحباً بك مجدداً! 😊\n\nأنا مساعدك الذكي وعائد للعمل.\n\nكيف يمكنني مساعدتك اليوم؟\n• استفسارات عن الساعات الذكية\n• خطوات التفعيل\n• خدمات البنك`,
      requestAgentTransfer: false,
      reactivateBot: true,
      context: "BOT_REACTIVATED"
    };
  }

  // 3️⃣ التحقق من وجود محتوى محلي مطابق
  const localResult = searchLocalContent(message);
  if (localResult) {
    return {
      reply: `${localResult.answer}\n\nهل تحتاج إلى مساعدة أخرى؟ 😊`,
      requestAgentTransfer: false,
      reactivateBot: false,
      context: localResult.source
    };
  }

  // 4️⃣ الأسئلة العامة والتفاعل الودي
  const greetings = ['مرحبا', 'مرحباً', 'اهلا', 'أهلا', 'السلام', 'هلا', 'هاي', 'hey', 'hi', 'hello'];
  const thanks = ['شكرا', 'شكراً', 'جزاك', 'مشكر', 'thanks'];

  // التحيات
  if (greetings.some(g => lowerMessage.includes(g))) {
    const greeting = lowerMessage.includes('السلام') ? 'وعليكم السلام' : 'مرحباً';
    return {
      reply: `${greeting}! 😊\n\n${clientName ? `أهلاً ${clientName}!` : 'أهلاً بك!'}\n\nأنا مساعدك الذكي من CIB Prime، كيف يمكنني مساعدتك في رحلة الحصول على ساعتك اليوم؟`,
      requestAgentTransfer: false,
      reactivateBot: false,
      context: "GREETING"
    };
  }

  // الشكر
  if (thanks.some(t => lowerMessage.includes(t))) {
    return {
      reply: `العفو! 😊\n\nنحن هنا لمساعدتك دائماً.\n\nهل هناك شيء آخر يمكنني مساعدتك به؟`,
      requestAgentTransfer: false,
      reactivateBot: false,
      context: "THANKS"
    };
  }

  // 5️⃣ معلومات عن المحادثة السابقة
  if (conversationContext && (lowerMessage.includes('قال') || lowerMessage.includes('سألت'))) {
    return {
      reply: `بناءً على محادثتنا السابقة:\n${conversationContext}\n\nهل تحتاج توضيحاً إضافياً؟ 😊`,
      requestAgentTransfer: false,
      reactivateBot: false,
      context: "CONTEXTUAL"
    };
  }

  // 6️⃣ للأسئلة الصعبة أو غير المعروفة - محاولة تقديم مساعدة عامة
  const generalHelp = `حسناً، سأحاول مساعدتك قدر الإمكان! 🤔\n\n`;
  
  const relatedInfo = [
    "إذا كان سؤالك عن الساعات الذكية: لدينا 9 ألوان متاحة مجاناً!",
    "إذا كان سؤالك عن التفعيل: التسجيل يتم في 6 خطوات بسيطة.",
    "إذا كان سؤالك عن التمويل: نوفر خدمات تمويل مرنة للسيارات والمنازل.",
    "إذا كان سؤالك عن السحب على سيارة: استخدم بطاقتك لزيادة فرصك!"
  ];
  
  const randomHelp = relatedInfo[Math.floor(Math.random() * relatedInfo.length)];
  
  return {
    reply: `${generalHelp}${randomHelp}\n\nهل تريد معرفة المزيد عن موضوع معين؟ 😊\n\nأو اضغط على الزر أدناه للتواصل مع الموظف:`,
    requestAgentTransfer: false,
    reactivateBot: false,
    context: "GENERAL_HELP"
  };
}

// ============================================
// تلخيص المحادثة (Summarization)
// ============================================
interface MessageItem {
  senderType: 'client' | 'bot' | 'agent';
  content: string;
}

function summarizeConversation(messages: MessageItem[]): string {
  if (messages.length === 0) return "";
  
  const clientMessages = messages.filter(m => m.senderType === 'client').map(m => m.content);
  const lastMessages = clientMessages.slice(-3); // آخر 3 رسائل فقط
  
  if (lastMessages.length === 0) return "بداية المحادثة";
  
  const summary = lastMessages.map((msg, i) => {
    // اختصار الرسائل الطويلة
    const shortMsg = msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
    return `${i + 1}. "${shortMsg}"`;
  }).join('\n');
  
  return `آخر استفسارات العميل:\n${summary}`;
}

// ============================================
// Local AI Core Export
// ============================================
export const LocalAI = {
  // المحرك الرئيسي للردود الذكية
  generateReply: generateSmartReply,
  
  // تلخيص المحادثة
  summarize: summarizeConversation,
  
  // البحث المحلي في المحتوى
  search: searchLocalContent,
  
  // فحص طلب الموظف
  isAgentRequest: checkAgentRequest,
  
  // محتوى الموقع للرجوع إليه
  getSiteContent: () => SITE_CONTENT
};

// ============================================
// Types for TypeScript
// ============================================
export type { SmartReplyOptions };
