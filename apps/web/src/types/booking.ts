export interface AvailableSlot {
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
}

export interface DateSlots {
  date: string;
  dayOfWeek: number;
  slots: AvailableSlot[];
}

export interface BarberAvailability {
  barberId: string;
  barberName: string;
  dates: DateSlots[];
}
