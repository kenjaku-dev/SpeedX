import { ImageResponse } from 'next/og';

import { formatMetric } from '@/lib/format';
import { getResult, resultIsp, resultLocation } from '@/lib/results';

export const runtime = 'nodejs';
export const alt = 'SpeedX speed test result';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Paint colours are duplicated here on purpose: the image is rendered by
 * satori, which does not resolve the CSS custom properties from the app shell.
 * Keep them in sync with the dark token block in app/globals.css.
 */
const ink = {
  canvas: '#070b12',
  surface: '#0c121b',
  line: '#1b2534',
  fg: '#e8eef4',
  muted: '#92a5b5',
  subtle: '#7f92a3',
  signal: '#22d3ee',
  upload: '#c084fc',
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = getResult(id);

  if (!result) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: `linear-gradient(180deg, ${ink.surface} 0%, ${ink.canvas} 100%)`,
            color: ink.fg,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 12,
                background: ink.signal,
                marginRight: 14,
              }}
            />
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6 }}>SPEEDX</div>
          </div>
          <div style={{ fontSize: 56, marginTop: 32 }}>Result not found</div>
          <div style={{ fontSize: 22, color: ink.subtle, marginTop: 14 }}>
            This test result is no longer available.
          </div>
        </div>
      ),
      size
    );
  }

  const download = formatMetric(result.download);
  const upload = formatMetric(result.upload);
  const ping = formatMetric(result.ping);
  const jitter = formatMetric(result.jitter);
  const loss = formatMetric(result.packetLoss);
  const isp = resultIsp(result);
  const location = resultLocation(result);
  const date = new Date(result.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: `linear-gradient(180deg, ${ink.surface} 0%, ${ink.canvas} 100%)`,
          color: ink.fg,
          padding: '56px 64px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 12,
                background: ink.signal,
                marginRight: 14,
              }}
            />
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6 }}>SPEEDX</div>
          </div>
          <div style={{ fontSize: 18, letterSpacing: 5, color: ink.subtle }}>SPEED TEST RESULT</div>
        </div>

        <div style={{ display: 'flex', marginTop: 54 }}>
          <div style={{ display: 'flex', flexDirection: 'column', marginRight: 92 }}>
            <div style={{ fontSize: 20, letterSpacing: 3, color: ink.signal }}>DOWNLOAD</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 10 }}>
              <div style={{ fontSize: 124, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>
                {download}
              </div>
              <div style={{ fontSize: 24, color: ink.subtle, marginLeft: 12 }}>Mbps</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, letterSpacing: 3, color: ink.upload }}>UPLOAD</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 10 }}>
              <div style={{ fontSize: 124, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>
                {upload}
              </div>
              <div style={{ fontSize: 24, color: ink.subtle, marginLeft: 12 }}>Mbps</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexGrow: 1 }} />

        <div style={{ display: 'flex', width: '100%', height: 1, background: ink.line }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 26,
          }}
        >
          <div style={{ display: 'flex' }}>
            <OgStat label="PING" value={`${ping} ms`} />
            <OgStat label="JITTER" value={`${jitter} ms`} />
            <OgStat label="PACKET LOSS" value={`${loss}%`} />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              maxWidth: 380,
            }}
          >
            <div style={{ fontSize: 20, color: ink.fg }}>{isp}</div>
            <div style={{ fontSize: 16, color: ink.subtle, marginTop: 6 }}>{location}</div>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 18, fontSize: 15, letterSpacing: 2, color: ink.subtle }}>
          {date}
        </div>
      </div>
    ),
    size
  );
}

function OgStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginRight: 48 }}>
      <div style={{ fontSize: 14, letterSpacing: 2, color: ink.subtle }}>{label}</div>
      <div style={{ fontSize: 24, marginTop: 6, color: ink.fg }}>{value}</div>
    </div>
  );
}
