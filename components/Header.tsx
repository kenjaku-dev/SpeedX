'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Telemetry' },
  { href: '/about', label: 'Engine Specs' }
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 md:top-8 relative-0">
      <nav className="flex items-center gap-1 p-1.5 rounded-[2rem] bg-slate-950/60 backdrop-blur-2xl border border-slate-800/80 shadow-[0_0_40px_rgba(34,211,238,0.05)]">
        
        {/* Logo Element */}
        <Link href="/" className="flex items-center gap-2 pl-4 pr-3 py-2 select-none group">
          <Activity className="w-5 h-5 text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all" />
          <span className="font-mono text-xs font-bold text-slate-200 tracking-[0.2em] uppercase hidden sm:block">SpeedX</span>
        </Link>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-slate-800/80 mx-1"></div>

        {/* Links */}
        <div className="flex items-center">
            {links.map((link) => {
            const isActive = pathname === link.href;
            return (
                <Link
                key={link.href}
                href={link.href}
                className="relative px-5 py-2.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase transition-colors"
                >
                {isActive && (
                    <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-slate-800/60 border border-slate-700/50 shadow-inner z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                )}
                <span className={cn(
                    "relative z-10 transition-colors duration-300", 
                    isActive ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "text-slate-400 hover:text-slate-200"
                )}>
                    {link.label}
                </span>
                </Link>
            )
            })}
        </div>
      </nav>
    </header>
  );
}
