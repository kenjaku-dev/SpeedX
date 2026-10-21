import { cache } from 'react';

import db from '@/lib/db';
import { knownString } from '@/lib/format';

export interface SpeedTestRow {
  id: string;
  createdAt: string;
  ping: number | null;
  jitter: number | null;
  packetLoss: number | null;
  download: number | null;
  upload: number | null;
  ip: string | null;
  isp: string | null;
  city: string | null;
  country: string | null;
  server: string | null;
}

/** Memoised per request so metadata and the page share one query. */
export const getResult = cache((id: string) => {
  return db.prepare('SELECT * FROM SpeedTest WHERE id = ?').get(id) as SpeedTestRow | undefined;
});

export function resultLocation(result: Pick<SpeedTestRow, 'city' | 'country'>): string {
  return (
    [knownString(result.city), knownString(result.country)].filter(Boolean).join(', ') ||
    'Unknown location'
  );
}

export function resultIsp(result: Pick<SpeedTestRow, 'isp'>): string {
  return knownString(result.isp) ?? 'Unknown network';
}
