import { AppLayout } from '@/components/layout/AppLayout';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 mb-8 rounded-full bg-card border border-border flex items-center justify-center">
          <Shield className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <h1 className="text-7xl font-bold text-primary mb-6 tracking-tight">404</h1>
        <h2 className="text-3xl font-bold mb-4 text-foreground">الصفحة غير موجودة</h2>
        <p className="text-xl text-muted-foreground mb-10 max-w-md">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Link href="/">
          <Button size="lg" className="h-14 px-10 text-lg rounded-xl">العودة للرئيسية</Button>
        </Link>
      </div>
    </AppLayout>
  );
}
