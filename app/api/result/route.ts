import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO SpeedTest (
        id, ping, jitter, download, upload, ip, isp, city, country, server, userAgent
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
        id,
        Number(data.ping) || 0,
        Number(data.jitter) || 0,
        Number(data.download) || 0,
        Number(data.upload) || 0,
        data.ip || null,
        data.isp || null,
        data.city || null,
        data.country || null,
        data.server || 'Unknown',
        req.headers.get('user-agent') || 'Unknown'
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error saving result:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
