import { transaction } from '../db/helpers';
import { workingDayRepository } from '../repositories/workingDay';
import { appointmentRepository } from '../repositories/appointment';
import { blockedSlotRepository } from '../repositories/blockedSlot';
import { serviceRepository } from '../repositories/service';
import { parseTimeInTimezone, formatDateInTimezone, getDateRangeInTimezone, timeToMinutes, addMinutesToTime } from '../lib/date';
import type { AvailableSlot } from '@/types/booking';
import { NotFoundError } from '../lib/errors';
import type { TxClient } from '../db/helpers';

function doSlotsOverlap(
  slotStartMinutes: number,
  slotEndMinutes: number,
  appStartMinutes: number,
  appEndMinutes: number,
): boolean {
  return slotStartMinutes < appEndMinutes && slotEndMinutes > appStartMinutes;
}

async function resolveBarberId(tx: TxClient, barberId?: string | null): Promise<string> {
  if (barberId) return barberId;
  const barber = await tx.user.findFirst({
    where: { role: 'BARBER', isActive: true, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!barber) throw new NotFoundError('Barber');
  return barber.id;
}

export const availabilityService = {
  async getAvailableSlots(barberId: string | undefined, dateStr: string, serviceIds: string[]): Promise<AvailableSlot[]> {
    return transaction(async (tx) => {
      const resolvedBarberId = await resolveBarberId(tx, barberId);

      const services = await Promise.all(
        serviceIds.map((sid) => serviceRepository.findById(tx, sid)),
      );
      const validServices = services.filter(Boolean);
      if (validServices.length !== serviceIds.length) {
        throw new NotFoundError('Service');
      }

      const barber = await tx.user.findUnique({
        where: { id: resolvedBarberId, deletedAt: null, role: 'BARBER', isActive: true },
        include: { branchAssignments: { include: { branch: true }, take: 1 } },
      });
      if (!barber) throw new NotFoundError('Barber');

      const branch = barber.branchAssignments[0]?.branch;
      const timezone = branch?.timezone ?? 'Europe/Moscow';

      const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay();
      const jsDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

      const dateStart = new Date(dateStr + 'T00:00:00');
      let workingDay = await workingDayRepository.findByBarberAndDate(tx, resolvedBarberId, dateStart);

      if (!workingDay) {
        workingDay = await workingDayRepository.findTemplateByDayOfWeek(tx, resolvedBarberId, jsDayOfWeek);
      }

      if (!workingDay || workingDay.isDayOff) {
        return [];
      }

      const { start: dayStart, end: dayEnd } = getDateRangeInTimezone(dateStr, timezone);

      const appointments = await appointmentRepository.findByBarberAndDate(tx, resolvedBarberId, dayStart, dayEnd);
      const blockedSlots = await blockedSlotRepository.findByBarberAndTimeRange(tx, resolvedBarberId, dayStart, dayEnd);

      const slots: AvailableSlot[] = [];
      const totalDuration = validServices.reduce((sum, s) => sum + s!.duration, 0);

      let currentMinutes = timeToMinutes(workingDay.startTime);
      const endMinutes = timeToMinutes(workingDay.endTime);
      const breakStartMinutes = workingDay.breakStart ? timeToMinutes(workingDay.breakStart) : null;
      const breakEndMinutes = workingDay.breakEnd ? timeToMinutes(workingDay.breakEnd) : null;

      while (currentMinutes + totalDuration <= endMinutes) {
        const slotEndMinutes = currentMinutes + totalDuration;

        if (breakStartMinutes !== null && breakEndMinutes !== null) {
          if (doSlotsOverlap(currentMinutes, slotEndMinutes, breakStartMinutes, breakEndMinutes)) {
            currentMinutes = breakEndMinutes;
            continue;
          }
        }

        let isOccupied = false;

        for (const app of appointments) {
          const appStart = formatDateInTimezone(app.startTime, timezone, 'time');
          const appEnd = formatDateInTimezone(app.endTime, timezone, 'time');
          const appStartMin = timeToMinutes(appStart);
          const appEndMin = timeToMinutes(appEnd);

          if (doSlotsOverlap(currentMinutes, slotEndMinutes, appStartMin, appEndMin)) {
            isOccupied = true;
            break;
          }
        }

        if (!isOccupied) {
          for (const block of blockedSlots) {
            const blockStart = formatDateInTimezone(block.startTime, timezone, 'time');
            const blockEnd = formatDateInTimezone(block.endTime, timezone, 'time');
            const blockStartMin = timeToMinutes(blockStart);
            const blockEndMin = timeToMinutes(blockEnd);

            if (doSlotsOverlap(currentMinutes, slotEndMinutes, blockStartMin, blockEndMin)) {
              isOccupied = true;
              break;
            }
          }
        }

        if (!isOccupied) {
          const slotStartStr = addMinutesToTime(workingDay.startTime, currentMinutes - timeToMinutes(workingDay.startTime));
          const slotEndStr = addMinutesToTime(slotStartStr, totalDuration);

          const startDate = parseTimeInTimezone(dateStr, slotStartStr, timezone);
          const endDate = parseTimeInTimezone(dateStr, slotEndStr, timezone);

          slots.push({
            startTime: slotStartStr,
            endTime: slotEndStr,
            startDate,
            endDate,
          });
        }

        currentMinutes = slotEndMinutes;
      }

      return slots;
    });
  },

  async getBarberSchedule(barberId: string, dateStr: string) {
    return transaction(async (tx) => {
      const barber = await tx.user.findUnique({
        where: { id: barberId, deletedAt: null, role: 'BARBER' },
        include: { branchAssignments: { include: { branch: true }, take: 1 } },
      });
      if (!barber) throw new NotFoundError('Barber');

      const branch = barber.branchAssignments[0]?.branch;
      const timezone = branch?.timezone ?? 'Europe/Moscow';
      const { start: dayStart, end: dayEnd } = getDateRangeInTimezone(dateStr, timezone);

      const appointments = await appointmentRepository.findByBarberAndDate(tx, barberId, dayStart, dayEnd);
      return appointments;
    });
  },
};
