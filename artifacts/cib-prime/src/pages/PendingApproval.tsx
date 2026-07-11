import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';
import { useRegistration } from '@/context/RegistrationContext';

export default function PendingApproval() {
  const { data } = useRegistration();
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate dots
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto animate-in fade-in duration-700">
        
        {/* أيقونة متحركة */}
        <div className="relative mb-10">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            {/* حلقة دوارة */}
            <div className="absolute inset-4 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-4 rounded-full border-4 border-primary border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
            <Loader2 className="w-12 h-12 text-primary relative z-10 animate-pulse" />
          </div>
          
          {/* نبض خارجي */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* العنوان */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          جارٍ التحقق من البيانات
        </h1>
        
        {/* الوصف */}
        <p className="text-lg text-muted-foreground text-center mb-8 leading-relaxed">
          يرجى الانتظار بينما يتم التحقق من بيانات حسابك{dots}
        </p>

        {/* معلومات العميل */}
        <div className="bg-card border border-border rounded-2xl p-6 w-full shadow-lg mb-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-muted-foreground text-sm">اسم المستخدم</span>
              <span className="font-mono font-bold text-foreground">{data.username || 'غير محدد'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">الحالة</span>
              <span className="flex items-center gap-2 text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                قيد المراجعة
              </span>
            </div>
          </div>
        </div>

        {/* نص توضيحي */}
        <div className="text-center text-sm text-muted-foreground">
          <p>هذا الأمر قد يستغرق بضع ثوانٍ</p>
          <p>يرجى عدم إغلاق هذه الصفحة</p>
        </div>

      </div>
    </AppLayout>
  );
}
