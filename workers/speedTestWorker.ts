export type TestStage = 'idle' | 'ping' | 'download' | 'upload' | 'complete' | 'aborted';

export interface TestMetrics {
  ping: number;
  jitter: number;
  packetLoss: number; // Percentage
  download: number; // Mbps
  upload: number; // Mbps
  progress: number; // 0-100
  stage: TestStage;
}

interface TestRun {
  aborted: boolean;
  controller: AbortController;
}

const TEST_DURATION_MS = 8000; // 8 seconds duration for testing blocks
let activeRun: TestRun | null = null;

const isRunActive = (run: TestRun) => run === activeRun && !run.aborted;

const sendUpdate = (run: TestRun, stage: TestStage, metrics: Partial<TestMetrics>) => {
  if (run !== activeRun) return;
  if (run.aborted && stage !== 'aborted') return;
  self.postMessage({ type: 'update', stage, metrics });
};

/** Stop a run without letting a newer run's updates be overwritten. */
const stopRun = (run: TestRun) => {
  sendUpdate(run, 'aborted', {});
};

self.onmessage = (e: MessageEvent) => {
  const { command } = e.data;
  if (command === 'start') {
    // A new run always cancels the previous one. The old run checks its own
    // object identity, so late completions cannot touch the new run.
    activeRun?.controller.abort();
    const run: TestRun = { aborted: false, controller: new AbortController() };
    activeRun = run;
    void runTest(run).catch((error) => {
      console.error('[speedx] speed test worker failed', error);
      if (isRunActive(run)) stopRun(run);
    });
  } else if (command === 'abort') {
    if (!activeRun) return;
    activeRun.aborted = true;
    activeRun.controller.abort();
  }
};

