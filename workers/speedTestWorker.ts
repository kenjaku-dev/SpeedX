export type TestStage = 'idle' | 'ping' | 'download' | 'upload' | 'complete' | 'aborted';

export interface TestMetrics {
  ping: number;
  jitter: number;
  download: number; // Mbps
  upload: number; // Mbps
  progress: number; // 0-100 for current stage
  stage: TestStage;
}

let isAborted = false;
let abortController: AbortController | null = null;

const MS_PER_SEC = 1000;
const TEST_DURATION_MS = 8000;

self.onmessage = async (e: MessageEvent) => {
  const { command } = e.data;
  
  if (command === 'start') {
    isAborted = false;
    abortController = new AbortController();
    await runTest();
  } else if (command === 'abort') {
    isAborted = true;
    if (abortController) {
      abortController.abort();
    }
  }
};

const sendUpdate = (stage: TestStage, metrics: Partial<TestMetrics>) => {
  self.postMessage({ type: 'update', stage, metrics });
};

const runTest = async () => {
  sendUpdate('ping', { progress: 0 });
  
  // 1. PING & JITTER
  let pings: number[] = [];
  for (let i = 0; i < 10; i++) {
    if (isAborted) return sendUpdate('aborted', {});
    const start = performance.now();
    try {
      await fetch('/api/ping', { cache: 'no-store', signal: abortController?.signal });
      pings.push(performance.now() - start);
    } catch (e) {
      // ignore
    }
    sendUpdate('ping', { progress: ((i + 1) / 10) * 100 });
    // minor wait
    await new Promise(r => setTimeout(r, 50));
  }
  
  if (pings.length === 0) pings = [0];
  const pingAvg = pings.reduce((a, b) => a + b, 0) / pings.length;
  let jitter = 0;
  if (pings.length > 1) {
    let diffs = 0;
    for (let i = 1; i < pings.length; i++) {
      diffs += Math.abs(pings[i] - pings[i - 1]);
    }
    jitter = diffs / (pings.length - 1);
  }

  sendUpdate('download', { ping: pingAvg, jitter, progress: 0 });

  // 2. DOWNLOAD
  let downloadedBytes = 0;
  let downloadStart = performance.now();
  
let lastDownloadUpdate = 0;

  const downloadStream = async (size: number) => {
    while (!isAborted && (performance.now() - downloadStart) < TEST_DURATION_MS) {
      try {
        const res = await fetch(`/api/download?size=${size}&ck=${Math.random()}`, {
          cache: 'no-store',
          signal: abortController?.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);
        if (!res.body) throw new Error('No response body');
        const reader = res.body.getReader();
        while (!isAborted && (performance.now() - downloadStart) < TEST_DURATION_MS) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            downloadedBytes += value.length;
            const now = performance.now();
            const elapsedSec = Math.max((now - downloadStart) / 1000, 0.01);
            const bits = downloadedBytes * 8;
            const mbps = (bits / 1000000) / elapsedSec;
            
            if (now - lastDownloadUpdate > 100) {
              sendUpdate('download', { download: mbps, progress: Math.min((elapsedSec * 1000 / TEST_DURATION_MS) * 100, 100) });
              lastDownloadUpdate = now;
            }
          }
        }
      } catch (e) {
        if (isAborted) break;
        console.warn("Download stream error:", String(e));
        await new Promise(r => setTimeout(r, 200)); // sleep briefly to avoid spin loop on error
      }
    }
  };

  const dlPromises: Promise<void>[] = [];
  const parallelDlStreams = 6;
  downloadStart = performance.now();
  for (let i = 0; i < parallelDlStreams; i++) {
    // 50MB per stream
    dlPromises.push(downloadStream(50));
  }

  // Wait until timeout
  await Promise.race([
    Promise.all(dlPromises),
    new Promise(r => setTimeout(r, TEST_DURATION_MS))
  ]);
  
  // Abort Dls if still running
  if (abortController) abortController.abort();
  abortController = new AbortController();

  if (isAborted) return sendUpdate('aborted', {});

  // Calculate final DL
  const dlElapsedMs = performance.now() - downloadStart;
  const finalDlMbps = ((downloadedBytes * 8) / 1000000) / (dlElapsedMs / 1000);
  
  sendUpdate('upload', { download: finalDlMbps, progress: 0 });

  // 3. UPLOAD
  let uploadedBytes = 0;
  let uploadStart = performance.now();
  let lastUploadUpdate = 0;
  
  // 1MB chunk to post repeatedly
  const uploadChunk = new Uint8Array(1024 * 1024);
  for (let i=0; i<uploadChunk.length; i++) uploadChunk[i] = Math.floor(Math.random() * 256);
  
  const uploadStream = async () => {
    while (!isAborted && (performance.now() - uploadStart) < TEST_DURATION_MS) {
      try {
        const startReq = performance.now();
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadChunk,
          cache: 'no-store',
          signal: abortController?.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (isAborted) break;
        // Approximation of uploaded bytes
        uploadedBytes += uploadChunk.length;
        const now = performance.now();
        const elapsedSec = Math.max((now - uploadStart) / 1000, 0.01);
        const mbps = ((uploadedBytes * 8) / 1000000) / elapsedSec;
        if (now - lastUploadUpdate > 100) {
            sendUpdate('upload', { upload: mbps, progress: Math.min((elapsedSec * 1000 / TEST_DURATION_MS) * 100, 100) });
            lastUploadUpdate = now;
        }
      } catch (e) {
        if (isAborted) break;
        await new Promise(r => setTimeout(r, 200)); // sleep briefly to avoid spin loop on error
      }
    }
  };

  const ulPromises: Promise<void>[] = [];
  const parallelUlStreams = 4;
  uploadStart = performance.now();
  for (let i = 0; i < parallelUlStreams; i++) {
    ulPromises.push(uploadStream());
  }

  await Promise.race([
    Promise.all(ulPromises),
    new Promise(r => setTimeout(r, TEST_DURATION_MS))
  ]);

  if (abortController) abortController.abort();
  
  if (isAborted) return sendUpdate('aborted', {});

  const ulElapsedMs = performance.now() - uploadStart;
  const finalUlMbps = ((uploadedBytes * 8) / 1000000) / (ulElapsedMs / 1000);
  
  sendUpdate('complete', {
    ping: pingAvg,
    jitter,
    download: finalDlMbps,
    upload: finalUlMbps,
    progress: 100
  });
};
