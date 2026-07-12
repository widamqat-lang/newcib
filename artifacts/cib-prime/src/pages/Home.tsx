import { useEffect } from 'react';
import { Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRealtime } from '@/context/RealtimeContext';
import { Newspaper, ShieldCheck, ArrowUpRight } from 'lucide-react';

// 1. نقوم بتعريف الكائن الثابت خارج المكون تماماً حتى لا يتغير مكانه في الذاكرة مع كل Render
const EMPTY_PAYLOAD = {};

export default function Home() {
  const { reportStage } = useRealtime();

  useEffect(() => {
    // 2. نستخدم الكائن الثابت هنا
    reportStage('home', EMPTY_PAYLOAD);
  }, [reportStage]);

  const cards = [
    {
      id: 'silver',
      name: 'الفئة الفضية',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
      desc: 'أناقة يومية عملية',
      gradient: 'from-slate-400 to-slate-600',
    },
    {
      id: 'gold',
      name: 'الفئة الذهبية',
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=300&q=80',
      desc: 'فخامة وامتيازات حصرية',
      gradient: 'from-yellow-400 to-yellow-700',
    },
    {
      id: 'black',
      name: 'فئة التيتانيوم',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=300&q=80',
      desc: 'للنخبة فقط',
      gradient: 'from-zinc-700 to-black',
    },
  ];

  return (
    <AppLayout>
      <div className="w-full flex flex-col items-center justify-start flex-1 animate-in fade-in duration-500 mt-4 px-4" dir="rtl">
        
        {/* صندوق الجائزة الكبرى */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c59b3] via-[#0a4fa3] to-[#073a7a] p-6 text-white shadow-lg font-sans w-full max-w-5xl mx-auto mb-12 selection:bg-blue-500">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-blue-500 opacity-10 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center justify-start gap-2 text-[#b3d4ff] mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-blue-200">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3-3h.375a2.625 2.625 0 0 0 0-5.25H18.75m-2.25 8.25v-3.75m0 3.75a3 3 0 0 0 3-3V9.75m-9.75 9h-3a3 3 0 0 1-3-3h-.375a2.625 2.625 0 0 1 0-5.25H4.25m2.25 8.25v-3.75m0 3.75a3 3 0 0 1-3-3V9.75m0 0A3.75 3.75 0 0 1 7.25 6h9.5m-10.125 3.75h10.75" />
            </svg>
            <span className="text-sm font-medium tracking-wide text-gray-200 opacity-90">الجائزة الكبرى</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-right leading-tight text-white drop-shadow-sm">اربح سيارة فاخرة جديدة</h2>
          <p className="text-xs md:text-sm text-gray-300 opacity-90 leading-relaxed text-right font-light">
            كل عميل <span className="font-semibold text-white">Prime</span> يدخل تلقائياً في سحب الجائزة الكبرى السنوية.
          </p>
        </div>

        {/* قسم الهيدر والعنوان */}
        <div className="w-full max-w-5xl mx-auto mb-12 text-right">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            اختر ساعتك  <span className="text-primary inline-block">الذكية .</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-3xl mt-3 leading-relaxed">اختر الساعة المفضلة لديك</p>
        </div>

        {/* شبكة عرض البطاقات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto mb-16">
          {cards.map((card) => (
            <Link
              key={card.id}
              href="/signup"
              className="group relative flex flex-col items-center p-6 rounded-2xl bg-card border border-border/80 transition-all duration-200 hover:border-primary/50 cursor-pointer w-full text-center shadow-sm"
            >
              <div className="relative w-28 h-28 md:w-32 md:h-32 mb-4 flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 blur-xl rounded-full`} />
                <img src={card.image} alt={card.name} className="w-full h-full object-cover rounded-xl relative z-10" />
              </div>

              <h3 className="text-lg font-bold mb-1 text-foreground w-full">{card.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 px-2 flex-1">{card.desc}</p>

              <div className="mt-4 w-full">
                <span className="inline-flex items-center justify-center bg-primary text-primary-foreground w-full py-2.5 rounded-xl text-xs font-bold transition-colors group-hover:bg-primary/95">
                  طلب الآن
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* قسم الـ 8 صناديق الإخبارية والخدمية */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
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
                  desc: "توسيع نطاق خدمات تطبيق CIB Token لربط ساعات اليد الذكية ببطاقات الائتمان لتسهيل المعاملات اللاتلامسية بشكل آمن بالكامل."
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
                  title: "شراكة إستراتيجية لدعم المشروعات الخضراء والمستدامة",
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
                img: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=150&q=80",
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

      </div>
    </AppLayout>
  );
}
