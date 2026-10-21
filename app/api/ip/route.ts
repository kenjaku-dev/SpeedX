import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface IpWhoResponse {
  success?: boolean;
  city?: string;
  country?: string;
  connection?: {
    isp?: string;
  };
}

export async function GET(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const cleanIp = ip.split(',')[0].trim();

    let isp = 'Unknown ISP';
    let city = 'Unknown City';
    let country = 'Unknown Country';

    // Optional enrichment. The lookup is HTTPS so the visitor's IP is not sent
    // over cleartext, and a failure leaves the placeholders in place.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
      const geoRes = await fetch(
        `https://ipwho.is/${encodeURIComponent(cleanIp)}?fields=success,country,city,connection.isp`,
        {
          signal: controller.signal,
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        }
      );

      if (geoRes.ok) {
        const data = (await geoRes.json()) as IpWhoResponse;
        if (data.success !== false) {
          if (typeof data.connection?.isp === 'string') isp = data.connection.isp;
          if (typeof data.city === 'string') city = data.city;
          if (typeof data.country === 'string') country = data.country;
        }
      }
    } catch {
      // Keep the placeholders; the test itself does not depend on this lookup.
    } finally {
      clearTimeout(timeoutId);
    }

    return NextResponse.json({
      ip: cleanIp,
      isp,
      city,
      country,
      server: 'SpeedX server',
    });
  } catch {
    return NextResponse.json({
      ip: 'Unknown',
      isp: 'Unknown',
      city: 'Unknown',
      country: 'Unknown',
      server: 'SpeedX server',
    });
  }
}
