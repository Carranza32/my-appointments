import type { WeeklyHours } from "@/types/business";
import {
  intervalsOverlap,
  minutesToTime,
  timeToMinutes,
  type MinuteInterval,
} from "@/lib/time-utils";

export type BusyBlock = MinuteInterval;

export function getDayWindows(
  weeklyHours: WeeklyHours,
  weekDay: number,
): MinuteInterval[] {
  const day = weeklyHours.find((d) => d.day === weekDay);
  if (!day?.slots.length) return [];

  return day.slots.map((slot) => ({
    start: timeToMinutes(slot.open),
    end: timeToMinutes(slot.close),
  }));
}

export function generateCandidateSlots(
  windows: MinuteInterval[],
  slotDuration: number,
  bufferTime: number,
): number[] {
  const step = slotDuration + bufferTime;
  const candidates: number[] = [];

  for (const window of windows) {
    for (
      let start = window.start;
      start + slotDuration <= window.end;
      start += step
    ) {
      candidates.push(start);
    }
  }

  return [...new Set(candidates)].sort((a, b) => a - b);
}

export function filterAvailableSlots(
  candidates: number[],
  slotDuration: number,
  busyBlocks: BusyBlock[],
): string[] {
  return candidates
    .filter((start) => {
      const end = start + slotDuration;
      return !busyBlocks.some((busy) =>
        intervalsOverlap(start, end, busy.start, busy.end),
      );
    })
    .map(minutesToTime);
}

export function dateTimeToMinutesFromLocalDay(
  dt: Date,
  dayStart: Date,
): { start: number; end: number } {
  const base = dayStart.getTime();
  const startMs = dt.getTime() - base;
  const start = Math.max(0, Math.floor(startMs / 60000));
  return { start, end: start };
}

export function clampBusyToDay(
  busyStart: Date,
  busyEnd: Date,
  dayStart: Date,
  dayEnd: Date,
): MinuteInterval | null {
  const start = Math.max(busyStart.getTime(), dayStart.getTime());
  const end = Math.min(busyEnd.getTime(), dayEnd.getTime());
  if (start >= end) return null;

  const base = dayStart.getTime();
  return {
    start: Math.floor((start - base) / 60000),
    end: Math.ceil((end - base) / 60000),
  };
}
