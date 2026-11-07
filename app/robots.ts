import type { MetadataRoute } from 'next';
import { ROBOTS_RULES } from '@/lib/seo/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: ROBOTS_RULES.rules.userAgent,
      allow: ROBOTS_RULES.rules.allow,
      disallow: ROBOTS_RULES.rules.disallow,
    },
    sitemap: ROBOTS_RULES.sitemap,
  };
}
