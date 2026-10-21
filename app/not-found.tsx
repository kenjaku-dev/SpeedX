import type { Metadata } from 'next';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageShell className="items-center justify-center px-6 pb-16 pt-32">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-line bg-surface">
          <FileQuestion className="size-6 text-signal" aria-hidden="true" />
        </div>

        <div className="space-y-3">
          <p className="font-mono text-micro uppercase tracking-[0.2em] text-fg-subtle">Error 404</p>
          <h1 className="text-h2 font-medium text-fg">Page not found</h1>
          <p className="text-sm leading-relaxed text-fg-muted">
            The link may be wrong, or the page may have been removed. Run a new test to get a
            fresh share link.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonVariants({ variant: 'primary', size: 'md' })}>
            Run a speed test
          </Link>
          <Link href="/about" className={buttonVariants({ variant: 'outline', size: 'md' })}>
            How it works
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
