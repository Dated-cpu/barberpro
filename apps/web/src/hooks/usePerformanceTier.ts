'use client';

import { useEffect, useState } from 'react';

export type PerformanceTier = 'low' | 'medium' | 'high';

export interface PerformanceConfig {
  tier: PerformanceTier;
}

const LOW: PerformanceConfig = { tier: 'low' };
const MEDIUM: PerformanceConfig = { tier: 'medium' };
const HIGH: PerformanceConfig = { tier: 'high' };

async function detectTier(): Promise<PerformanceTier> {
  try {
    const { getGPUTier } = await import('detect-gpu');
    const gpuTier = await getGPUTier();
    const tier = typeof gpuTier.tier === 'number' ? gpuTier.tier : 0;
    if (tier >= 3) return 'high';
    if (tier >= 2) return 'medium';
    return 'low';
  } catch {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (isMobile || (memory !== undefined && memory < 4)) return 'low';
    if (memory !== undefined && memory < 8) return 'medium';
    return 'high';
  }
}

function tierFromSearch(): PerformanceTier | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const val = params.get('__tier');
  if (val === 'high' || val === 'medium' || val === 'low') return val;
  return null;
}

const TIER_MAP: Record<PerformanceTier, PerformanceConfig> = { low: LOW, medium: MEDIUM, high: HIGH };

export function usePerformanceTier(): PerformanceConfig {
  const override = tierFromSearch();
  const [config, setConfig] = useState<PerformanceConfig>(override ? TIER_MAP[override] : MEDIUM);

  useEffect(() => {
    if (override) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setConfig(LOW);
      return;
    }

    detectTier().then((tier) => {
      setConfig(TIER_MAP[tier]);
    });
  }, [override]);

  return config;
}
