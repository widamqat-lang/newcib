import { useEffect } from 'react';
import { Link } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRealtime } from '@/context/RealtimeContext';

export default function Home() {
  const { reportStage } = useRealtime();

  useEffect(() => {
    reportStage('home', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    {
      id: 'silver',
      name: 'الفئة الفضية',
      image: '/watch-silver.png',
      desc: 'أناقة يومية عملية',
      gradient: 'from-slate-400 to-slate-600'
    },
    {
      id: 'gold',
      name: 'الفئة الذهبية',
      image: '/watch-gold.png',
      desc: 'فخامة وامتيازات حصرية',
      gradient: 'from-yellow-400 to-yellow-700'
    },
    {
      id: 'black',
      name: 'فئة التيتانيوم',
      image: '/watch-black.png',
      desc: 'للنخبة فقط',
      gradient: 'from-zinc-700 to-black'
    }
  ];

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in zoom-in duration-700 w-full mt-4">
        
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            مستقبلك المالي، <span className="text-primary block mt-2">في معصمك.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
            بطاقات CIB Prime مصممة خصيصاً لساعتك الذكية. اختر فئتك وتمتع بتجربة بنكية استثنائية دون الحاجة لحمل محفظتك.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full px-4">
          {cards.map((card, i) => (
            <Link 
              key={card.id} 
              href="/signup"
              className="group relative flex flex-col items-center p-8 lg:p-10 rounded-[2rem] bg-card border border-border overflow-hidden transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 cursor-pointer"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative w-48 h-48 mb-10 drop-shadow-2xl transition-transform duration-700 group-hover:scale-110">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-20 blur-3xl rounded-full`} />
                <img 
                  src={card.image} 
                  alt={card.name} 
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                />
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">{card.name}</h3>
              <p className="text-base text-muted-foreground text-center">{card.desc}</p>
              
              {/* زر "ابدأ التفعيل" يظهر دائماً */}
              <div className="mt-6">
                <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold">
                  ابدأ التفعيل
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
