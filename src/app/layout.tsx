import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Hasan's Space — Gym & Workout OS",
  description: 'Offline-first personal bodybuilding and gym workout tracker.',
  manifest: './manifest.json',
  icons: { apple: './icon.svg' },
  appleWebApp: { capable: true, title: "Hasan's Gym", statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = { themeColor: '#0c0d10', viewportFit: 'cover' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
