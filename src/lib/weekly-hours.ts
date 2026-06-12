import type { WeeklyHours } from "@/types/business";

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseWeeklyHours(data: WeeklyHours): WeeklyHours | null {
  if (!Array.isArray(data)) return null;

  for (const day of data) {
    if (typeof day.day !== "number" || day.day < 1 || day.day > 7) {
      return null;
    }
    if (!Array.isArray(day.slots)) return null;

    for (const slot of day.slots) {
      if (!isValidTime(slot.open) || !isValidTime(slot.close)) {
        return null;
      }
      if (slot.open >= slot.close) return null;
    }
  }

  return data;
}

export function emptyWeeklyHours(): WeeklyHours {
  return [];
}

export function weeklyHoursFromJson(value: unknown): WeeklyHours {
  if (!Array.isArray(value)) return [];
  return value as WeeklyHours;
}
