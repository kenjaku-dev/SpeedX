'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CircularGauge, type GaugeTone } from '@/components/CircularGauge';
import { Metric, Detail } from '@/components/Metric';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ShareButton';
import { useAppStore } from '@/store/useAppStore';
import { Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TestStage } from '@/workers/speedTestWorker';
import { knownString } from '@/lib/format';

const STAGE_COPY: Record<TestStage, { label: string; tone: GaugeTone; dot: string }> = {
  idle: { label: 'Ready', tone: 'neutral', dot: 'bg-fg-subtle' },
  ping: { label: 'Measuring latency', tone: 'signal', dot: 'bg-signal animate-pulse' },
  download: { label: 'Measuring download', tone: 'signal', dot: 'bg-signal animate-pulse' },
  upload: { label: 'Measuring upload', tone: 'upload', dot: 'bg-upload animate-pulse' },
  complete: { label: 'Test complete', tone: 'signal', dot: 'bg-success' },
  aborted: { label: 'Test stopped', tone: 'neutral', dot: 'bg-danger' },
};

// Coarse ceilings, so the arc never sits pinned at 100% on a fast line or
// shrinks to a sliver on a slow one.
const MBPS_SCALE = [100, 250, 500, 1000, 2000, 5000, 10000];
const PING_SCALE = [20, 50, 100, 200, 500];

function scaleFor(value: number, steps: number[]): number {
  for (const step of steps) {
    if (value <= step * 0.95) return step;
  }
  return steps[steps.length - 1];
}

