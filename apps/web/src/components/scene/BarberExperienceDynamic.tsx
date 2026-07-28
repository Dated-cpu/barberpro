'use client';

import dynamic from 'next/dynamic';

export const BarberExperienceDynamic = dynamic(
  () => import('./BarberExperienceLite').then((m) => ({ default: m.BarberExperienceLite })),
  { ssr: false },
);
