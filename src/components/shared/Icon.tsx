import type { ReactNode } from 'react';

export type IconName =
  | 'home'
  | 'workout'
  | 'dumbbell'
  | 'stats'
  | 'profile'
  | 'clock'
  | 'trophy'
  | 'flame'
  | 'cloud'
  | 'moon'
  | 'sun'
  | 'download'
  | 'upload'
  | 'check'
  | 'spark'
  | 'bell'
  | 'timer'
  | 'plus'
  | 'trash'
  | 'play'
  | 'pause'
  | 'rotate'
  | 'scale'
  | 'award'
  | 'volume'
  | 'lock'
  | 'x';

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </>
    ),
    workout: (
      <>
        <path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" />
      </>
    ),
    dumbbell: (
      <>
        <path d="m6.5 6.5 11 11" />
        <path d="m21 21-1-1a3 3 0 0 0-4.24 0l-.88.88a3 3 0 0 1-4.24 0l-3.54-3.54a3 3 0 0 1 0-4.24l.88-.88a3 3 0 0 0 0-4.24L8 7" />
        <path d="m3 3 1 1a3 3 0 0 0 4.24 0l.88-.88a3 3 0 0 1 4.24 0l3.54 3.54a3 3 0 0 1 0 4.24l-.88.88a3 3 0 0 0 0 4.24L16 17" />
      </>
    ),
    stats: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM12 12v5M8 20h8M9 17h6" />
        <path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3" />
      </>
    ),
    flame: (
      <path d="M12.3 21c4.2-.2 6.2-3 5.4-6.3-.5-2-2-3.2-3.4-4.6.1 2-1 3.2-2.3 3.7.2-3.1-1.5-5.2-3.2-7.8-.4 3.2-3.1 4.8-3.1 8.5A6.5 6.5 0 0 0 12.3 21Z" />
    ),
    cloud: (
      <path d="M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.3 9.5 4.3 4.3 0 0 0 7 18Z" />
    ),
    moon: (
      <path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
      </>
    ),
    check: (
      <path d="m5 12 4 4L19 6" />
    ),
    spark: (
      <>
        <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
        <path d="m19 16 .5 2 2 .5-.5 2-.5-2-2-.5 2-.5.5-2Z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
      </>
    ),
    timer: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 1.5M10 2h4M12 2v3" />
      </>
    ),
    plus: (
      <path d="M12 5v14M5 12h14" />
    ),
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    play: (
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
    ),
    pause: (
      <>
        <rect x="6" y="4" width="4" height="16" fill="currentColor" />
        <rect x="14" y="4" width="4" height="16" fill="currentColor" />
      </>
    ),
    rotate: (
      <>
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.8 1.03 6.44 2.7L21 8" />
        <path d="M21 3v5h-5" />
      </>
    ),
    scale: (
      <>
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10M12 3v18M3 7h18" />
      </>
    ),
    award: (
      <>
        <circle cx="12" cy="8" r="6" />
        <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.2 0l-3.58 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
      </>
    ),
    volume: (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    x: (
      <path d="M18 6 6 18M6 6l12 12" />
    ),
  };

  return <svg {...common}>{paths[name] || paths.workout}</svg>;
}
