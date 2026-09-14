import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PULSEBOARD — Personal Fitness OS',
  description: 'Offline-first personal health and fitness dashboard.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = { themeColor: '#101412', viewportFit: 'cover' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
