'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type GaugeTone = 'neutral' | 'signal' | 'upload' | 'success' | 'warning' | 'danger';

const toneColor: Record<GaugeTone, string> = {
  neutral: 'text-fg-subtle',
  signal: 'text-signal',
  upload: 'text-upload',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

interface CircularGaugeProps {
  value: number; // 0 to max
  max?: number;
  label: string;
  unit?: string;
  tone?: GaugeTone;
  className?: string;
}

// The SVG is drawn in a fixed coordinate space and scales with its container,
// so the ring never clips on narrow screens.
const VIEW = 340;
const STROKE = 14;
const RADIUS = (VIEW - STROKE) / 2 - 16;

export function CircularGauge({
  value,
  max = 100,
  label,
  unit,
  tone = 'signal',
  className,
}: CircularGaugeProps) {
  const circumference = RADIUS * 2 * Math.PI;

  // Make it a 3/4 circle
  const arcLength = circumference * 0.75;
  const strokeDasharray = `${arcLength} ${circumference}`;

  // Map value to arc (clamped)
  const safeValue = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? safeValue / max : 0;
  const offset = arcLength - percent * arcLength;
  const colorClass = toneColor[tone];

  return (
    <div className={cn('relative aspect-square w-full max-w-[300px]', className)}>
      {/* Ambient glow matching the active tone */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 rounded-full transition-opacity duration-700',
          colorClass,
          tone === 'neutral' ? 'opacity-0' : 'opacity-25'
        )}
        style={{
          background:
            'radial-gradient(circle, transparent 45%, currentColor 62%, transparent 72%)',
        }}
      />

      <svg
        aria-hidden="true"
        className="relative z-10 h-full w-full rotate-[135deg]"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
      >
        {/* Outer tick ring (subtle) */}
        <circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={RADIUS + 16}
          fill="transparent"
          strokeWidth="2"
          strokeDasharray="4 12"
          strokeDashoffset="0"
          strokeLinecap="round"
          className="stroke-line-strong"
        />

        {/* Background Arc */}
        <circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={RADIUS}
          fill="transparent"
          strokeWidth={STROKE}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="stroke-surface-hover"
        />

        {/* Foreground Arc */}
        <circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={RADIUS}
          fill="transparent"
          strokeWidth={STROKE}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className={colorClass}
          stroke="currentColor"
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 180ms linear' }}
        />
      </svg>

      {/* Inner readout. The numbers here are duplicated by the labelled
          readouts below, so the gauge itself stays out of the accessibility
          tree instead of being re-read on every sample. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
      >
        <span className="label mb-2 text-fg-muted">{label}</span>

        <span className="text-display font-medium leading-none tabular-nums text-fg">
          {safeValue.toFixed(1)}
        </span>

        {unit ? (
          <span className="mt-2 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-micro uppercase text-fg-subtle">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
