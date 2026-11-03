import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
};

export const metadata: Metadata = {
  title: 'KeroKero - Comanda Digital',
  description: 'Comanda digital inteligente na mesa',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KeroKero',
  },
};

export default function ClientPwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh w-full bg-zinc-100 flex justify-center">
      <div className="w-full max-w-md min-h-dvh bg-white flex flex-col shadow-sm text-zinc-900">
        {children}
      </div>
    </div>
  );
}
