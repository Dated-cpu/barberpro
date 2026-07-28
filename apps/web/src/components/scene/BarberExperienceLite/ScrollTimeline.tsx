'use client';

import { createContext, useContext, useRef, useState, useEffect, type ReactNode } from 'react';

export type Phase = 'craft' | 'ambiance' | 'precision' | 'cta';

export interface TimelineState {
  progress: number;
  phase: Phase;
  phaseProgress: number;
}

const PHASES: { phase: Phase; start: number; end: number }[] = [
  { phase: 'craft', start: 0, end: 0.30 },
  { phase: 'ambiance', start: 0.30, end: 0.55 },
  { phase: 'precision', start: 0.55, end: 0.80 },
  { phase: 'cta', start: 0.80, end: 1.00 },
];

function calcPhase(progress: number): { phase: Phase; phaseProgress: number } {
  for (const p of PHASES) {
    if (progress >= p.start && progress < p.end) {
      const phaseProgress = (progress - p.start) / (p.end - p.start);
      return { phase: p.phase, phaseProgress: Math.min(1, Math.max(0, phaseProgress)) };
    }
  }
  return { phase: 'cta', phaseProgress: 1 };
}

interface TimelineContextValue {
  timeline: TimelineState;
  sectionRef: React.RefObject<HTMLDivElement | null>;
}

const TimelineContext = createContext<TimelineContextValue | null>(null);

export function useScrollTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error('useScrollTimeline must be used within ScrollTimelineProvider');
  return ctx;
}

export function ScrollTimelineProvider({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const wh = window.innerHeight;

      const offset = wh - rect.top;
      const total = rect.height + wh;
      const p = Math.max(0, Math.min(1, offset / total));

      setProgress(prev => Math.abs(prev - p) > 0.001 ? p : prev);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { phase, phaseProgress } = calcPhase(progress);
  const timeline: TimelineState = { progress, phase, phaseProgress };

  return (
    <TimelineContext.Provider value={{ timeline, sectionRef }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function usePhaseVisibility(phase: Phase, fadeIn: number = 0.08, fadeOut?: number): number {
  const { timeline } = useScrollTimeline();
  const { progress } = timeline;

  for (const p of PHASES) {
    if (p.phase !== phase) continue;

    const phaseStart = p.start;
    const phaseEnd = p.end;
    const fadeInRange = fadeIn;
    const fadeOutRange = fadeOut !== undefined ? fadeOut : fadeIn;

    const fadeInEnd = phaseStart + fadeInRange;
    const fadeOutStart = phaseEnd - fadeOutRange;

    if (progress <= phaseStart) return 0;
    if (progress < fadeInEnd) return (progress - phaseStart) / fadeInRange;
    if (progress <= fadeOutStart) return 1;
    if (progress < phaseEnd) return (phaseEnd - progress) / fadeOutRange;
    return 0;
  }

  return 0;
}
