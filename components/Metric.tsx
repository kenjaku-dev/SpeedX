import * as React from 'react';

import { cn } from '@/lib/utils';

export type MetricTone = 'neutral' | 'signal' | 'upload' | 'success' | 'warning' | 'danger';

const toneText: Record<MetricTone, string> = {
  neutral: 'text-fg',
  signal: 'text-signal',
  upload: 'text-upload',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

interface MetricProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: MetricTone;
  className?: string;
}

/** A single readout: micro label above, tabular figure below. */
export function Metric({ label, value, unit, tone = 'neutral', className }: MetricProps) {
  return (
    <div className={cn('flex min-w-0 flex-col items-center gap-1', className)}>
      <span className="label text-fg-subtle">{label}</span>
      <span className="flex items-baseline gap-1">
        <span
          className={cn('text-xl font-medium tracking-tight tabular-nums md:text-3xl', toneText[tone])}
        >
          {value}
        </span>
        {unit ? <span className="font-mono text-micro uppercase text-fg-subtle">{unit}</span> : null}
      </span>
    </div>
  );
}

interface DetailProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  title?: string;
}

/** A compact label/value pair for secondary network metadata. */
export function Detail({ label, value, className, title }: DetailProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="label text-fg-subtle">{label}</span>
      <span className={cn('truncate text-sm font-medium text-fg', className)} title={title}>
        {value}
      </span>
    </div>
  );
}
