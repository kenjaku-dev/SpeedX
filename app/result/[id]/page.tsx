import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { Activity, ArrowDown, ArrowUp, Globe, MapPin, Server, Share2, Check } from 'lucide-react';
import Link from 'next/link';

interface ResultParams {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultPage(props: ResultParams) {
  const { id } = await props.params;

  const stmt = db.prepare('SELECT * FROM SpeedTest WHERE id = ?');
  const result = stmt.get(id) as any;

  if (!result) {
    notFound();
  }

  const date = new Date(result.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <main className="flex-1 w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 md:p-12 md:pt-32 pt-28 selection:bg-cyan-500/30 relative overflow-hidden font-sans">
      
      {/* Dark Grid Background with dynamic glow */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e293b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} 
      />
      
      <div 
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-0 pointer-events-none"
      />

      <div className="max-w-4xl w-full flex flex-col items-center gap-12 z-10 relative">
        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-emerald-900/40 shadow-inner border border-emerald-800/80 mb-2">
             <Check className="w-4 h-4 text-emerald-400 mr-2" />
             <span className="font-mono text-[11px] uppercase tracking-[0.2em] font-medium text-emerald-400">Test Result</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white drop-shadow-xl">
            Speed <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Analysis</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase tracking-wider">{date}</p>
        </div>

        {/* Global Result Card */}
        <div className="relative p-1 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.5rem] w-full max-w-2xl mx-auto shadow-2xl">
          <div className="bg-slate-950/80 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-12 border border-slate-800/50 flex flex-col items-center">
            
            <div className="flex w-full items-end justify-center gap-8 md:gap-16 border-b border-slate-800/60 pb-8 mb-8">
              
              <div className="flex flex-col items-center drop-shadow-md">
                <span className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-2"><ArrowDown className="w-4 h-4" /> Down</span>
                <div className="flex items-baseline gap-1 text-white">
                    <span className="text-5xl md:text-6xl font-light tracking-tighter" style={{ textShadow: `0 0 20px rgba(34, 211, 238, 0.4)` }}>{result.download.toFixed(1)}</span>
                    <span className="text-slate-500 font-mono text-sm uppercase tracking-wider">Mbps</span>
                </div>
              </div>
              
              <div className="w-[1px] h-16 bg-slate-800"></div>

              <div className="flex flex-col items-center drop-shadow-md">
                <span className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold uppercase tracking-widest mb-2"><ArrowUp className="w-4 h-4" /> Up</span>
                <div className="flex items-baseline gap-1 text-white">
                    <span className="text-5xl md:text-6xl font-light tracking-tighter" style={{ textShadow: `0 0 20px rgba(192, 132, 252, 0.4)` }}>{result.upload.toFixed(1)}</span>
                    <span className="text-slate-500 font-mono text-sm uppercase tracking-wider">Mbps</span>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full text-center">
                <div className="flex flex-col gap-1 items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1"><Activity className="w-3 h-3 text-yellow-400" /> Ping</span>
                    <span className="text-xl font-light text-slate-200">{result.ping.toFixed(1)} <span className="text-xs text-slate-500 font-mono">ms</span></span>
                </div>
                <div className="flex flex-col gap-1 items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">Jitter</span>
                    <span className="text-xl font-light text-slate-200">{result.jitter.toFixed(1)} <span className="text-xs text-slate-500 font-mono">ms</span></span>
                </div>
                <div className="flex flex-col gap-1 items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">Packet Loss</span>
                    <span className="text-xl font-light text-slate-200">{(result.packetLoss || 0).toFixed(1)} <span className="text-xs text-slate-500 font-mono">%</span></span>
                </div>
                <div className="flex flex-col gap-1 items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1"><Globe className="w-3 h-3 text-emerald-400" /> ISP</span>
                    <span className="text-sm font-medium text-slate-200 mt-1 truncate max-w-[100px]">{result.isp || 'Unknown'}</span>
                </div>
            </div>

          </div>
        </div>

        <div className="flex gap-4">
            <Link href="/" className="px-8 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-full font-semibold hover:bg-slate-800 transition-all shadow-md active:scale-95">
                Run New Test
            </Link>
        </div>

      </div>
    </main>
  );
}
