import { randomFillSync } from 'node:crypto';

import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Pre-allocate a 30MB buffer once at server startup. Random bytes make the
// payload incompressible, so a proxy cannot make the test look faster by
// gzipping it.
const MAX_MB = 30;
const DEFAULT_MB = 5;
const BYTES = MAX_MB * 1024 * 1024;
const randomData = new Uint8Array(BYTES);
randomFillSync(randomData);

function requestedSize(value: string | null): number {
    if (value === null || value.trim() === '') return DEFAULT_MB;

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_MB;

    return Math.min(Math.max(parsed, 0), MAX_MB);
}

export async function GET(req: NextRequest) {
    const sizeMb = requestedSize(req.nextUrl.searchParams.get('size'));
    const requestedBytes = sizeMb * 1024 * 1024;

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
