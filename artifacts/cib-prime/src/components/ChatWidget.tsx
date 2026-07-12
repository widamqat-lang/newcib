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
  isAgentTransferRequested?: boolean;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sessionId } = useRealtime();

  // جلب أو إنشاء محادثة
  useEffect(() => {
    if (!sessionId || !isOpen) return;
    
    console.log('[ChatWidget] Opening chat, sessionId:', sessionId);
    
    const fetchConversation = async () => {
      setLoading(true);
      try {
        console.log('[ChatWidget] Fetching conversation...');
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        console.log('[ChatWidget] Response status:', res.status);
        const data = await res.json();
        console.log('[ChatWidget] Response data:', data);
        
        if (data.success) {
          setConversation(data.data);
          // جلب الرسائل
          fetchMessages(data.data.id);
        } else {
          console.error('[ChatWidget] Failed to create/get conversation:', data.error);
        }
      } catch (error) {
        console.error('[ChatWidget] Error fetching conversation:', error);
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
        // تحديث حالة المحادثة
        if (data.isAgentTransferRequested !== undefined) {
          setConversation(prev => prev ? { ...prev, isAgentTransferRequested: data.isAgentTransferRequested } : null);
        }
        if (data.showContactForm !== undefined) {
          setShowContactForm(data.showContactForm);
        }
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

  // فحص الرسائل لطلب الموذجs
  useEffect(() => {
    const lastBotMessage = [...messages].reverse().find(m => m.senderType === 'bot');
    
    // إذا طلب البوت بيانات الاتصال
    if (lastBotMessage && lastBotMessage.content.includes('يرجى ملء البيانات التالية')) {
      setShowContactForm(true);
      setWaitingForAgent(false);
    }
    // إذا العميل ينتظر الموظف
    else if (lastBotMessage && lastBotMessage.content.includes('جاري توصيلك')) {
      setShowContactForm(false);
      setWaitingForAgent(true);
    }
    // إذا عاد البوت للعمل
    else if (lastBotMessage && lastBotMessage.content.includes('عائد للعمل')) {
      setShowContactForm(false);
      setWaitingForAgent(false);
    }
  }, [messages]);

  // إرسال رسالة
  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || sending) return;
    
    console.log('[ChatWidget] Sending message:', newMessage);
    console.log('[ChatWidget] Conversation ID:', conversation.id);
    
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
      
      console.log('[ChatWidget] Send response status:', res.status);
      const data = await res.json();
      console.log('[ChatWidget] Send response data:', data);
      
      if (data.success) {
        // تحديث الرسائل من الخادم (يتضمن رد الذكاء الاصطناعي)
        if (data.data && Array.isArray(data.data)) {
          setMessages(data.data);
        } else {
          setMessages(prev => [...prev, data.data]);
        }
        setNewMessage('');
        
        // تحديث حالة الـ form بناءً على رد الخادم
        if (data.showContactForm !== undefined) {
          setShowContactForm(data.showContactForm);
        }
        if (data.botActive !== undefined && !data.botActive) {
          // البوت صامت
          console.log('[ChatWidget] Bot is silent');
        }
      } else {
        console.error('[ChatWidget] Failed to send message:', data.error);
      }
    } catch (error) {
      console.error('[ChatWidget] Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // إرسال بالإنتر
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showContactForm) {
        handleContactSubmit();
      } else {
        handleSend();
      }
    }
  };

  // إرسال بيانات الاتصال
  const handleContactSubmit = async () => {
    if (!conversation || !contactForm.name.trim() || !contactForm.phone.trim()) return;

    setSending(true);
    try {
      console.log('[ChatWidget] Submitting contact form:', contactForm);
      const res = await fetch(`/api/conversations/${conversation.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      console.log('[ChatWidget] Contact submit response:', data);

      if (data.success) {
        setShowContactForm(false);
        setWaitingForAgent(true);
        setContactForm({ name: '', email: '', phone: '' });
        fetchMessages(conversation.id);
      }
    } catch (error) {
      console.error('[ChatWidget] Error submitting contact:', error);
    } finally {
      setSending(false);
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
            {waitingForAgent ? (
              // حالة انتظار الموظف
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">في انتظار رد الموظف...</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">سيتم التواصل معك قريباً</p>
              </div>
            ) : showContactForm ? (
              // فورم بيانات الاتصال
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">يرجى إدخال بياناتك للتواصل معك</p>
                <Input
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="الاسم الكامل"
                  className="h-10 text-sm"
                  disabled={sending}
                />
                <Input
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="البريد الإلكتروني (اختياري)"
                  className="h-10 text-sm"
                  type="email"
                  disabled={sending}
                />
                <Input
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="رقم الموبايل"
                  className="h-10 text-sm"
                  type="tel"
                  disabled={sending}
                />
                <Button
                  onClick={handleContactSubmit}
                  disabled={!contactForm.name.trim() || !contactForm.phone.trim() || sending}
                  className="w-full h-10 bg-[#0a4fa3] hover:bg-[#073a7a]"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'إرسال'
                  )}
                </Button>
              </div>
            ) : (
              // حقل الإدخال العادي
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
