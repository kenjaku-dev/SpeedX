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
      displayLabel = 'Start Test';
      displayUnit = '';
      activeColor = '#0f172a'; // slate-900
      break;
    case 'ping':
      displayValue = metrics.ping;
      displayLabel = 'Ping';
      displayUnit = 'ms';
      activeColor = '#eab308'; // yellow-500
      break;
    case 'download':
      displayValue = metrics.download;
      displayLabel = 'Download';
      displayUnit = 'Mbps';
      activeColor = '#0ea5e9'; // sky-500
      break;
    case 'upload':
      displayValue = metrics.upload;
      displayLabel = 'Upload';
      displayUnit = 'Mbps';
      activeColor = '#8b5cf6'; // violet-500
      break;
    case 'complete':
      displayValue = metrics.download; // show top score
      displayLabel = 'Complete';
      displayUnit = 'Mbps Down';
      activeColor = '#10b981'; // emerald-500
      break;
    case 'aborted':
      displayValue = 0;
      displayLabel = 'Aborted';
      displayUnit = '';
      activeColor = '#ef4444'; // red-500
      break;
  }

  const isTesting = ['ping', 'download', 'upload'].includes(metrics.stage);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 md:p-24 selection:bg-sky-200 relative overflow-hidden">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f172a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} 
      />

      <div className="max-w-4xl w-full flex flex-col items-center gap-12 z-10 relative">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-200/60 mb-2 drop-shadow-sm">
             <Activity className="w-4 h-4 text-sky-500 mr-2" />
             <span className="font-mono text-[11px] uppercase tracking-widest font-bold text-slate-600">SpeedX Engine</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-slate-900 drop-shadow-sm">Measure your precise speed.</h1>
        </div>

        {/* Gauge Section */}
        <div className="relative p-10 bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-xl border border-white flex flex-col items-center w-full max-w-lg mx-auto">
          
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={handleAbort}
                  className="flex items-center gap-2 px-10 py-4 bg-white text-red-500 rounded-full font-semibold hover:bg-red-50 transition-all shadow-md active:scale-95 border border-red-100"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Stop Test
                </motion.button>
              ) : (
                <motion.button
                  key="start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={handleStart}
                  className="flex items-center gap-2 px-12 py-4 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {metrics.stage === 'complete' || metrics.stage === 'aborted' ? 'Test Again' : 'Start Test'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
          
          {/* Metrics Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-slate-200/60 flex flex-wrap items-stretch justify-around gap-6">
            <MetricItem icon={<Activity className="text-yellow-500 w-5 h-5" />} label="Ping" value={metrics.ping > 0 ? metrics.ping.toFixed(1) : '-'} unit="ms" />
            <MetricItem icon={<ArrowDown className="text-sky-500 w-5 h-5" />} label="Download" value={metrics.download > 0 ? metrics.download.toFixed(1) : '-'} unit="Mbps" highlight={metrics.stage === 'download' || metrics.stage === 'complete'} />
            <MetricItem icon={<ArrowUp className="text-violet-500 w-5 h-5" />} label="Upload" value={metrics.upload > 0 ? metrics.upload.toFixed(1) : '-'} unit="Mbps" highlight={metrics.stage === 'upload' || metrics.stage === 'complete'} />
          </div>

          {/* Network Details Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-slate-200/60 grid grid-cols-2 gap-y-6 gap-x-4">
             <DetailItem icon={<Globe className="w-4 h-4 text-slate-400" />} label="ISP" value={serverInfo?.isp || 'Detecting...'} />
             <DetailItem icon={<MapPin className="w-4 h-4 text-slate-400" />} label="Location" value={`${serverInfo?.city || ''}, ${serverInfo?.country || ''}`} />
             <DetailItem icon={<Server className="w-4 h-4 text-slate-400" />} label="Server" value={serverInfo?.server || 'Detecting...'} />
             <DetailItem icon={<Activity className="w-4 h-4 opacity-0" />} label="IP Address" value={serverInfo?.ip || 'Detecting...'} className="font-mono text-sm font-medium" />
          </div>

        </div>

      </div>
    </main>
  );
}

function MetricItem({ icon, label, value, unit, highlight }: { icon: React.ReactNode, label: string, value: string | number, unit: string, highlight?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center flex-1 min-w-[80px] transition-all", highlight && "scale-105 drop-shadow-sm")}>
      <div className="flex items-center gap-1.5 mb-2 text-slate-500 text-xs font-semibold uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 text-slate-900 border-b-2 border-slate-100 pb-1 w-full justify-center">
        <span className="text-3xl font-mono tracking-tighter">{value}</span>
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{unit}</span>
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: string, className?: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
         {icon} {label}
      </div>
      <div className={cn("text-slate-800 font-medium text-sm truncate", className)}>
        {value}
      </div>
    </div>
  )
}
