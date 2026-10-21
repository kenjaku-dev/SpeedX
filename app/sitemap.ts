import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

// Read the deployment origin at request time instead of baking the build
// machine's default into the URLs.
export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
