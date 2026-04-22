import React from 'react';

export function Footer() {
  return (
    <footer className="w-full flex justify-center pt-12 pb-8 relative z-40">
      <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/50 backdrop-blur-2xl border border-slate-800/80 shadow-xl">
        <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-medium">
          Project made by
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]">
          Achraf
        </span>
      </div>
    </footer>
  );
}
