import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export function parseTimeInTimezone(dateStr: string, timeStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const localStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  return fromZonedTime(localStr, timezone);
}

export function formatDateInTimezone(date: Date, timezone: string, format: 'date' | 'time' | 'datetime'): string {
  const zoned = toZonedTime(date, timezone);
  const year = zoned.getFullYear();
  const month = String(zoned.getMonth() + 1).padStart(2, '0');
  const day = String(zoned.getDate()).padStart(2, '0');
  const hours = String(zoned.getHours()).padStart(2, '0');
  const minutes = String(zoned.getMinutes()).padStart(2, '0');

  if (format === 'date') return `${year}-${month}-${day}`;
  if (format === 'time') return `${hours}:${minutes}`;
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

export function getDateRangeInTimezone(dateStr: string, timezone: string): { start: Date; end: Date } {
  const start = parseTimeInTimezone(dateStr, '00:00', timezone);
  const end = parseTimeInTimezone(dateStr, '23:59', timezone);
  return { start, end };
}

export function parseTime(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(':').map(Number);
  return { hours: parts[0] ?? 0, minutes: parts[1] ?? 0 };
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

export function addMinutesToTime(timeStr: string, minutes: number): string {
  const total = timeToMinutes(timeStr) + minutes;
  return minutesToTime(total);
}

export function isTimeInRange(time: string, start: string, end: string): boolean {
  const t = timeToMinutes(time);
  return t >= timeToMinutes(start) && t < timeToMinutes(end);
}