export default function SpeedTestPage() {
  const { metrics, serverInfo, resultId, setMetrics, setStage, setResultId, setServerInfo, reset } =
    useAppStore();
  const workerRef = useRef<Worker | null>(null);
  const runSavedRef = useRef(false);
  const saveTokenRef = useRef(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    let disposed = false;
    const worker = new Worker(new URL('../workers/speedTestWorker.ts', import.meta.url));
    workerRef.current = worker;

    // Fetch initial IP info
    fetch('/api/ip')
      .then((res) => res.json())
      .then((data) => {
        if (!disposed) setServerInfo(data);
      })
      .catch(() => {
        // Keep the placeholders; the test itself still works.
      });

    worker.onmessage = (e) => {
      const { type, stage, metrics: newMetrics } = e.data;
      if (type !== 'update') return;

      if (stage === 'complete' && !runSavedRef.current) {
        runSavedRef.current = true;

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          // Load the celebration only when there is something to celebrate;
          // it is not part of the initial route bundle.
          void import('canvas-confetti')
            .then(({ default: confetti }) =>
              confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
            )
            .catch(() => {
              // Celebration is optional; a failed chunk must not touch the result.
            });
        }

        // Read the store instead of closing over render state: this handler is
        // registered once, so `serverInfo` here would always be null.
        const { serverInfo: currentServerInfo } = useAppStore.getState();
        const saveToken = saveTokenRef.current;
        setSaveState('saving');
        fetch('/api/result', {
          method: 'POST',
          body: JSON.stringify({ ...newMetrics, ...currentServerInfo }),
        })
          .then((res) => res.json())
          .then((data) => {
            // Ignore a slow save if the visitor has already started a new test.
            if (saveToken !== saveTokenRef.current) return;

            if (data.success && data.id) {
              setResultId(data.id);
              setSaveState('saved');
            } else {
              setSaveState('failed');
            }
          })
          .catch(() => {
            // Sharing is a bonus; a failed save must never break the result UI.
            if (saveToken !== saveTokenRef.current) return;
            setSaveState('failed');
          });
      }

      setStage(stage);
      setMetrics(newMetrics);
    };

    return () => {
      disposed = true;
      worker.terminate();
      workerRef.current = null;
    };
  }, [setMetrics, setStage, setResultId, setServerInfo]);

  const handleStart = () => {
    saveTokenRef.current += 1;
    runSavedRef.current = false;
    reset();
    setSaveState('idle');
    setStage('ping');
    workerRef.current?.postMessage({ command: 'start' });
  };

  const handleAbort = () => {
    workerRef.current?.postMessage({ command: 'abort' });
    setStage('aborted');
  };

  const stage = metrics.stage;
  const copy = STAGE_COPY[stage];
  const isTesting = stage === 'ping' || stage === 'download' || stage === 'upload';

  // What the gauge displays, and the scale its arc is drawn against.
  let displayValue = 0;
  let displayLabel = 'Speed';
  let displayUnit = 'Mbps';
  let scaleMax = 100;

  switch (stage) {
    case 'ping':
      displayValue = metrics.ping;
      displayLabel = 'Latency';
      displayUnit = 'ms';
      scaleMax = scaleFor(metrics.ping, PING_SCALE);
      break;
    case 'download':
      displayValue = metrics.download;
      displayLabel = 'Download';
      displayUnit = 'Mbps';
      scaleMax = scaleFor(metrics.download, MBPS_SCALE);
      break;
    case 'upload':
      displayValue = metrics.upload;
      displayLabel = 'Upload';
      displayUnit = 'Mbps';
      scaleMax = scaleFor(metrics.upload, MBPS_SCALE);
      break;
    case 'complete':
      displayValue = metrics.download;
      displayLabel = 'Download';
      displayUnit = 'Mbps';
      scaleMax = scaleFor(metrics.download, MBPS_SCALE);
      break;
    case 'aborted':
      displayLabel = 'Stopped';
      break;
  }

  const statusNote = isTesting
    ? `${Math.round(metrics.progress)}%`
    : stage === 'complete'
      ? saveState === 'saved'
        ? 'Result saved'
        : saveState === 'failed'
          ? 'Result not saved'
          : 'Saving result…'
      : stage === 'aborted'
        ? 'Not saved'
        : 'About 16 seconds';

  const isp = knownString(serverInfo?.isp) ?? '—';
  const location =
    [knownString(serverInfo?.city), knownString(serverInfo?.country)].filter(Boolean).join(', ') || '—';
  const ip = knownString(serverInfo?.ip) ?? '—';

  return (
    <PageShell className="items-center px-5 pb-12 pt-24 md:px-8 md:pt-28">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-2 text-center">
          <h1 className="text-h1 font-medium text-fg">Internet speed test</h1>
          <p className="text-sm text-fg-muted md:text-base">
            Measure download, upload, and latency from this device.
          </p>
        </header>

        <section
          aria-label="Speed test"
          className="overflow-hidden rounded-4xl border border-line bg-surface shadow-lift"
        >
          {/* Status bar */}
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <span
              role="status"
              aria-live="polite"
              className="label flex min-w-0 items-center gap-2 text-fg-muted"
            >
              <span className={cn('size-2 shrink-0 rounded-full', copy.dot)} aria-hidden="true" />
              <span className="truncate">{copy.label}</span>
            </span>
            <span className="shrink-0 font-mono text-micro uppercase tracking-[0.14em] text-fg-subtle">
              {statusNote}
            </span>
          </div>

          {/* Gauge + action */}
          <div className="flex flex-col items-center px-5 pb-5 pt-4 md:px-8 md:pb-6 md:pt-5">
            <CircularGauge
              value={displayValue}
              max={scaleMax}
              label={displayLabel}
              unit={displayUnit}
              tone={copy.tone}
            />

            <div className="mt-4 flex min-h-12 flex-wrap items-center justify-center gap-3 md:mt-5">
              <Button
                variant={isTesting ? 'danger' : 'primary'}
                size="lg"
                onClick={isTesting ? handleAbort : handleStart}
                aria-label={isTesting ? 'Stop the speed test' : undefined}
              >
                {isTesting ? (
                  <Square className="fill-current" aria-hidden="true" />
                ) : (
                  <Play className="fill-current" aria-hidden="true" />
                )}
                {isTesting
                  ? 'Stop'
                  : stage === 'complete' || stage === 'aborted'
                    ? 'Test again'
                    : 'Start test'}
              </Button>

              {!isTesting && resultId && stage === 'complete' && (
                <ShareButton path={`/result/${resultId}`} compact />
              )}
            </div>
          </div>

          {/* Readouts */}
          <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
            <div className="px-3 py-3.5 md:py-4">
              <Metric
                label="Ping"
                value={metrics.ping > 0 ? metrics.ping.toFixed(1) : '—'}
                unit="ms"
              />
            </div>
            <div className="px-3 py-3.5 md:py-4">
              <Metric
                label="Download"
                value={metrics.download > 0 ? metrics.download.toFixed(1) : '—'}
                unit="Mbps"
                tone="signal"
              />
            </div>
            <div className="px-3 py-3.5 md:py-4">
              <Metric
                label="Upload"
                value={metrics.upload > 0 ? metrics.upload.toFixed(1) : '—'}
                unit="Mbps"
                tone="upload"
              />
            </div>
          </div>

          {/* The gauge is aria-hidden; these announce the milestones once. */}
          <p className="sr-only" role="status" aria-live="polite">
            {stage === 'complete'
              ? `Download ${metrics.download.toFixed(1)} megabits per second. Upload ${metrics.upload.toFixed(
                  1
                )} megabits per second. Latency ${metrics.ping.toFixed(1)} milliseconds.`
              : ''}
          </p>
          <p className="sr-only" role="status" aria-live="polite">
            {stage === 'complete' && saveState === 'saved'
              ? 'Result saved. The copy link action is now available.'
              : stage === 'complete' && saveState === 'failed'
                ? 'Result could not be saved. The copy link action is unavailable.'
                : ''}
          </p>
        </section>

        {/* Secondary network metadata */}
        <div className="border-t border-line pt-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 md:grid-cols-5">
            <Detail label="ISP" value={isp} title={isp} />
            <Detail label="Location" value={location} title={location} />
            <Detail
              label="Jitter"
              value={metrics.jitter > 0 ? `${metrics.jitter.toFixed(1)} ms` : '—'}
            />
            <Detail
              label="Packet loss"
              value={
                metrics.ping > 0 && Number.isFinite(metrics.packetLoss)
                  ? `${metrics.packetLoss.toFixed(1)}%`
                  : '—'
              }
            />
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <Detail
                label="IP address"
                value={ip}
                title={ip}
                className="font-mono text-xs text-fg-muted"
              />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
