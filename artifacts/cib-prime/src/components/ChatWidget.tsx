import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Headphones, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRealtime } from '@/context/RealtimeContext';

interface Message {
  id: number;
  senderType: 'client' | 'bot' | 'agent';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  status: 'pending' | 'active' | 'closed';
  agentConnectedAt: string | null;
}

// الردود التلقائية الذكية
const AUTO_REPLIES: Record<string, string> = {
  // ساعات
  ساعة: `لدينا مجموعة ساعات ذكية بألوان عصرية (أسود، أبيض، ذهبي، فضي، أخضر، أزرق...) متاحة مجاناً لعملاء CIB المؤهلين.\n\nللحصول على ساعتك:\n1) سجل بياناتك\n2) أدخل بيانات حسابك البنكي\n3) استلم رمز التحقق\n4) اختر لون ساعتك\n5) انتظر الموافقة`,
  
  ساعات: `لدينا مجموعة ساعات ذكية بألوان عصرية (أسود، أبيض، ذهبي، فضي، أخضر، أزرق...) متاحة مجاناً لعملاء CIB المؤهلين.\n\nللحصول على ساعتك:\n1) سجل بياناتك\n2) أدخل بيانات حسابك البنكي\n3) استلم رمز التحقق\n4) اختر لون ساعتك\n5) انتظر الموافقة`,
  
  // تمويل
  تمويل: `نقدم خدمات تمويل مرنة تشمل:\n• السحب على سيارة أحلامك\n• تمويل المنازل\n• تمويل التعليم\n\nيُرجى زيارة أقرب فرع CIB أو التواصل مع مدير حسابك للحصول على تفاصيل أكثر.`,
  
  سيارة: `خدمة السحب على سيارة من CIB:\n🚗 فرصتك للفوز بسيارة أحلامك\n💰 استخدم بطاقتك الائتمانية\n📈 كل عملية شراء تزيد فرصك\n\nسجل الآن واحصل على فرصتك!`,
  
  // رقم القومي
  'رقم القومي': `يرجى التأكد من:\n• إدخال الرقم القومي المكون من 14 رقماً\n• أن يكون الرقم مسجلاً لدى البنك\n• عدم إضافة أي مسافات أو رموز`,
  
  // موبايل
  موبايل: `يرجى التأكد من:\n• إدخال رقم الموبايل المربوط بحسابك البنكي\n• أن يكون بصيغة: 01xxxxxxxxx\n• عدم إضافة رمز البلد (+) `,
  
  // مشكلة
  مشكلة: `نأسف لحدوث المشكلة. إليك بعض الحلول:\n\n1️⃣ تأكد من صحة البيانات المدخلة\n2️⃣ تأكد من اتصالك بالإنترنت\n3️⃣ حاول إعادة تحميل الصفحة\n\nإذا استمرت المشكلة، اكتب "التواصل مع الموظف" للتحدث مع أحد ممثلي خدمة العملاء.`,
  
  خطأ: `نأسف لحدوث المشكلة. إليك بعض الحلول:\n\n1️⃣ تأكد من صحة البيانات المدخلة\n2️⃣ تأكد من اتصالك بالإنترنت\n3️⃣ حاول إعادة تحميل الصفحة\n\nإذا استمرت المشكلة، اكتب "التواصل مع الموظف" للتحدث مع أحد ممثلي خدمة العملاء.`,
  
  // استفسار
  كيف: `يسعدنا مساعدتك! كيف يمكنني خدمتك؟\n\nيمكنني مساعدتك في:\n• التسجيل في CIB Prime\n• الحصول على الساعة الذكية\n• خدمات التمويل\n• أي استفسار آخر`,
  
  // شكر
  شكراً: `شكراً لك! 😊\nنحن هنا لمساعدتك في أي وقت.\nاكتب استفسارك وسنقوم بالرد عليك.`,
  
  'شكرا': `شكراً لك! 😊\nنحن هنا لمساعدتك في أي وقت.\nاكتب استفسارك وسنقوم بالرد عليك.`,
};

function getAutoReply(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // التحقق من طلب التواصل مع الموظف - إيقاف الردود الآلية
  if (lowerMessage.includes('التواصل مع الموظف') || 
      lowerMessage.includes('موظف') ||
      lowerMessage.includes('مسؤول')) {
    return null; // إيقاف الرد الآلي
  }
  
  // البحث عن كلمات مفتاحية مطابقة
  for (const [keyword, reply] of Object.entries(AUTO_REPLIES)) {
    if (lowerMessage.includes(keyword)) {
      return reply;
    }
  }
  
  // رد افتراضي
  return `شكراً لتواصلك معنا! 🙏\n\nلقد استلمنا استفسارك وسنقوم بالرد عليك في أقرب وقت.\n\nللحصول على إجابة فورية، يمكنك:\n• زيارة صفحة الأسئلة الشائعة\n• الاتصال على خط خدمة العملاء\n\nاكتب "التواصل مع الموظف" للتحدث مباشرة مع أحد ممثلي خدمة العملاء.`;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sessionId } = useRealtime();

  // جلب أو إنشاء محادثة
  useEffect(() => {
    if (!sessionId || !isOpen) return;
    
    const fetchConversation = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (data.success) {
          setConversation(data.data);
          // جلب الرسائل
          fetchMessages(data.data.id);
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [sessionId, isOpen]);

  // جلب الرسائل
  const fetchMessages = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // تحديث الرسائل كل 3 ثواني
  useEffect(() => {
    if (!conversation) return;
    
    const interval = setInterval(() => {
      fetchMessages(conversation.id);
      // تحديث حالة online للعميل
      fetch(`/api/conversations/${conversation.id}/ping`, { method: 'PATCH' });
    }, 3000);

    return () => clearInterval(interval);
  }, [conversation]);

  // تمرير للرسائل الجديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // إرسال رسالة
  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || sending) return;
    
    setSending(true);
    try {
      // إرسال رسالة العميل
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: 'client',
          content: newMessage,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        // إضافة الرسالة للواجهة
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
        
        // جلب الرد الآلي إذا لم يكن الموظف متصل
        if (conversation.status !== 'active') {
          // انتظار قصير ثم جلب الرد
          setTimeout(() => {
            fetchMessages(conversation.id);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // إرسال بالإنتر
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* زر خدمة العملاء العائم */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-br from-[#0a4fa3] to-[#073a7a] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 group"
        title="خدمة العملاء"
      >
        {isOpen ? (
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        ) : (
          <Headphones className="w-6 h-6" />
        )}
      </button>

      {/* نافذة المحادثة */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-l from-[#0a4fa3] to-[#073a7a] p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold">خدمة عملاء CIB</h3>
              <p className="text-white/80 text-xs flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${conversation?.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                {conversation?.status === 'active' ? 'الموظف متصل الآن' : 'متاح للدردشة'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.senderType === 'client' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* الأيقونة */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.senderType === 'client' 
                        ? 'bg-blue-500' 
                        : msg.senderType === 'agent'
                          ? 'bg-green-500'
                          : 'bg-purple-500'
                    }`}>
                      {msg.senderType === 'client' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : msg.senderType === 'agent' ? (
                        <Headphones className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    
                    {/* الرسالة */}
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      msg.senderType === 'client'
                        ? 'bg-blue-500 text-white rounded-tr-sm'
                        : msg.senderType === 'agent'
                          ? 'bg-green-500 text-white rounded-tl-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب رسالتك..."
                className="flex-1 h-11"
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                size="icon"
                className="h-11 w-11 bg-[#0a4fa3] hover:bg-[#073a7a]"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
