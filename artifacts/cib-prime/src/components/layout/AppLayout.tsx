import React, { useState } from 'react';
import { PhoneCall, HelpCircle, Newspaper, ShieldCheck, ArrowUpRight, Menu, X, ChevronDown } from 'lucide-react';
import { Link } from 'wouter';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      
      {/* 🏛️ شريط الهيدر البنكي الرسمي باللون الأزرق المعتمد لـ CIB */}
      <header className="w-full bg-[#1858a8] border-b border-white/10 sticky top-0 z-50 shadow-sm">
        {/* الخط الذهبي العلوي الرفيع المميز للهوية المصرفية الفاخرة */}
        <div className="h-1 w-full bg-[#c89a3f]" />
        
        <div className="w-full px-4 sm:px-6 h-20 flex justify-between items-center" dir="rtl">
          {/* الشعار الرسمي لـ CIB */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <img 
              src="https://www.cibeg.com/-/media/feature/navigation/footer/logo-white.svg" 
              alt="CIB Logo" 
              className="h-8 sm:h-9 w-auto transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* قائمة التنقل الرئيسية للشاشات الكبيرة */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-white/90 hover:text-white font-medium text-sm transition-colors">الرئيسية</Link>
            <Link href="/create-account" className="text-white/90 hover:text-white font-medium text-sm transition-colors">تسجيل دخول</Link>
            <Link href="/watches" className="bg-[#c89a3f] text-white hover:bg-[#b08735] px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md">
              طلب ساعة مجاناً
            </Link>
          </nav>

          {/* روابط مساعدة سريعة للشاشات الكبيرة */}
          <div className="hidden sm:flex items-center gap-4 sm:gap-6">
            <a href="tel:19666" className="flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white transition-colors">
              <PhoneCall className="w-3.5 h-3.5 text-white/80" />
              <span className="hidden lg:inline">اتصل بنا 19666</span>
            </a>
            
          </div>

          {/* زر القائمة للهاتف */}
          <button 
            onClick={toggleMobileMenu}
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* قائمة الهاتف المنسدلة */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-[#1858a8] border-t border-white/10 py-4 px-4" dir="rtl">
            <div className="space-y-2">
              <Link 
                href="/" 
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-colors"
              >
                <span>الرئيسية</span>
              </Link>
              <Link 
                href="/watches" 
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-colors"
              >
                <span>الساعات الذكية</span>
              </Link>
              <Link 
                href="/create-account" 
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-colors"
              >
                <span>تسجيل دخول</span>
              </Link>
              <a 
                href="tel:19666" 
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-white/80" />
                <span>اتصل بنا 19666</span>
              </a>
              
            </div>
          </div>
        )}
      </header>
      
      {/* 📱 منطقة المحتوى الأساسية */}
      <main className="flex-1 w-full flex flex-col p-0 m-0">
        
        {/* محتوى الصفحة الأساسي (الذي يحتوي على الـ Hero) */}
        {children}

        {/* 📰 قسم المستجدات والبيئة المصرفية الموثوقة */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10 mt-12 border-t border-border/40 pt-10" dir="rtl">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Newspaper className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">آخر مستجدات وأخبار CIB</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  img: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=300&q=80",
                  tag: "اليوم",
                  title: "CIB يطلق الجيل الجديد من حلول الدفع الذكي عبر الأجهزة القابلة للارتداء",
                  desc: "توسيع نطاق خدمات تطبيق CIB Token لربط ساعات اليد الذكية ببطاقات الائتمان لتسهيل المعاملات اللاتلامسية بشكل آمن تماماً."
                },
                {
                  img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80",
                  tag: "أمس",
                  title: "تحديثات أمنية هامة لنظام المصادقة الثنائية وبطاقات Prime",
                  desc: "ترقية أنظمة التشفير المصرفية إلى معيار 256-bit لتعزيز حماية المدفوعات الفورية والمحفظة الرقمية ضد أي محاولات وصول غير مصرح بها."
                },
                {
                  img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=300&q=80",
                  tag: "قبل يومين",
                  title: "شراكة استراتيجية لدعم المشروعات الخضراء والمستدامة",
                  desc: "توقيع اتفاقية جديدة لتمويل الشركات الناشئة التي تتبنى الحلول الصديقة للبيئة وتكنولوجيا الطاقة النظيفة في المنطقة."
                },
                {
                  img: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=300&q=80",
                  tag: "الأسبوع الماضي",
                  title: "توسيع محفظة الاستثمارات الدولية وخدمات إدارة الأصول",
                  desc: "إطلاق صناديق استثمارية مشتركة تتيح للعملاء تنويع محافظهم المالية بكفاءة عالية وبأقل نسب مخاطرة ممكنة."
                }
              ].map((news, idx) => (
                <div key={idx} className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm flex flex-col sm:flex-row text-right transition-all hover:border-border">
                  <div className="sm:w-1/3 h-32 sm:h-auto relative bg-secondary">
                    <img src={news.img} alt={news.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 sm:w-2/3 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded mb-1 inline-block">{news.tag}</span>
                      <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{news.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{news.desc}</p>
                    </div>
                    <div className="pt-2 flex items-center text-[11px] font-bold text-primary gap-0.5 cursor-pointer hover:underline">
                      <span>اقرأ المزيد</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">بيئة مصرفية موثوقة</h2>
            </div>

            {[
              {
                img: "https://assets.finapp.jo/wp-content/uploads/2024/09/25145017/Wallet-panas.png",
                title: "حماية مصرفية متطورة",
                desc: "تتم معالجة وتشفير كافة حركاتك المالية محلياً على الشريحة الآمنة المتواجدة في ساعتك دون مشاركة بيانات بطاقتك الفعلية."
              },
              {
                img: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=150&q=80",
                title: "البنك الرقمي الأفضل",
                desc: "حائز على جائزة التميز لأفضل الحلول المصرفية الرقمية وتطبيقات الدفع الآمن المبتكرة في منطقة الشرق الأوسط."
              },
              {
                img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                title: "دعم النخبة على مدار الساعة",
                desc: "فريق مخصص من مستشاري الثروات والخدمات المصرفية الرقمية للإجابة على استفساراتك وإتمام عملياتك بمرونة تامة."
              },
              {
                img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&q=80",
                title: "منظومة فروع رقمية متكاملة",
                desc: "إمكانية إدارة حساباتك وإنشاء طلبات الإصدار الفوري لبطاقات الأجهزة الذكية من أي فرع أو ماكينة صراف آلي تفاعلية."
              }
            ].map((service, idx) => (
              <div key={idx} className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
                  <img src={service.img} alt={service.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-bold text-foreground">{service.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 🔒 التذييل الرسمي لحماية البيانات وحقوق البنك */}
      <footer className="w-full bg-card border-t border-card-border py-8 sm:py-10 text-center text-muted-foreground mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-4">
          
          {/* روابط المصداقية البنكية */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground/80 mb-2">
            <Link href="/terms" className="hover:text-primary transition-colors cursor-pointer">الشروط والأحكام</Link>
            <span className="text-border">|</span>
            <Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer">سياسة سرية الحسابات</Link>
            <span className="text-border">|</span>
            <Link href="/security" className="hover:text-primary transition-colors cursor-pointer">نصائح الأمان الرقمي</Link>
          </div>

          {/* نص الحقوق القانونية الافتراضي للبنك */}
          <p className="text-[11px] sm:text-xs text-muted-foreground/60 max-w-2xl leading-relaxed">
            تخضع جميع المعاملات البنكية المتاحة وطلب المنتجات الرقمية لإشراف الرقابة المالية والتشريعات المصرفية المعمول بها.
          </p>
          
          <div className="text-xs font-semibold text-foreground/70 mt-2">
            جميع الحقوق محفوظة © {new Date().getFullYear()} البنك التجاري الدولي CIB (مصر) ش.م.م
          </div>
        </div>
      </footer>

    </div>
  );
}
