import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let bytesReceived = 0;

  if (req.body) {
    const reader = req.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          bytesReceived += value.length;
        }
      }
    } catch (e) {
      // Ignored, client might have aborted
    }
  }

  return NextResponse.json({ bytesReceived });
}
