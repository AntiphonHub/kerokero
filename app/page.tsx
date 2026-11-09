import { connection } from 'next/server';
import { getSession } from '@/lib/appwrite/session';
import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { FinalCtaSection } from '@/components/landing/final-cta-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { generateSoftwareStructuredData } from '@/lib/seo/config';

export const instant = false;

export default async function HomePage() {
  await connection();
  const session = await getSession();
  const hasSession = Boolean(session);
  const structuredData = generateSoftwareStructuredData();

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-amber-500 selection:text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingHeader hasSession={hasSession} />
      <HeroSection hasSession={hasSession} />
      <FeaturesSection />
      <PricingSection hasSession={hasSession} />
      <FinalCtaSection hasSession={hasSession} />
      <LandingFooter />
    </main>
  );
}
