'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';

interface ShareButtonProps {
  /** Path relative to the current origin. Omit to copy the current page URL. */
  path?: string;
  className?: string;
  /** Hide the label on narrow screens, keeping the icon as the control. */
  compact?: boolean;
}

export function ShareButton({ path, className, compact }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    const url = path ? new URL(path, window.location.origin).toString() : window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      setState('failed');
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2400);
  };

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy link';

  return (
    <>
      <Button
        variant="outline"
        onClick={copy}
        className={className}
        aria-label={state === 'copied' ? 'Result link copied' : 'Copy result link'}
      >
        {state === 'copied' ? (
          <Check className="text-success" aria-hidden="true" />
        ) : state === 'failed' ? (
          <AlertCircle className="text-danger" aria-hidden="true" />
        ) : (
          <Share2 aria-hidden="true" />
        )}
        <span className={compact ? 'hidden sm:inline' : undefined}>{label}</span>
      </Button>

      <Toast
        open={state !== 'idle'}
        icon={
          state === 'failed' ? (
            <AlertCircle className="size-4 shrink-0 text-danger" aria-hidden="true" />
          ) : undefined
        }
      >
        {state === 'failed'
          ? 'Couldn’t copy — use the address bar'
          : 'Link copied to clipboard'}
      </Toast>
    </>
  );
}
