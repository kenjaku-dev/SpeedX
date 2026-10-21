/**
 * Absolute origin used by metadata, robots and sitemap.
 *
 * Statically rendered metadata is baked at build time, so set
 * NEXT_PUBLIC_SITE_URL (or APP_URL) before `next build` for a real deployment.
 * robots.txt and sitemap.xml are dynamic and also read the runtime value.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? 'http://localhost:3000';

  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

export const siteUrl = resolveSiteUrl();

export const siteConfig = {
  name: 'SpeedX',
  title: 'SpeedX — Internet Speed Test',
  description:
    'Measure download speed, upload speed, ping and jitter in your browser. Share a result with a single link.',
  url: siteUrl,
};
