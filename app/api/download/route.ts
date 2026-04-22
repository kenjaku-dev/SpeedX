import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Pre-allocate a 30MB buffer mapped into pure Uint8 memory once at server startup.
// This completely avoids JSON parsing, garbage collection, and stream buffering limits.
const MAX_MB = 30;
const BYTES = MAX_MB * 1024 * 1024;
const randomData = new Uint8Array(BYTES);

// Fill with pseudo-random fast bytes so proxies can't cheat via gzip compression
for (let i = 0; i < BYTES; i += 1024) { 
  randomData[i] = Math.floor(Math.random() * 256);
}

export async function GET(req: NextRequest) {
    const sizeMb = parseInt(req.nextUrl.searchParams.get('size') || '5', 10);
    const requestedBytes = Math.min(sizeMb, MAX_MB) * 1024 * 1024;

    // Zero-copy reference slice
    const body = randomData.subarray(0, requestedBytes);

    return new Response(body, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Type': 'application/octet-stream',
            'Content-Length': requestedBytes.toString(),
            'X-Accel-Buffering': 'no' // Prevent reverse proxies from bottlenecking
        }
    });
}
