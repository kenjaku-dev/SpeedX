'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { Button, buttonVariants } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[speedx] unhandled error', error);
  }, [error]);

  return (
    <PageShell className="items-center justify-center px-6 pb-16 pt-32">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-danger/40 bg-danger/10">
          <TriangleAlert className="size-6 text-danger" aria-hidden="true" />
        </div>

        <div className="space-y-3">
          <h1 className="text-h2 font-medium text-fg">Something went wrong</h1>
          <p className="text-sm leading-relaxed text-fg-muted">
            The page failed to load. Try again; if it keeps happening, the link may be broken.
          </p>
          {error.digest && (
            <p className="font-mono text-micro text-fg-subtle">Reference: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="primary" size="md" onClick={reset}>
            Try again
          </Button>
          <Link href="/" className={buttonVariants({ variant: 'outline', size: 'md' })}>
            Back to the speed test
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
