import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

// Read the deployment origin at request time instead of baking the build
// machine's default into the file.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Shared result pages contain personal network data.
      disallow: ['/api/', '/result/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
