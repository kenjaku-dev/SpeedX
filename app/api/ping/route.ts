export const dynamic = 'force-dynamic';

export async function GET() {
    return new Response('pong', {
        headers: { 
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Accel-Buffering': 'no'
        }
    });
}
