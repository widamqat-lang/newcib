import { Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { Shield, Clock, Palette, ChevronLeft, Gift, Star, Sparkles } from 'lucide-react';

const watches = [
  {
    id: 'purple',
    name: 'ساعة اورورا البنفسجي',
    image: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/d1f281814_cibbankdash-elkqgt66_manus_space_watch-purple_fe9e6a0d_7ac2a8af.jpg',
    desc: 'ألوان لافتة وعصرية تجعلك محط الأنظار — مثالية لمن يبحث عن التميّز.',
    color: 'bg-purple-100',
    tagColor: 'text-purple-600',
  },
  {
    id: 'white',
    name: 'ساعة اورورا ابيض',
    image: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/3e5baac85_cibbankdash-elkqgt66_manus_space_watch-white_9d72ac02_09c75fd0.jpg',
    desc: 'تصميم أنيق وفخيم بلون أبيض نقي — تضفي لمسة عصرية مميزة على مظهرك.',
    color: 'bg-gray-100',
    tagColor: 'text-gray-600',
  },
  {
    id: 'green',
    name: 'ساعة اورورا اخضر',
    image: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/dabfd5203_cibbankdash-elkqgt66_manus_space_watch-green_22679453_95bc43bd.jpg',
    desc: 'تصميم ناعم بلون هادئ يعكس الأناقة والبساطة — مثالية للإطلالات اليومية.',
    color: 'bg-green-100',
    tagColor: 'text-green-600',
  },
  {
    id: 'rosegold',
    name: 'ساعة اورورا المريخي',
    image: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/c92f1b8e3_cibbankdash-elkqgt66_manus_space_watch-rosegold_d9498af6_d07ac97b.jpg',
    desc: 'لون دافئ وناعم يعكس الرقي والأناقة — اختيارك المثالي لكل مناسبة.',
    color: 'bg-rose-100',
    tagColor: 'text-rose-600',
  },
  {
    id: 'black',
    name: 'ساعة اورورا اسود',
    image: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/706d6e274_cibbankdash-elkqgt66_manus_space_watch-black_342908dd_0a863039.jpg',
    desc: 'أناقة كلاسيكية بلمسة فاخرة — تجمع بين الفخامة والأداء في تصميم عصري.',
    color: 'bg-zinc-100',
    tagColor: 'text-zinc-600',
  },
  {
    id: 'orange',
    name: 'ساعة اورورا البرتقالي',
    image: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/b9c6548ae_cibbankdash-elkqgt66_manus_space_watch-orange_e141c053_b4aef98a.jpg',
    desc: 'لون دافئ وجذّاب يعكس الحيوية — اختيارك الأمثل لإطلالة مشرقة.',
    color: 'bg-orange-100',
    tagColor: 'text-orange-600',
  },
  {
    id: 'gold',
    name: 'ساعة اورورا الذهبي',
    image: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/e0a31cadd_cibbankdash-elkqgt66_manus_space_watch-gold_322d7cf1_b7c0a2b2.jpg',
    desc: 'لمسة ذهبية فاخرة تعكس الرقي والتميّز — ساعة تليق بذوقك الرفيع.',
    color: 'bg-amber-100',
    tagColor: 'text-amber-600',
  },
  {
    id: 'silver',
    name: 'ساعة اورورا الفضي',
    image: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/a69ae8340_cibbankdash-elkqgt66_manus_space_watch-silver_fd3b201d_b1402724.jpg',
    desc: 'تصميم فضي لامع يعكس الفخامة العصرية — اختيارك الأمثل للمناسبات الراقية.',
    color: 'bg-slate-100',
    tagColor: 'text-slate-600',
  },
  {
    id: 'blue',
    name: 'ساعة اورورا الأزرق',
    image: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/57041acb2_cibbankdash-elkqgt66_manus_space_watch-blue_d8e7dc43_f929a4df.jpg',
    desc: 'لون أزرق كلاسيكي يجمع بين الأناقة والثقة — مثالية لكل الأوقات.',
    color: 'bg-blue-100',
    tagColor: 'text-blue-600',
  },
];

export default function Watches() {
  return (
    <AppLayout>
      <div className="w-full flex flex-col items-center justify-start flex-1 animate-in fade-in duration-500" dir="rtl">
        
        {/* Hero Section */}
        <div className="relative w-full min-h-[400px] bg-gradient-to-br from-[#0c59b3] via-[#0a4fa3] to-[#073a7a] overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-400 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-300 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="container mx-auto px-4 py-16 relative z-10 text-center">
            <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
              عرض حصري لعملاء CIB
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4">
              مجموعة الساعات الذكية
              <span className="block text-2xl md:text-3xl text-blue-200 mt-2">الحصرية</span>
            </h1>
            
            <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              اختر ساعتك المفضلة واحصل عليها مجاناً
            </p>
            
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-2 rounded-full">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-semibold">الكمية محدودة — لا تفوت الفرصة</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="w-full bg-white shadow-lg -mt-8 relative z-20 mx-4 lg:mx-auto max-w-5xl rounded-2xl">
          <div className="container mx-auto px-6 py-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-[#0a4fa3]">مجاني</div>
                  <div className="text-xs text-gray-500">عرض</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 border-x border-gray-100 px-6">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-[#0a4fa3]">100%</div>
                  <div className="text-xs text-gray-500">ضمان</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-[#0a4fa3]">9</div>
                  <div className="text-xs text-gray-500">ألوان</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="w-full max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              اختر اللون الذي يناسب أسلوبك
            </h2>
            <p className="text-lg text-muted-foreground">
              9 ألوان عصرية، تصميم فاخر، وأداء استثنائي
            </p>
          </div>

          {/* Watches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {watches.map((watch) => (
              <div 
                key={watch.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Color Tag */}
                <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  <img 
                    src={watch.image} 
                    alt={watch.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      <Gift className="w-3 h-3" />
                      مجاناً
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full ${watch.color} border-2 border-white shadow-sm`}></div>
                    <span className="text-sm font-semibold text-gray-500">
                      {watch.name.split(' ').pop()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-2">{watch.name}</h3>
                  <p className="text-gray-500 mb-6 leading-relaxed text-sm">{watch.desc}</p>
                  
                  <Link 
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-l from-[#0a4fa3] to-[#073a7a] text-white py-3 rounded-xl font-bold hover:from-[#0c59b3] hover:to-[#0a4fa3] transition-all duration-300 group-hover:shadow-lg"
                  >
                    <span>اطلب الآن</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full bg-gradient-to-br from-[#0c59b3] via-[#0a4fa3] to-[#073a7a] py-16 mb-16">
          <div className="w-full max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-white">فرصة محدودة</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              اطلب ساعتك الآن قبل نفاذ الكمية
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              سجل دخولك واحجز ساعتك المجانية في خطوات بسيطة.
            </p>
            
            <Link 
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#0a4fa3] px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-xl"
            >
              <span>ابدأ الطلب</span>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
