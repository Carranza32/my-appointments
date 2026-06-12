export type TimeSlot = {
  open: string;
  close: string;
};

export type DaySchedule = {
  day: number;
  slots: TimeSlot[];
};

export type WeeklyHours = DaySchedule[];

export const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
