import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { time: Date.now() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
