import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createNextServerHelpers } from '@appwrite.io/react/server/next';
import { Providers } from './providers';
import { SEO_METADATA, SITE_URL } from '@/lib/seo/config';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SEO_METADATA.title,
  description: SEO_METADATA.description,
  keywords: SEO_METADATA.keywords,
  authors: SEO_METADATA.authors,
  creator: SEO_METADATA.creator,
  publisher: SEO_METADATA.publisher,
  alternates: {
    canonical: '/',
  },
  openGraph: SEO_METADATA.openGraph,
  twitter: SEO_METADATA.twitter,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/images/logo.png', type: 'image/png' },
    ],
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

const appwrite = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''
};

export const instant = false;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  if (appwrite.endpoint && appwrite.projectId) {
    const helpers = createNextServerHelpers(appwrite);
    session = await helpers.readSessionCookie();
  }

  return (
    <html
      lang="pt-BR"
      style={{ colorScheme: 'light' }}
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
