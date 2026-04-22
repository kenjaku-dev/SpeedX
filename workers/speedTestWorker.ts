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

let isAborted = false;
let abortController: AbortController | null = null;
const TEST_DURATION_MS = 8000; // 8 seconds duration for testing blocks

self.onmessage = async (e: MessageEvent) => {
  const { command } = e.data;
  if (command === 'start') {
    isAborted = false;
    abortController = new AbortController();
    await runTest();
  } else if (command === 'abort') {
    isAborted = true;
    abortController?.abort();
  }
};

const sendUpdate = (stage: TestStage, metrics: Partial<TestMetrics>) => {
  if (isAborted && stage !== 'aborted') return;
  self.postMessage({ type: 'update', stage, metrics });
};

const runTest = async () => {
  // === 1. PING & JITTER ===
  sendUpdate('ping', { progress: 0 });
  let pings: number[] = [];
  
  for (let i = 0; i < 10; i++) {
    if (isAborted) return sendUpdate('aborted', {});
    const start = performance.now();
    try {
      await fetch(`/api/ping?ck=${Math.random()}`, { cache: 'no-store', signal: abortController?.signal });
      pings.push(performance.now() - start);
    } catch(e) {}
    sendUpdate('ping', { progress: ((i + 1) / 10) * 100 });
    await new Promise(r => setTimeout(r, 20)); // Small sleep between pings
  }
  
  const validPings = pings.length > 0 ? pings : [0];
  const pingAvg = validPings.reduce((a, b) => a + b, 0) / validPings.length;
  const packetLoss = Math.max(0, ((10 - pings.length) / 10) * 100);
  
  let jitter = 0;
  if (validPings.length > 1) {
    let diffs = 0;
    for (let i = 1; i < validPings.length; i++) {
        diffs += Math.abs(validPings[i] - validPings[i-1]);
    }
    jitter = diffs / (validPings.length - 1);
  }

  // === 2. DOWNLOAD CHUNK WORKERS ===
  sendUpdate('download', { ping: pingAvg, jitter, packetLoss, progress: 0, download: 0 });
  
  let downloadedBytes = 0;
  let dlStart = performance.now();
  let lastDlUpdate = 0;
  let globalDlChunkMb = 5; // Start conservative, auto-scale globally

  const downloadThread = async () => {
    while (!isAborted && (performance.now() - dlStart) < TEST_DURATION_MS) {
      try {
        const localChunkContext = globalDlChunkMb;
        const res = await fetch(`/api/download?size=${localChunkContext}&ck=${Math.random()}`, {
            cache: 'no-store', signal: abortController?.signal
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        if (!res.body) throw new Error("No body");
        
        const reader = res.body.getReader();
        while (!isAborted && (performance.now() - dlStart) < TEST_DURATION_MS) {
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
                  sendUpdate('download', { download: mbps, progress: Math.min((elapsedSec / (TEST_DURATION_MS/1000)) * 100, 100) });
                  lastDlUpdate = now;
                }
            }
        }
      } catch(e) {
        if(isAborted) break;
        await new Promise(r => setTimeout(r, 150)); // Wait & Retry if micro connection drop
      }
    }
  };

  // Launch 4 concurrent static threads (Fully Saturates standard TCP sockets)
  const dlWorkers = Array(4).fill(0).map(() => downloadThread());
  await Promise.all(dlWorkers);
  
  if (isAborted) return sendUpdate('aborted', {});

  const dlElapsedSec = Math.max((performance.now() - dlStart) / 1000, 0.05);
  const finalDlMbps = ((downloadedBytes * 8) / 1000000) / dlElapsedSec;
  
  // === 3. UPLOAD CHUNK WORKERS ===
  sendUpdate('upload', { download: finalDlMbps, progress: 0, upload: 0 });
  
  let uploadedBytes = 0;
  let ulStart = performance.now();
  let lastUlUpdate = 0;
  let globalUlChunkMb = 2; // Auto-scale dynamically

  const uploadThread = async () => {
    while (!isAborted && (performance.now() - ulStart) < TEST_DURATION_MS) {
      try {
        const localChunkContext = globalUlChunkMb;
        const uploadBuf = new Uint8Array(localChunkContext * 1024 * 1024);
        
        const res = await fetch(`/api/upload?ck=${Math.random()}`, {
            method: 'POST', body: uploadBuf, cache: 'no-store', signal: abortController?.signal
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        
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
          sendUpdate('upload', { upload: mbps, progress: Math.min((elapsedSec / (TEST_DURATION_MS/1000)) * 100, 100) });
          lastUlUpdate = now;
        }
      } catch(e) {
        if(isAborted) break;
        await new Promise(r => setTimeout(r, 150));
      }
    }
  };

  // Launch 3 concurrent upload threads
  const ulWorkers = Array(3).fill(0).map(() => uploadThread());
  await Promise.all(ulWorkers);

  if (isAborted) return sendUpdate('aborted', {});

  const ulElapsedSec = Math.max((performance.now() - ulStart) / 1000, 0.05);
  const finalUlMbps = ((uploadedBytes * 8) / 1000000) / ulElapsedSec;

  // === COMPLETE ===
  sendUpdate('complete', {
      ping: pingAvg,
      jitter: jitter,
      packetLoss: packetLoss,
      download: finalDlMbps,
      upload: finalUlMbps,
      progress: 100
  });
};
