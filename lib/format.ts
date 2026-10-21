/** Formatting helpers shared by server pages, the OG image and client components. */

/** Rows written before a metric existed (or with a failed measurement) are nullable. */
export function formatMetric(value: number | null | undefined, digits = 1): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}

export function formatDate(value: string | null): string {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** The geo API reports "Unknown …" when it has nothing; treat that as missing. */
export function knownString(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || /^unknown/i.test(trimmed)) return null;
  return trimmed;
}
