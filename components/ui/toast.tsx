'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ToastProps {
  open: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Presentational toast pinned above the bottom edge. The caller owns the open
 * state; `role="status"` makes it announce itself without stealing focus.
 *
 * It renders through a portal because page content lives in its own stacking
 * context (`z-10` in PageShell) and would otherwise paint under the footer.
 * Animated with CSS rather than a motion library: a toast is not worth 50 kB.
 */
const emptySubscribe = () => () => {};

/** Hydration-safe "are we on the client" without a mount effect. */
function useIsClient() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function Toast({ open, children, icon, className }: ToastProps) {
  const isClient = useIsClient();

  if (!isClient) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-6 sm:bottom-24"
    >
      {open ? (
        <div
          role="status"
          className={cn(
            'flex animate-in items-center gap-2 rounded-full border border-line bg-surface-raised px-4 py-2.5 shadow-lift fade-in-0 slide-in-from-bottom-2 duration-200',
            className
          )}
        >
          {icon ?? <Check className="size-4 shrink-0 text-success" aria-hidden="true" />}
          <span className="text-sm font-medium text-fg">{children}</span>
        </div>
      ) : null}
    </div>,
    document.body
  );
}