const runTest = async (run: TestRun) => {
  // === 1. PING & JITTER ===
  sendUpdate(run, 'ping', { progress: 0 });
  const pings: number[] = [];

  for (let i = 0; i < 10; i++) {
    if (!isRunActive(run)) return stopRun(run);

    const start = performance.now();
    try {
      await fetch(`/api/ping?ck=${Math.random()}`, {
        cache: 'no-store',
        signal: run.controller.signal,
      });
      pings.push(performance.now() - start);
    } catch {
      // A failed probe counts toward packet loss below.
    }

    if (!isRunActive(run)) return stopRun(run);
    sendUpdate(run, 'ping', { progress: ((i + 1) / 10) * 100 });
    await new Promise((r) => setTimeout(r, 20)); // Small sleep between pings
  }

  if (!isRunActive(run)) return stopRun(run);

  const validPings = pings.length > 0 ? pings : [0];
  const pingAvg = validPings.reduce((a, b) => a + b, 0) / validPings.length;
  const packetLoss = Math.max(0, ((10 - pings.length) / 10) * 100);

  let jitter = 0;
  if (validPings.length > 1) {
    let diffs = 0;
    for (let i = 1; i < validPings.length; i++) {
      diffs += Math.abs(validPings[i] - validPings[i - 1]);
    }
    jitter = diffs / (validPings.length - 1);
  }

  // === 2. DOWNLOAD CHUNK WORKERS ===
  sendUpdate(run, 'download', { ping: pingAvg, jitter, packetLoss, progress: 0, download: 0 });

  let downloadedBytes = 0;
  const dlStart = performance.now();
  let lastDlUpdate = 0;
  let globalDlChunkMb = 5; // Start conservative, auto-scale globally

  const downloadThread = async () => {
    while (isRunActive(run) && performance.now() - dlStart < TEST_DURATION_MS) {
      try {
        const localChunkContext = globalDlChunkMb;
        const res = await fetch(`/api/download?size=${localChunkContext}&ck=${Math.random()}`, {
          cache: 'no-store',
          signal: run.controller.signal,
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        if (!res.body) throw new Error('No body');

        const reader = res.body.getReader();
        while (isRunActive(run) && performance.now() - dlStart < TEST_DURATION_MS) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            downloadedBytes += value.length;
            const now = performance.now();
            const elapsedSec = Math.max((now - dlStart) / 1000, 0.05);
            const mbps = ((downloadedBytes * 8) / 1000000) / elapsedSec;

            // Auto-Scale network thread block sizes
            if (mbps > 500) globalDlChunkMb = 30;
            else if (mbps > 250) globalDlChunkMb = 20;
            else if (mbps > 100) globalDlChunkMb = 10;
            else globalDlChunkMb = 5;

            // Throttle UI Updates (smooth rendering)
            if (now - lastDlUpdate > 100) {
              sendUpdate(run, 'download', {
                download: mbps,
                progress: Math.min((elapsedSec / (TEST_DURATION_MS / 1000)) * 100, 100),
              });
              lastDlUpdate = now;
            }
          }
        }
      } catch {
        if (!isRunActive(run)) break;
        await new Promise((r) => setTimeout(r, 150)); // Wait & retry on a micro connection drop
      }
    }
  };

  // Launch 4 concurrent static threads (Fully Saturates standard TCP sockets)
  const dlWorkers = Array(4)
    .fill(0)
    .map(() => downloadThread());
  await Promise.all(dlWorkers);

  if (!isRunActive(run)) return stopRun(run);

  const dlElapsedSec = Math.max((performance.now() - dlStart) / 1000, 0.05);
  const finalDlMbps = ((downloadedBytes * 8) / 1000000) / dlElapsedSec;

  // === 3. UPLOAD CHUNK WORKERS ===
  sendUpdate(run, 'upload', { download: finalDlMbps, progress: 0, upload: 0 });

  let uploadedBytes = 0;
  const ulStart = performance.now();
  let lastUlUpdate = 0;
  let globalUlChunkMb = 2; // Auto-scale dynamically

  const uploadThread = async () => {
    while (isRunActive(run) && performance.now() - ulStart < TEST_DURATION_MS) {
      try {
        const localChunkContext = globalUlChunkMb;
        const uploadBuf = new Uint8Array(localChunkContext * 1024 * 1024);

        const res = await fetch(`/api/upload?ck=${Math.random()}`, {
          method: 'POST',
          body: uploadBuf,
          cache: 'no-store',
          signal: run.controller.signal,
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);

        uploadedBytes += uploadBuf.byteLength;

        const now = performance.now();
        const elapsedSec = Math.max((now - ulStart) / 1000, 0.05);
        const mbps = ((uploadedBytes * 8) / 1000000) / elapsedSec;

        // Auto-Scale network payloads
        if (mbps > 500) globalUlChunkMb = 15;
        else if (mbps > 150) globalUlChunkMb = 10;
        else if (mbps > 50) globalUlChunkMb = 5;
        else globalUlChunkMb = 2;

        if (now - lastUlUpdate > 100) {
          sendUpdate(run, 'upload', {
            upload: mbps,
            progress: Math.min((elapsedSec / (TEST_DURATION_MS / 1000)) * 100, 100),
          });
          lastUlUpdate = now;
        }
      } catch {
        if (!isRunActive(run)) break;
        await new Promise((r) => setTimeout(r, 150));
      }
    }
  };

  // Launch 3 concurrent upload threads
  const ulWorkers = Array(3)
    .fill(0)
    .map(() => uploadThread());
  await Promise.all(ulWorkers);

  if (!isRunActive(run)) return stopRun(run);

  const ulElapsedSec = Math.max((performance.now() - ulStart) / 1000, 0.05);
  const finalUlMbps = ((uploadedBytes * 8) / 1000000) / ulElapsedSec;

  // === COMPLETE ===
  sendUpdate(run, 'complete', {
    ping: pingAvg,
    jitter: jitter,
    packetLoss: packetLoss,
    download: finalDlMbps,
    upload: finalUlMbps,
    progress: 100,
  });
};
