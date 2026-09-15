import type { ReactNode } from 'react';

export type IconName = 'home' | 'workout' | 'habits' | 'stats' | 'profile' | 'clock' | 'trophy' | 'flame' | 'cloud' | 'moon' | 'sun' | 'download' | 'upload' | 'check' | 'spark' | 'bell';

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    workout: <><path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" /></>,
    habits: <><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.5 2.5L16.5 9" /></>,
    stats: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM12 12v5M8 20h8M9 17h6" /><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3" /></>,
    flame: <path d="M12.3 21c4.2-.2 6.2-3 5.4-6.3-.5-2-2-3.2-3.4-4.6.1 2-1 3.2-2.3 3.7.2-3.1-1.5-5.2-3.2-7.8-.4 3.2-3.1 4.8-3.1 8.5A6.5 6.5 0 0 0 12.3 21Z" />,
    cloud: <path d="M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.3 9.5 4.3 4.3 0 0 0 7 18Z" />,
    moon: <path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
    sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    download: <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />,
    upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
    check: <path d="m5 12 4 4L19 6" />,
    spark: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 16 .5 2 2 .5-.5 2-.5-2-2-.5 2-.5.5-2Z" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}
