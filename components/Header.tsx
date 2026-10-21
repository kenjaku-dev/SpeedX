'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Speed test' },
  { href: '/about', label: 'How it works' }
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed left-1/2 top-6 z-50 -translate-x-1/2 md:top-8">
      <nav
        aria-label="Primary"
        className="flex items-center gap-1 rounded-4xl border border-line bg-canvas/70 p-1.5 shadow-soft backdrop-blur-xl"
      >
        {/* Logo Element */}
        <Link
          href="/"
          aria-label="SpeedX home"
          className="group flex select-none items-center gap-2 py-2 pl-3 pr-2 sm:pl-4 sm:pr-3"
        >
          <Activity
            className="size-5 text-signal transition-[filter] group-hover:drop-shadow-[0_0_8px_color-mix(in_oklab,var(--color-signal)_70%,transparent)]"
            aria-hidden="true"
          />
          <span className="hidden font-mono text-micro font-bold uppercase tracking-[0.18em] text-fg sm:block">
            SpeedX
          </span>
        </Link>

        <div aria-hidden="true" className="mx-1 h-6 w-px bg-line" />

        <div className="flex items-center">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className="relative whitespace-nowrap rounded-full px-3 py-2.5 text-label font-bold uppercase transition-colors sm:px-5"
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 z-0 animate-in rounded-full border border-line bg-surface-hover shadow-inner fade-in-0 zoom-in-95 duration-200"
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 transition-colors duration-300",
                    isActive ? "text-signal" : "text-fg-muted hover:text-fg"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
