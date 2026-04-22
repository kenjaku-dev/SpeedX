import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const cleanIp = ip.split(',')[0].trim();
    
    let isp = 'Unknown ISP';
    let city = 'Unknown City';
    let country = 'Unknown Country';
    
    // Attempt fallback geo-loc API for metadata gathering (fails gracefully)
    try {
        // Fast 1.5s timeout abort signal
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        
        const geoRes = await fetch(`http://ip-api.com/json/${cleanIp}?fields=isp,city,country`, { 
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        
        if (geoRes.ok) {
            const data = await geoRes.json();
            if (data.isp) isp = data.isp;
            if (data.city) city = data.city;
            if (data.country) country = data.country;
        }
    } catch(e) { }

    return NextResponse.json({
        ip: cleanIp,
        isp,
        city,
        country,
        server: 'SpeedX AI Node'
    });
  } catch (e) {
    return NextResponse.json({ ip: 'Unknown', isp: 'Unknown', city: 'Unknown', country: 'Unknown', server: 'Node' });
  }
}
