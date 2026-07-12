import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Shield, 
  Users, 
  Settings, 
  Lock, 
  Menu, 
  X, 
  ChevronRight,
  Home,
  MonitorSmartphone
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin', label: 'مراقبة العملاء', icon: Users, exact: true },
  { href: '/admin/content', label: 'إعدادات المحتوى', icon: Settings },
  { href: '/admin/security', label: 'الأمان', icon: Lock },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    window.location.href = href;
  };

  return (
    <div className="min-h-[100dvh] bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a4fa3] to-[#073a7a] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">لوحة الإدارة</h1>
                <p className="text-xs text-muted-foreground">CIB Prime</p>
              </div>
            </div>

            {/* Desktop Status */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>الموقع</span>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>متصل</span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block border-t border-border">
          <div className="px-4">
            <div className="flex gap-1 py-2">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active 
                        ? 'bg-[#0a4fa3] text-white shadow-md' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 top-[72px] z-40 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="bg-white border-b border-border animate-in slide-in-from-top duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active 
                        ? 'bg-[#0a4fa3] text-white' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 mr-auto rotate-180" />
                  </button>
                );
              })}
              
              <div className="border-t border-border pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => handleNavClick('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <MonitorSmartphone className="w-5 h-5" />
                  <span>العودة للموقع</span>
                  <ChevronRight className="w-4 h-4 mr-auto rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
