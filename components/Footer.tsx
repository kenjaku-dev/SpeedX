import React from 'react';

export function Footer() {
  return (
    <footer className="relative z-40 flex w-full justify-center pb-8 pt-12">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface/60 px-5 py-2 shadow-soft backdrop-blur-xl">
        <span className="label text-fg-subtle">Project made by</span>
        <span className="text-micro font-bold uppercase tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-signal to-upload">
          Achraf
        </span>
      </div>
    </footer>
  );
}
