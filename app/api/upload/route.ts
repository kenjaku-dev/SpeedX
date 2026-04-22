import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        if (!req.body) {
            return NextResponse.json({ received: 0 });
        }
        
        let bytesReceived = 0;
        const reader = req.body.getReader();
        
        // Dynamically drain the upload stream to avoid triggering Next.js or Node payload-size limits
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                bytesReceived += value.length;
            }
        }
        
        return NextResponse.json({ received: bytesReceived }, {
            headers: {
                'Cache-Control': 'no-store, no-cache',
                'X-Accel-Buffering': 'no'
            }
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
