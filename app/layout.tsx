import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createNextServerHelpers } from '@appwrite.io/react/server/next';
import { Providers } from './providers';

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
  title: "KeroKero",
  description: "Comanda digital inteligente na mesa",
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
