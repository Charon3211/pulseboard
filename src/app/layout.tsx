import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Hasan's Space — Personal Fitness OS",
  description: 'Offline-first personal health and fitness dashboard.',
  manifest: '/manifest.json',
  icons: { apple: '/icon.svg' },
  appleWebApp: { capable: true, title: "Hasan's Space", statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = { themeColor: '#101412', viewportFit: 'cover' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
