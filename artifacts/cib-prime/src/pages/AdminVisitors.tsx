import { useState, useEffect, useMemo } from 'react';
import { useAdminRealtime } from '@/hooks/useAdminRealtime';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Users, User, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TabType = 'online' | 'all';

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 60) {
    return `منذ ${diffSecs} ثانية`;
  }
  if (diffSecs < 3600) {
    const mins = Math.floor(diffSecs / 60);
    return `منذ ${mins} دقيقة`;
  }
  if (diffSecs < 86400) {
    const hours = Math.floor(diffSecs / 3600);
    return `منذ ${hours} ساعة`;
  }
  return date.toLocaleString('ar-EG', { 
    day: '2-digit', 
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function OnlineCounter({ lastSeenAt }: { lastSeenAt: string | null }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!lastSeenAt) return;

    const updateSeconds = () => {
      const diff = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 1000);
      setSeconds(Math.max(0, diff));
    };

    updateSeconds();
    const interval = setInterval(updateSeconds, 1000);
    return () => clearInterval(interval);
  }, [lastSeenAt]);

  if (seconds < 60) {
    return <span className="text-emerald-600 font-bold text-base sm:text-lg">{seconds} ثانية</span>;
  }
  if (seconds < 3600) {
    return <span className="text-emerald-600 font-bold text-base sm:text-lg">{Math.floor(seconds / 60)} دقيقة</span>;
  }
  return <span className="text-emerald-600 font-bold text-base sm:text-lg">{Math.floor(seconds / 3600)} ساعة</span>;
}

function VisitorCard({ 
  name, 
  sessionId, 
  lastSeenAt, 
  createdAt,
  isOnline 
}: { 
  name: string; 
  sessionId: string; 
  lastSeenAt: string | null;
  createdAt: string;
  isOnline: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${isOnline ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 ${isOnline ? 'bg-emerald-100' : 'bg-gray-100'}`}>
          {isOnline ? (
            <Activity className={`w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 ${isOnline ? 'animate-pulse' : ''}`} />
          ) : (
            <User className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-bold text-foreground text-base sm:text-lg truncate">{name}</p>
            {isOnline && (
              <span className="px-2 py-1 text-xs sm:text-sm bg-emerald-500 text-white rounded-full font-medium">نشط</span>
            )}
          </div>
          
          <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>الدخول: {formatDateTime(createdAt)}</span>
            </div>
            
            {lastSeenAt && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                {isOnline ? (
                  <>
                    <span>النشاط: </span>
                    <OnlineCounter lastSeenAt={lastSeenAt} />
                  </>
                ) : (
                  <span>آخر ظهور: {formatTimeAgo(lastSeenAt)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Session ID */}
        <div className="text-xs sm:text-sm text-muted-foreground font-mono dir-ltr text-left hidden sm:block">
          {sessionId.slice(0, 8)}...
        </div>
      </div>
    </div>
  );
}

export default function AdminVisitors() {
  const { clients, status } = useAdminRealtime();
  const [activeTab, setActiveTab] = useState<TabType>('online');
  const [, setRefresh] = useState(0);

  // Force re-render every second for online counters
  useEffect(() => {
    const interval = setInterval(() => setRefresh(r => r + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter visitors
  const onlineVisitors = useMemo(() => {
    return clients
      .filter(c => c.status === 'online')
      .sort((a, b) => {
        // Sort by last activity (most recent first)
        const aTime = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        const bTime = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [clients]);

  const allVisitors = useMemo(() => {
    return [...clients].sort((a, b) => {
      // Sort by creation date (most recent first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [clients]);

  const displayVisitors = activeTab === 'online' ? onlineVisitors : allVisitors;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">الزوار</h1>
          <p className="text-muted-foreground mt-1 text-sm">مراقبة زوار الموقع في الوقت الفعلي</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-base sm:text-lg text-emerald-700 font-medium">زوار نشطين</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-emerald-700">{onlineVisitors.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-300 bg-gray-50 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-base sm:text-lg text-gray-700 font-medium">إجمالي الزوار</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-gray-700">{clients.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 border-b border-border">
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-medium border-b-2 transition-colors ${
              activeTab === 'online'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            زوار نشطين ({onlineVisitors.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            إجمالي الزوار ({clients.length})
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            عرض {displayVisitors.length} زائر
            {activeTab === 'online' && onlineVisitors.length > 0 && ' نشط'}
          </span>
          <div className="flex items-center gap-2">
            {status === 'online' ? (
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                متصل
              </span>
            ) : (
              <span className="flex items-center gap-1">
                جارٍ الاتصال...
              </span>
            )}
          </div>
        </div>

        {/* Visitors List */}
        {displayVisitors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 sm:p-16 text-center text-muted-foreground">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50" />
            </div>
            <p className="text-base sm:text-lg font-medium">
              {activeTab === 'online' ? 'لا يوجد زوار نشطين حالياً' : 'لا يوجد زوار حتى الآن'}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground/70 mt-2">
              {activeTab === 'online' ? 'الزوار النشطون يظهرون هنا تلقائياً' : 'الزوار سيظهرون عند دخولهم للموقع'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {displayVisitors.map((visitor) => (
              <VisitorCard
                key={visitor.sessionId}
                name={visitor.fullName?.trim() || 'عميل جديد'}
                sessionId={visitor.sessionId}
                lastSeenAt={visitor.lastSeenAt}
                createdAt={visitor.createdAt}
                isOnline={visitor.status === 'online'}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
