'use client';

import { usePerformanceTier } from '@/hooks/usePerformanceTier';
import { ScrollTimelineProvider, useScrollTimeline } from './ScrollTimeline';
import { BackgroundScene } from './BackgroundScene';
import { ExperienceContent } from './ExperienceContent';

function ProgressThread() {
  const { timeline } = useScrollTimeline();
  const scaleX = timeline.progress;

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-50 h-px w-full">
      <div
        className="h-full bg-gold transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${scaleX})`, transformOrigin: 'left center' }}
      />
    </div>
  );
}

function SceneInner() {
  const { sectionRef } = useScrollTimeline();
  const { tier } = usePerformanceTier();
  const height = tier === 'low' ? '250vh' : tier === 'medium' ? '350vh' : '500vh';

  return (
    <section
      id="barber-experience"
      ref={sectionRef}
      className="relative"
      style={{ height }}
    >
      <ProgressThread />
      <div className="sticky top-0 z-10 h-screen overflow-hidden">
        <BackgroundScene />
        <div className="absolute inset-0 z-[3] flex items-center justify-center">
          <ExperienceContent />
        </div>
      </div>
    </section>
  );
}

export function BarberExperienceLite() {
  return (
    <ScrollTimelineProvider>
      <SceneInner />
    </ScrollTimelineProvider>
  );
}
