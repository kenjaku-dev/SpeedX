'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CircularGauge } from '@/components/CircularGauge';
import { useAppStore } from '@/store/useAppStore';
import { Play, Square, Activity, ArrowDown, ArrowUp, Globe, MapPin, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

export default function SpeedTestPage() {
  const { metrics, serverInfo, setMetrics, setStage, setServerInfo, reset } = useAppStore();
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Fetch initial IP info
    fetch('/api/ip').then(res => res.json()).then(data => {
      setServerInfo(data);
    });

    // Initialize worker
    workerRef.current = new Worker(new URL('../workers/speedTestWorker.ts', import.meta.url));
    workerRef.current.onmessage = (e) => {
      const { type, stage, metrics: newMetrics } = e.data;
      if (type === 'update') {
        if (stage === 'complete' && metrics.stage !== 'complete') {
          // Trigger confetti once
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          
          // Save result to DB
          fetch('/api/result', {
            method: 'POST',
            body: JSON.stringify({ ...metrics, ...newMetrics, ...serverInfo }),
          });
        }
        setStage(stage);
        setMetrics(newMetrics);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleStart = () => {
    reset();
    setStage('ping');
    workerRef.current?.postMessage({ command: 'start' });
  };

  const handleAbort = () => {
    workerRef.current?.postMessage({ command: 'abort' });
    setStage('aborted');
  };

  // Determine what to show on gauge
  let displayValue = 0;
  let displayLabel = 'Ready';
  let displayUnit = '';
  let activeColor = '#d1d5db'; // gray-300

  switch (metrics.stage) {
    case 'idle':
      displayValue = 0;
      displayLabel = 'Ready to Test';
      displayUnit = 'Network';
      activeColor = '#475569'; // slate-600
      break;
    case 'ping':
      displayValue = metrics.ping;
      displayLabel = 'Ping';
      displayUnit = 'ms';
      activeColor = '#fde047'; // yellow-300
      break;
    case 'download':
      displayValue = metrics.download;
      displayLabel = 'Download';
      displayUnit = 'Mbps';
      activeColor = '#22d3ee'; // cyan-400
      break;
    case 'upload':
      displayValue = metrics.upload;
      displayLabel = 'Upload';
      displayUnit = 'Mbps';
      activeColor = '#c084fc'; // purple-400
      break;
    case 'complete':
      displayValue = metrics.download; // show top score
      displayLabel = 'Complete';
      displayUnit = 'Mbps Down';
      activeColor = '#34d399'; // emerald-400
      break;
    case 'aborted':
      displayValue = 0;
      displayLabel = 'Aborted';
      displayUnit = '';
      activeColor = '#f87171'; // red-400
      break;
  }

  const isTesting = ['ping', 'download', 'upload'].includes(metrics.stage);

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
        <div className="text-center space-y-4 pt-12">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white drop-shadow-xl">Global Node <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Telemetry</span></h1>
        </div>

        {/* Gauge Section */}
        <div className="relative p-10 bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-slate-800/80 flex flex-col items-center w-full max-w-lg mx-auto">
          
          <CircularGauge 
            value={displayValue} 
            max={displayUnit === 'ms' ? 200 : 1000} 
            label={displayLabel} 
            unit={displayUnit} 
            primaryColor={activeColor} 
          />

          <div className="mt-10 h-16 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isTesting ? (
                <motion.button
                  key="stop"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleAbort}
                  className="group flex items-center gap-3 px-10 py-3.5 bg-slate-950 text-slate-300 rounded-full font-semibold hover:text-red-400 transition-all active:scale-95 border border-slate-800 hover:border-red-900/50"
                >
                  <Square className="w-4 h-4 fill-current group-hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] transition-all" />
                  Terminate
                </motion.button>
              ) : (
                <motion.button
                  key="start"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleStart}
                  className="relative group flex items-center justify-center gap-3 px-12 py-4 bg-slate-50 text-slate-950 rounded-full font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {metrics.stage === 'complete' || metrics.stage === 'aborted' ? 'Restart Sequence' : 'Commence Uplink'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
          
          {/* Metrics Card */}
          <div className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-8 shadow-xl border border-slate-800/80 flex flex-wrap items-stretch justify-around gap-6">
            <MetricItem icon={<Activity className="text-yellow-400 w-5 h-5" />} label="Ping" value={metrics.ping > 0 ? metrics.ping.toFixed(1) : '-'} unit="ms" />
            <MetricItem icon={<ArrowDown className="text-cyan-400 w-5 h-5" />} label="Download" value={metrics.download > 0 ? metrics.download.toFixed(1) : '-'} unit="Mbps" highlight={metrics.stage === 'download' || metrics.stage === 'complete'} color="#22d3ee" />
            <MetricItem icon={<ArrowUp className="text-purple-400 w-5 h-5" />} label="Upload" value={metrics.upload > 0 ? metrics.upload.toFixed(1) : '-'} unit="Mbps" highlight={metrics.stage === 'upload' || metrics.stage === 'complete'} color="#c084fc" />
          </div>

          {/* Network Details Card */}
          <div className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-8 shadow-xl border border-slate-800/80 grid grid-cols-2 gap-y-6 gap-x-4">
             <DetailItem icon={<Globe className="w-4 h-4 text-slate-500" />} label="ISP" value={serverInfo?.isp || 'Detecting...'} />
             <DetailItem icon={<MapPin className="w-4 h-4 text-slate-500" />} label="Location" value={`${serverInfo?.city || ''}, ${serverInfo?.country || ''}`} />
             <DetailItem icon={<Activity className="w-4 h-4 text-slate-500" />} label="Jitter" value={metrics.jitter > 0 ? `${metrics.jitter.toFixed(1)} ms` : '-'} />
             <DetailItem icon={<Server className="w-4 h-4 text-slate-500" />} label="Packet Loss" value={metrics.packetLoss !== undefined && metrics.ping > 0 ? `${metrics.packetLoss.toFixed(1)}%` : '-'} />
             <DetailItem icon={<Activity className="w-4 h-4 opacity-0" />} label="IPv4 Address" value={serverInfo?.ip || 'Detecting...'} className="font-mono text-xs text-slate-300 col-span-2" />
          </div>

        </div>

      </div>
    </main>
  );
}

function MetricItem({ icon, label, value, unit, highlight, color }: { icon: React.ReactNode, label: string, value: string | number, unit: string, highlight?: boolean, color?: string }) {
  return (
    <div className={cn("flex flex-col items-center flex-1 min-w-[80px] transition-all duration-500", highlight ? "scale-105" : "opacity-70 grayscale-[30%]")}>
      <div className="flex items-center gap-1.5 mb-2 text-slate-400 text-xs font-semibold uppercase tracking-widest drop-shadow-md">
        <span className={cn("transition-colors", highlight ? "" : "text-slate-500")}>
          {icon}
        </span>
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 text-white border-b border-slate-800/60 pb-2 w-full justify-center">
        <span className="text-3xl font-light tracking-tighter" style={{ textShadow: highlight && color ? `0 0 20px ${color}80` : 'none' }}>{value}</span>
        <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">{unit}</span>
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: string, className?: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-slate-800/30 transition-colors">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
         {icon} {label}
      </div>
      <div className={cn("text-slate-200 font-medium text-sm truncate", className)}>
        {value}
      </div>
    </div>
  )
}
