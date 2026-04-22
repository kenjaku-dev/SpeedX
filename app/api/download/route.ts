import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sizeMb = parseInt(searchParams.get('size') || '25', 10);
  const totalBytes = sizeMb * 1024 * 1024;
  const chunkSize = 64 * 1024; // 64KB chunks to optimize server overhead

  let sentBytes = 0;
  // Pre-generate a chunk of data to send repeatedly for performance
  const randomChunk = new Uint8Array(chunkSize);
  for (let i = 0; i < chunkSize; i++) {
    randomChunk[i] = Math.floor(Math.random() * 256);
  }

  const stream = new ReadableStream({
    pull(controller) {
      if (sentBytes >= totalBytes) {
        controller.close();
        return;
      }

      const remaining = totalBytes - sentBytes;
      if (remaining < chunkSize) {
        controller.enqueue(randomChunk.slice(0, remaining));
        sentBytes += remaining;
      } else {
        controller.enqueue(randomChunk);
        sentBytes += chunkSize;
      }
    },
    cancel() {
      // client aborted the request
    }
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'application/octet-stream',
      'Content-Length': totalBytes.toString()
    },
  });
}
