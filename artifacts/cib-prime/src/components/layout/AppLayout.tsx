import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'wouter';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center bg-background text-foreground">
      <header className="w-full max-w-5xl px-6 py-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-wide text-foreground">
            CIB <span className="text-primary font-light">Prime</span>
          </span>
        </Link>
      </header>
      
      <main className="flex-1 w-full max-w-5xl px-6 flex flex-col pb-12">
        {children}
      </main>

      <footer className="w-full py-6 text-center text-muted-foreground text-sm">
        جميع الحقوق محفوظة © {new Date().getFullYear()} البنك التجاري الدولي CIB
      </footer>
    </div>
  );
}
