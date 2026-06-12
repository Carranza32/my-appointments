"use server";

import { AppointmentStatus } from "@prisma/client";
import {
  filterAvailableSlots,
  generateCandidateSlots,
  getDayWindows,
  clampBusyToDay,
  type BusyBlock,
} from "@/lib/availability";
import { fetchGoogleBusyBlocks } from "@/lib/google-calendar-client";
import { prisma } from "@/lib/prisma";
import {
  endOfLocalDay,
  getWeekDayFromDate,
  startOfLocalDay,
} from "@/lib/time-utils";
import { weeklyHoursFromJson } from "@/lib/weekly-hours";

export type AvailableSlotsResult = {
  slots: string[];
  meta: {
    slug: string;
    date: string;
    slotDuration: number;
    bufferTime: number;
    weekDay: number;
    googleEventsBlocked: number;
    appointmentsBlocked: number;
  };
};

export type AvailableSlotsError = {
  error: string;
  slots: [];
};

function convertStaffWeeklyHours(staffWeeklyHours: any): any[] {
  const dayKeysMap: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };

  const result: any[] = [];
  for (const [dayKey, dayNum] of Object.entries(dayKeysMap)) {
    const dayData = staffWeeklyHours?.[dayKey] || { enabled: false, ranges: [] };
    const slots = dayData.enabled && Array.isArray(dayData.ranges)
      ? dayData.ranges.map((r: any) => ({ open: r.start, close: r.end }))
      : [];
    result.push({ day: dayNum, slots });
  }
  return result;
}

export async function getAvailableSlots(
  slug: string,
  date: Date,
  staffId?: string | null,
): Promise<AvailableSlotsResult | AvailableSlotsError> {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return { error: "Slug inválido", slots: [] };
  }

  const professional = await prisma.user.findUnique({
    where: { slug: normalizedSlug },
    include: {
      config: true,
      googleAccount: true,
    },
  });

  if (!professional?.config) {
    return { error: "Profesional no encontrado", slots: [] };
  }

  const { config, googleAccount } = professional;

  // Determine weekly hours source
  let weeklyHoursObj: any = config.weeklyHours;
  let useStaffHours = false;

  if (staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, userId: professional.id },
    });
    if (staff) {
      weeklyHoursObj = convertStaffWeeklyHours(staff.weeklyHours);
      useStaffHours = true;
    }
  }

  const weeklyHours = weeklyHoursFromJson(weeklyHoursObj);
  const weekDay = getWeekDayFromDate(date);
  const windows = getDayWindows(weeklyHours, weekDay);

  if (windows.length === 0) {
    return {
      slots: [],
      meta: {
        slug: normalizedSlug,
        date: date.toISOString().slice(0, 10),
        slotDuration: config.slotDuration,
        bufferTime: config.bufferTime,
        weekDay,
        googleEventsBlocked: 0,
        appointmentsBlocked: 0,
      },
    };
  }

  const candidates = generateCandidateSlots(
    windows,
    config.slotDuration,
    config.bufferTime,
  );

  const busyBlocks: BusyBlock[] = [];
  const dayStart = startOfLocalDay(date);
  const dayEnd = endOfLocalDay(date);

  if (googleAccount) {
    try {
      const googleBusy = await fetchGoogleBusyBlocks(googleAccount, date);
      busyBlocks.push(...googleBusy);
    } catch (e) {
      console.error(
        "[getAvailableSlots] Google Calendar opcional no disponible, usando solo DB:",
        e,
      );
    }
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      userId: professional.id,
      status: {
        in: [AppointmentStatus.PENDIENTE, AppointmentStatus.CONFIRMADA],
      },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
      ...(useStaffHours ? { staffId } : {}),
    },
  });

  for (const apt of appointments) {
    const interval = clampBusyToDay(
      apt.startTime,
      apt.endTime,
      dayStart,
      dayEnd,
    );
    if (interval) busyBlocks.push(interval);
  }

  const slots = filterAvailableSlots(
    candidates,
    config.slotDuration,
    busyBlocks,
  );

  return {
    slots,
    meta: {
      slug: normalizedSlug,
      date: date.toISOString().slice(0, 10),
      slotDuration: config.slotDuration,
      bufferTime: config.bufferTime,
      weekDay,
      googleEventsBlocked: busyBlocks.length,
      appointmentsBlocked: appointments.length,
    },
  };
}
