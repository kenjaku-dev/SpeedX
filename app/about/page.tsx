import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/PageShell';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'How SpeedX measures ping, download and upload, why chunk sizes change, what can skew a result, and what a saved result stores.',
};

const phases = [
  {
    step: '01',
    title: 'Ping',
    meta: '10 round trips',
    tone: 'text-fg',
    body: 'The browser times ten requests to the server. The average round trip becomes the ping reading; jitter is the average change between consecutive samples; failed requests count as packet loss.',
  },
  {
    step: '02',
    title: 'Download',
    meta: '8 seconds · 4 streams',
    tone: 'text-signal',
    body: 'Four parallel requests pull pre-generated chunks from the server. Bytes are counted as they arrive, and the chunk size grows with the measured rate.',
  },
  {
    step: '03',
    title: 'Upload',
    meta: '8 seconds · 3 streams',
    tone: 'text-upload',
    body: 'The browser sends generated data to the server, which reads and discards it. As with download, the payload size follows the measured rate.',
  },
];

export default function AboutPage() {
  return (
    <PageShell className="items-center px-5 pb-20 pt-28 md:px-8 md:pt-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 md:gap-12">
        <header className="flex flex-col gap-4">
          <p className="label text-fg-subtle">Method</p>
          <h1 className="text-h1 font-medium text-fg">How the test works</h1>
          <p className="max-w-2xl text-base leading-relaxed text-fg-muted md:text-lg">
            SpeedX runs three measurements between this browser and the server that delivered the
            page. A full test takes about 16 seconds.
          </p>
        </header>

        <ol
          role="list"
          className="grid overflow-hidden rounded-4xl border border-line bg-surface sm:grid-cols-3"
        >
          {phases.map((phase, index) => (
            <li
              key={phase.step}
              className={cn(
                'flex flex-col gap-3 px-6 py-6',
                index > 0 && 'border-t border-line sm:border-l sm:border-t-0'
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-micro tracking-[0.14em] text-fg-subtle">
                  {phase.step}
                </span>
                <span className="font-mono text-micro uppercase tracking-[0.14em] text-fg-subtle">
                  {phase.meta}
                </span>
              </div>
              <h2 className={cn('text-h3 font-medium', phase.tone)}>{phase.title}</h2>
              <p className="text-sm leading-relaxed text-fg-muted">{phase.body}</p>
            </li>
          ))}
        </ol>

        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          <section className="border-t border-line pt-5">
            <h2 className="text-h3 font-medium text-fg">Reading the numbers</h2>
            <dl className="mt-4 space-y-3 text-sm leading-relaxed">
              <div className="flex flex-col gap-0.5">
                <dt className="font-medium text-fg">Ping</dt>
                <dd className="text-fg-muted">
                  The average round-trip time across ten attempts from this browser, including
                  request overhead. It reads a little higher than a network-level ping.
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-medium text-fg">Jitter</dt>
                <dd className="text-fg-muted">
                  The average change between consecutive ping samples. Lower is steadier.
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-medium text-fg">Packet loss</dt>
                <dd className="text-fg-muted">
                  The share of the ten pings that did not come back.
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-medium text-fg">Download and upload</dt>
                <dd className="text-fg-muted">
                  The average rate over each eight-second phase, not the peak reading.
                </dd>
              </div>
            </dl>
          </section>

          <section className="border-t border-line pt-5">
            <h2 className="text-h3 font-medium text-fg">Why the chunks change</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-fg-muted">
              <p>
                Download starts with 5 MB requests and can grow to 30 MB; upload starts at 2 MB and
                can grow to 15 MB. The size follows the measured rate, so a slow link still
                completes requests and a fast link is not limited by round trips.
              </p>
              <p>Four download streams and three upload streams run at the same time.</p>
            </div>
          </section>

          <section className="border-t border-line pt-5">
            <h2 className="text-h3 font-medium text-fg">What can skew a result</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-fg-muted">
              <li>Wi-Fi signal and interference.</li>
              <li>Device CPU, battery saver, or other open tabs.</li>
              <li>A VPN, proxy, or privacy extension.</li>
              <li>Distance to and load on the server.</li>
              <li>Other traffic on the connection.</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              A browser test measures one path to one server, not the rate on your plan.
            </p>
          </section>

          <section className="border-t border-line pt-5">
            <h2 className="text-h3 font-medium text-fg">Limits</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-fg-muted">
              <p>
                The test runs for about 16 seconds against the server that served this page. Treat
                it as a useful check, not a certification: results move with the network, the
                device, and the time of day.
              </p>
              <p>Run it more than once before drawing a conclusion.</p>
            </div>
          </section>
        </div>

        <section className="rounded-4xl border border-line bg-surface p-6 md:p-8">
          <h2 className="text-h3 font-medium text-fg">What is stored</h2>
          <div className="mt-4 grid gap-4 text-sm leading-relaxed text-fg-muted md:grid-cols-2">
            <p>
              A saved result keeps the measurements, ISP, approximate city and country, the server
              that ran the test, and the time. It does not keep your IP address, name, or account.
            </p>
            <p>
              There are no cookies or analytics. ISP and city come from a third-party lookup of the
              connecting IP when the page loads. Result links are not indexed by search engines, but anyone with the
              link can open one.
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-fg-muted">Ready to measure this connection?</p>
          <Link
            href="/"
            className={buttonVariants({ variant: 'primary', size: 'lg', className: 'w-full sm:w-auto' })}
          >
            Start test
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
