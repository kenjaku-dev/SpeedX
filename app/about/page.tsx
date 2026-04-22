import { Activity, Zap, Shield, Cpu, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="flex-1 w-full bg-slate-950 text-slate-100 flex flex-col items-center pt-32 pb-12 p-6 md:p-12 selection:bg-cyan-500/30 relative overflow-hidden font-sans">
      
      {/* Dark Grid Background with dynamic glow */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e293b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} 
      />
      
      <div 
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-0 pointer-events-none"
      />

      <div className="max-w-3xl w-full z-10 relative flex flex-col gap-16">
        
        {/* Header Hero */}
        <div className="text-center space-y-6 flex flex-col items-center pt-8">
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-white drop-shadow-xl">
            Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Architecture</span>
          </h1>
          <p className="text-slate-400 max-w-xl text-lg font-light leading-relaxed">
            SpeedX is a next-generation latency and bandwidth diagnostic tool engineered to bypass standard browser buffer limitations.
          </p>
        </div>

        {/* Spec Grid */}
        <div className="grid md:grid-cols-2 gap-6">
            <SpecCard 
                icon={<Cpu className="w-6 h-6 text-purple-400" />}
                title="Zero-Copy Buffer Threads"
                desc="The backend allocates a single 30MB randomized continuous memory mapped array at startup. Testing dynamically chunks directly from raw memory to bypass JavaScript garbage collection."
            />
            <SpecCard 
                icon={<Zap className="w-6 h-6 text-yellow-400" />}
                title="Dynamic Auto-Scaling"
                desc="Parallel web worker threads actively monitor your connection throughput, scaling payload chunks from 2MB to 30MB instantly to accurately saturate modern fiber-optic TCP windows."
            />
            <SpecCard 
                icon={<Activity className="w-6 h-6 text-cyan-400" />}
                title="Real-time Polling Engine"
                desc="Unlike traditional blob buffering which freezes UI threads, SpeedX utilizes an unbuffered Native Reader stream locking the browser refresh rate to a buttery smooth 100ms ticker."
            />
            <SpecCard 
                icon={<Shield className="w-6 h-6 text-emerald-400" />}
                title="Telemetry Privacy"
                desc="Edge nodes route ping responses instantly without deploying permanent tracking cookies. Temporary telemetry data calculates jitter purely via localized volatile arrays."
            />
        </div>

      </div>
    </main>
  );
}

function SpecCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-8 border border-slate-800/80 hover:bg-slate-800/40 transition-colors group">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
                <h3 className="text-lg font-medium text-slate-100 tracking-wide">{title}</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-light">
                {desc}
            </p>
        </div>
    )
}
