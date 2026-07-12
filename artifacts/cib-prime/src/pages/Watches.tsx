import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Shield, Clock, Palette, ChevronLeft, Gift, Star, Sparkles, Loader2 } from 'lucide-react';
import { watchesApi, type Watch } from '@/lib/api';

// Get Tailwind class from hex color
function getColorClasses(hex: string | undefined): { bg: string; text: string } {
  if (!hex) return { bg: 'bg-gray-100', text: 'text-gray-600' };
  const h = hex.toLowerCase();
  const colorMap: Record<string, { bg: string; text: string }> = {
    '#9333ea': { bg: 'bg-purple-100', text: 'text-purple-600' },
    '#f3f4f6': { bg: 'bg-gray-100', text: 'text-gray-600' },
    '#22c55e': { bg: 'bg-green-100', text: 'text-green-600' },
    '#f472b6': { bg: 'bg-rose-100', text: 'text-rose-600' },
    '#18181b': { bg: 'bg-zinc-100', text: 'text-zinc-600' },
    '#f97316': { bg: 'bg-orange-100', text: 'text-orange-600' },
    '#eab308': { bg: 'bg-amber-100', text: 'text-amber-600' },
    '#94a3b8': { bg: 'bg-slate-100', text: 'text-slate-600' },
    '#3b82f6': { bg: 'bg-blue-100', text: 'text-blue-600' },
  };
  return colorMap[h] || { bg: 'bg-gray-100', text: 'text-gray-600' };
}

export default function Watches() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatches();
  }, []);

  const fetchWatches = async () => {
    setLoading(true);
    const result = await watchesApi.getAllPublic();
    if (result.success && result.data) {
      // Only show active watches
      setWatches(result.data.filter(w => w.isActive));
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="w-full flex flex-col items-center justify-start flex-1 animate-in fade-in duration-500" dir="rtl">
        
        {/* Hero Section */}
        <div className="relative right-0 left-0 top-0 bg-[#053d7c] bg-[radial-gradient(circle_at_center,_#0f68c3_0%,_#053770_55%,_#032249_100%)] pt-16 pb-36 mb-5 flex flex-col items-center text-center overflow-hidden">
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
                  <div className="text-2xl font-extrabold text-[#0a4fa3]">{watches.length}</div>
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
              {watches.length} ألوان عصرية، تصميم فاخر، وأداء استثنائي
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Watches Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {watches.map((watch) => {
                const colorClasses = getColorClasses(watch.colorHex);
                return (
                  <div 
                    key={watch.id}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                  >
                    {/* Color Tag */}
                    <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      <img 
                        src={watch.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
                        alt={watch.nameAr}
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
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                          style={{ backgroundColor: watch.colorHex || '#9ca3af' }}
                        ></div>
                        <span className="text-sm font-semibold text-gray-500">
                          {watch.colorName}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-foreground mb-2">{watch.nameAr}</h3>
                      <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                        {watch.descriptionAr || 'ساعة ذكية أنيقة بتصميم عصري'}
                      </p>
                      
                      <Link 
                        href="/signup"
                        className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-l from-[#0a4fa3] to-[#073a7a] text-white py-3 rounded-xl font-bold hover:from-[#0c59b3] hover:to-[#0a4fa3] transition-all duration-300 group-hover:shadow-lg"
                      >
                        <span>اطلب الآن</span>
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && watches.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>لا توجد ساعات متاحة حالياً</p>
            </div>
          )}
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
