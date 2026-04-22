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
  size = 320,
  primaryColor = '#0f172a' 
}: CircularGaugeProps) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2 - 10;
  const circumference = radius * 2 * Math.PI;
  
  // Make it a 3/4 circle
  const arcLength = circumference * 0.75;
  const strokeDasharray = `${arcLength} ${circumference}`;
  
  // Map value to arc (clamped)
  const safeValue = Math.min(Math.max(value, 0), max);
  const percent = safeValue / max;
  const offset = arcLength - percent * arcLength;

  return (
    <div className="relative flex flex-col items-center justify-center font-sans tracking-tight drop-shadow-sm" style={{ width: size, height: size }}>
      <svg
        className="transform rotate-[135deg]"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer tick ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 12}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth="2"
          strokeDasharray="4 8"
          strokeDashoffset="0"
          strokeLinecap="round"
        />

        {/* Background Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#f1f5f9" // slate-100
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
          filter="url(#glow)"
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
      </svg>

      {/* Inner Label */}
      <div className="absolute flex flex-col items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.span 
          layoutId="gauge-label"
          className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-bold mb-2"
        >
          {label}
        </motion.span>
        
        <div className="flex items-baseline justify-center">
          <motion.span 
            layoutId="gauge-value"
            className="text-7xl font-light tracking-tighter text-slate-900"
          >
            {safeValue.toFixed(1)}
          </motion.span>
        </div>
        
        <motion.span 
          layoutId="gauge-unit"
          className="text-slate-400 font-mono text-sm mt-1 bg-slate-100/50 px-2 py-0.5 rounded-md"
        >
          {unit}
        </motion.span>
      </div>
    </div>
  );
}
