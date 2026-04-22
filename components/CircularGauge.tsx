'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface CircularGaugeProps {
  value: number; // 0 to max
  max?: number;
  label: string;
  unit?: string;
  size?: number;
  primaryColor?: string;
}

export function CircularGauge({
  value,
  max = 100,
  label,
  unit = 'Mbps',
  size = 340,
  primaryColor = '#38bdf8' // Default sky-400
}: CircularGaugeProps) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2 - 16;
  const circumference = radius * 2 * Math.PI;
  
  // Make it a 3/4 circle
  const arcLength = circumference * 0.75;
  const strokeDasharray = `${arcLength} ${circumference}`;
  
  // Map value to arc (clamped)
  const safeValue = Math.min(Math.max(value, 0), max);
  const percent = safeValue / max;
  const offset = arcLength - percent * arcLength;

  return (
    <div className="relative flex flex-col items-center justify-center font-sans tracking-tight" style={{ width: size, height: size }}>
      {/* Background ambient glow matching primary color */}
      <div 
        className="absolute inset-0 rounded-full blur-[80px] opacity-20 transition-colors duration-700 pointer-events-none" 
        style={{ backgroundColor: primaryColor }}
      />
      
      <svg
        className="transform rotate-[135deg] relative z-10"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer tick ring (subtle) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 16}
          fill="transparent"
          stroke="#1e293b" // slate-800
          strokeWidth="2"
          strokeDasharray="4 12"
          strokeDashoffset="0"
          strokeLinecap="round"
        />

        {/* Background Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#0f172a" // slate-900
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />

        {/* Foreground Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter="url(#neon-glow)"
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        />
      </svg>

      {/* Inner Label */}
      <div className="absolute flex flex-col items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <motion.span 
          layoutId="gauge-label"
          className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-bold mb-2 transition-colors duration-500"
          style={{ color: primaryColor === '#475569' ? '#94a3b8' : primaryColor }}
        >
          {label}
        </motion.span>
        
        <div className="flex items-baseline justify-center">
          <motion.span 
            layoutId="gauge-value"
            className="text-7xl md:text-8xl font-light tracking-tighter text-slate-50 drop-shadow-md"
          >
            {safeValue.toFixed(1)}
          </motion.span>
        </div>
        
        <motion.span 
          layoutId="gauge-unit"
          className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest bg-slate-900/50 backdrop-blur-sm border border-slate-800 px-3 py-1 rounded-full shadow-inner"
        >
          {unit}
        </motion.span>
      </div>
    </div>
  );
}
