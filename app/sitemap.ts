import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/seo/config';

export default function sitemap(): MetadataRoute.Sitemap {
  return getSitemapEntries();
}
