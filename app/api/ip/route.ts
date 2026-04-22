import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Attempt to get client IP from headers, or fallback
    let ip = req.headers.get('x-forwarded-for') || '';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    
    // We can fetch from an external IP service for robust location/ISP matching
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    const data = await res.json();
    
    return NextResponse.json({
       ip: data.ip || ip,
       isp: data.org || 'Unknown ISP',
       city: data.city || 'Unknown',
       country: data.country_name || 'Unknown',
       server: 'Frankfurt, DE' // Dummy or we can use Cloudflare's CF-RAY/CF-IPCountry
    });
  } catch (error) {
    return NextResponse.json({
       ip: 'Unknown IP',
       isp: 'Unknown ISP',
       city: 'Unknown',
       country: 'Unknown',
       server: 'Default Server'
    });
  }
}
