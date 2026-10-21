import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { buttonVariants } from '@/components/ui/button';
import { formatDate, formatMetric } from '@/lib/format';
import { getResult, resultIsp, resultLocation } from '@/lib/results';

interface ResultParams {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(props: ResultParams): Promise<Metadata> {
  const { id } = await props.params;
  const result = getResult(id);

  if (!result) {
    return { title: 'Result not found' };
  }

  const download = formatMetric(result.download);
  const upload = formatMetric(result.upload);

  const title = `${download} Mbps down · ${upload} Mbps up`;
  const description = `Download ${download} Mbps, upload ${upload} Mbps, ping ${formatMetric(
    result.ping
  )} ms on ${resultIsp(result)}.`;

  return {
    title,
    description,
    // Shared results are personal network data: readable by link, not indexed.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ResultPage(props: ResultParams) {
  const { id } = await props.params;
  const result = getResult(id);

  if (!result) {
    notFound();
  }

  const date = formatDate(result.createdAt);
  const location = resultLocation(result);
  const isp = resultIsp(result);

  return (
    <PageShell
      className="items-center px-5 pb-12 pt-20 md:px-8"
      contentClassName="justify-center"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="space-y-1.5 text-center">
          <h1 className="text-h2 font-medium text-fg">Speed test result</h1>
          <p className="text-sm text-fg-muted">
            <time dateTime={result.createdAt}>{date}</time>
          </p>
        </header>

        <article className="overflow-hidden rounded-4xl border border-line bg-surface shadow-lift">
          {/* Brand row */}
          <div className="flex items-center justify-between border-b border-line px-6 py-3.5">
            <span className="font-mono text-micro font-bold uppercase tracking-[0.18em] text-fg">
              SpeedX
            </span>
            <span className="label text-fg-subtle">Result</span>
          </div>

          <div className="p-6 md:p-8">
            {/* Headline numbers */}
            <div className="grid gap-6 sm:grid-cols-2">
              <NumberBlock
                label="Download"
                value={formatMetric(result.download)}
                tone="signal"
                icon={<ArrowDown className="size-4" aria-hidden="true" />}
              />
              <NumberBlock
                label="Upload"
                value={formatMetric(result.upload)}
                tone="upload"
                icon={<ArrowUp className="size-4" aria-hidden="true" />}
              />
            </div>

            {/* Secondary measurements */}
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 sm:grid-cols-4">
              <Stat label="Ping" value={`${formatMetric(result.ping)} ms`} />
              <Stat label="Jitter" value={`${formatMetric(result.jitter)} ms`} />
              <Stat label="Packet loss" value={`${formatMetric(result.packetLoss)}%`} />
              <div className="flex min-w-0 flex-col gap-1">
                <dt className="label text-fg-subtle">ISP</dt>
                <dd className="truncate text-sm font-medium text-fg" title={isp}>
                  {isp}
                </dd>
              </div>
            </dl>

            {/* Where it ran */}
            <div className="mt-6 border-t border-line pt-5 text-sm text-fg-muted">
              {location}
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className={buttonVariants({ variant: 'primary', size: 'lg', className: 'w-full sm:w-auto' })}
          >
            Run a test
          </Link>
          <ShareButton className="w-full sm:w-auto" />
        </div>
      </div>
    </PageShell>
  );
}

function NumberBlock({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: 'signal' | 'upload';
  icon: ReactNode;
}) {
  const toneClass = tone === 'signal' ? 'text-signal' : 'text-upload';

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className={`label flex items-center gap-1.5 ${toneClass}`}>
        {icon}
        {label}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="text-5xl font-medium tracking-tight tabular-nums text-fg md:text-6xl">
          {value}
        </span>
        <span className="font-mono text-sm uppercase tracking-wider text-fg-subtle">Mbps</span>
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="label text-fg-subtle">{label}</dt>
      <dd className="text-sm font-medium tabular-nums text-fg">{value}</dd>
    </div>
  );
}
