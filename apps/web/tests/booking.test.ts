import { describe, it, expect } from 'vitest';
import {
  parseTimeInTimezone,
  formatDateInTimezone,
  getDateRangeInTimezone,
  timeToMinutes,
  addMinutesToTime,
  isTimeInRange,
  minutesToTime,
} from '../src/server/lib/date';

describe('Date utilities', () => {
  describe('timeToMinutes / minutesToTime', () => {
    it('should convert time to minutes', () => {
      expect(timeToMinutes('10:30')).toBe(630);
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('should convert minutes to time', () => {
      expect(minutesToTime(630)).toBe('10:30');
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(1439)).toBe('23:59');
    });
  });

  describe('addMinutesToTime', () => {
    it('should add minutes correctly', () => {
      expect(addMinutesToTime('10:00', 30)).toBe('10:30');
      expect(addMinutesToTime('10:00', 60)).toBe('11:00');
      expect(addMinutesToTime('23:00', 30)).toBe('23:30');
    });
  });

  describe('isTimeInRange', () => {
    it('should check if time is in range', () => {
      expect(isTimeInRange('10:00', '09:00', '18:00')).toBe(true);
      expect(isTimeInRange('09:00', '09:00', '18:00')).toBe(true);
      expect(isTimeInRange('18:00', '09:00', '18:00')).toBe(false);
      expect(isTimeInRange('08:00', '09:00', '18:00')).toBe(false);
    });
  });
});

describe('Slot generation logic', () => {
  it('should correctly handle time overlap detection', () => {
    function doSlotsOverlap(
      s1: number, e1: number,
      s2: number, e2: number,
    ): boolean {
      return s1 < e2 && e1 > s2;
    }

    expect(doSlotsOverlap(600, 660, 650, 710)).toBe(true);
    expect(doSlotsOverlap(600, 630, 630, 700)).toBe(false);
    expect(doSlotsOverlap(600, 660, 660, 720)).toBe(false);
    expect(doSlotsOverlap(700, 760, 600, 660)).toBe(false);
    expect(doSlotsOverlap(600, 660, 600, 660)).toBe(true);
  });

  it('should handle break time exclusion', () => {
    const breakStart = timeToMinutes('13:00');
    const breakEnd = timeToMinutes('14:00');

    function slotOverlapsBreak(slotStart: number, slotEnd: number): boolean {
      return slotStart < breakEnd && slotEnd > breakStart;
    }

    expect(slotOverlapsBreak(timeToMinutes('12:30'), timeToMinutes('13:30'))).toBe(true);
    expect(slotOverlapsBreak(timeToMinutes('13:00'), timeToMinutes('14:00'))).toBe(true);
    expect(slotOverlapsBreak(timeToMinutes('12:00'), timeToMinutes('13:00'))).toBe(false);
    expect(slotOverlapsBreak(timeToMinutes('14:00'), timeToMinutes('15:00'))).toBe(false);
  });

  it('should generate slots for a full working day', () => {
    const startMinutes = timeToMinutes('09:00');
    const endMinutes = timeToMinutes('18:00');
    const duration = 60;
    const slots: string[] = [];

    let current = startMinutes;
    while (current + duration <= endMinutes) {
      slots.push(minutesToTime(current));
      current += duration;
    }

    expect(slots).toHaveLength(9);
    expect(slots[0]).toBe('09:00');
    expect(slots[slots.length - 1]).toBe('17:00');
  });

  it('should skip slots that overlap with existing appointments', () => {
    const existingApps = [
      { start: timeToMinutes('10:00'), end: timeToMinutes('11:00') },
      { start: timeToMinutes('14:00'), end: timeToMinutes('15:00') },
    ];

    const duration = 60;
    const slots: string[] = [];
    let current = timeToMinutes('09:00');
    const end = timeToMinutes('18:00');

    while (current + duration <= end) {
      let isOccupied = false;
      for (const app of existingApps) {
        if (current < app.end && current + duration > app.start) {
          isOccupied = true;
          break;
        }
      }
      if (!isOccupied) {
        slots.push(minutesToTime(current));
      }
      current += duration;
    }

    expect(slots).toHaveLength(7);
    expect(slots).not.toContain('10:00');
    expect(slots).not.toContain('14:00');
    expect(slots).toContain('09:00');
    expect(slots).toContain('11:00');
    expect(slots).toContain('17:00');
  });

  it('should handle different service durations', () => {
    const startMinutes = timeToMinutes('09:00');
    const endMinutes = timeToMinutes('18:00');

    function countSlots(duration: number): number {
      let count = 0;
      let current = startMinutes;
      while (current + duration <= endMinutes) {
        count++;
        current += duration;
      }
      return count;
    }

    expect(countSlots(30)).toBe(18);
    expect(countSlots(60)).toBe(9);
    expect(countSlots(90)).toBe(6);
    expect(countSlots(120)).toBe(4);
  });

  it('should prevent double booking at exact overlap', () => {
    const appStart = timeToMinutes('10:00');
    const appEnd = timeToMinutes('11:00');

    const slotStart = timeToMinutes('10:00');
    const slotEnd = timeToMinutes('11:00');

    const isOverlap = slotStart < appEnd && slotEnd > appStart;
    expect(isOverlap).toBe(true);
  });

  it('should allow booking at adjacent times', () => {
    const appStart = timeToMinutes('10:00');
    const appEnd = timeToMinutes('11:00');

    const slotStart = timeToMinutes('11:00');
    const slotEnd = timeToMinutes('12:00');

    const isOverlap = slotStart < appEnd && slotEnd > appStart;
    expect(isOverlap).toBe(false);
  });
});
