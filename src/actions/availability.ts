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
  timeToMinutes,
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
    serviceId?: string | null;
    serviceName?: string | null;
    staffId?: string | null;
    resourceId?: string | null;
    locationId?: string | null;
  };
};

export type AvailableSlotsError = {
  error: string;
  slots: [];
};

function normalizeWeeklyHours(hours: any): any[] {
  if (Array.isArray(hours)) {
    return hours.map((h: any) => ({
      day: h.day === 0 ? 7 : h.day,
      slots: Array.isArray(h.slots) ? h.slots : [],
    }));
  }
  if (typeof hours === "object" && hours !== null) {
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
      const dayData = hours?.[dayKey] || { enabled: false, ranges: [] };
      const slots =
        dayData.enabled && Array.isArray(dayData.ranges)
          ? dayData.ranges.map((r: any) => ({ open: r.start, close: r.end }))
          : [];
      result.push({ day: dayNum, slots });
    }
    return result;
  }
  return [];
}


export async function getAvailableSlots(
  slug: string,
  date: Date,
  staffId?: string | null,
  serviceId?: string | null,
  resourceId?: string | null,
  locationId?: string | null,
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
      services: {
        where: serviceId
          ? { id: serviceId, isActive: true }
          : { isActive: true },
        include: {
          staffServices: {
            include: { staff: true },
          },
        },
      },
    },
  });

  if (!professional?.config) {
    return { error: "Profesional no encontrado", slots: [] };
  }

  const { config, googleAccount } = professional;

  // 1. Determine service parameters
  const selectedService = professional.services?.[0] || null;
  if (serviceId && !selectedService) {
    return { error: "Servicio no encontrado o inactivo", slots: [] };
  }

  const slotDuration = selectedService?.duration || config.slotDuration || 30;
  const bufferTime = selectedService !== null ? selectedService.bufferTime : config.bufferTime || 0;

  // 2. Validate StaffService relationship if both staffId and serviceId are provided
  if (staffId && selectedService && selectedService.staffServices.length > 0) {
    const isAssigned = selectedService.staffServices.some(
      (ss) => ss.staffId === staffId && ss.staff.isActive
    );
    if (!isAssigned) {
      return { error: "El especialista no ofrece el servicio seleccionado", slots: [] };
    }
  }

  // 3. Validate Location if provided
  if (locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: locationId, userId: professional.id },
    });
    if (!loc) {
      return { error: "Sede no encontrada", slots: [] };
    }
  }

  // 4. Validate Resource if provided
  if (resourceId) {
    const res = await prisma.resource.findFirst({
      where: { id: resourceId, userId: professional.id, isActive: true },
    });
    if (!res) {
      return { error: "Recurso físico no encontrado o inactivo", slots: [] };
    }
    if (locationId && res.locationId && res.locationId !== locationId) {
      return { error: "El recurso físico no pertenece a la sede seleccionada", slots: [] };
    }
  }

  const now = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // If date is in the past, return 0 slots
  if (dateStr < todayStr) {
    return {
      slots: [],
      meta: {
        slug: normalizedSlug,
        date: dateStr,
        slotDuration,
        bufferTime,
        weekDay: getWeekDayFromDate(date),
        googleEventsBlocked: 0,
        appointmentsBlocked: 0,
        serviceId,
        serviceName: selectedService?.name || null,
        staffId: staffId || null,
        resourceId: resourceId || null,
        locationId: locationId || null,
      },
    };
  }

  const weekDay = getWeekDayFromDate(date);
  const dayStart = startOfLocalDay(date);
  const dayEnd = endOfLocalDay(date);

  let candidateSlotsList: number[] = [];
  let busyBlocks: BusyBlock[] = [];
  let appointmentsCount = 0;

  // 5. Google Calendar busy blocks (applies to owner calendar)
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

  // 6. Include busy blocks from Resource if specified
  if (resourceId) {
    const resourceAppointments = await prisma.appointment.findMany({
      where: {
        userId: professional.id,
        resourceId,
        status: { in: [AppointmentStatus.PENDIENTE, AppointmentStatus.CONFIRMADA] },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
    });

    for (const apt of resourceAppointments) {
      const effectiveEnd = new Date(apt.endTime.getTime() + bufferTime * 60 * 1000);
      const interval = clampBusyToDay(apt.startTime, effectiveEnd, dayStart, dayEnd);
      if (interval) busyBlocks.push(interval);
    }
  }

  if (staffId) {
    // Specific staff member selected
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, userId: professional.id, isActive: true },
    });

    if (!staff) {
      return { error: "Especialista no encontrado", slots: [] };
    }

    const weeklyHours = weeklyHoursFromJson(normalizeWeeklyHours(staff.weeklyHours));
    const windows = getDayWindows(weeklyHours, weekDay);
    candidateSlotsList = generateCandidateSlots(windows, slotDuration, bufferTime);

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: professional.id,
        staffId,
        status: { in: [AppointmentStatus.PENDIENTE, AppointmentStatus.CONFIRMADA] },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
    });
    appointmentsCount = appointments.length;

    for (const apt of appointments) {
      // Respect trailing buffer: appointment occupies startTime -> endTime + bufferTime
      const effectiveEnd = new Date(apt.endTime.getTime() + bufferTime * 60 * 1000);
      const interval = clampBusyToDay(apt.startTime, effectiveEnd, dayStart, dayEnd);
      if (interval) busyBlocks.push(interval);
    }
  } else if (selectedService && selectedService.staffServices.length > 0) {
    // Service has specific assigned staff members: union of their available slots
    const assignedStaff = selectedService.staffServices
      .map((ss) => ss.staff)
      .filter((s) => s.isActive);

    if (assignedStaff.length === 0) {
      // Fallback to business hours
      const weeklyHours = weeklyHoursFromJson(normalizeWeeklyHours(config.weeklyHours));
      const windows = getDayWindows(weeklyHours, weekDay);
      candidateSlotsList = generateCandidateSlots(windows, slotDuration, bufferTime);
    } else {
      // Compute union of available slots across all assigned specialists
      const allStaffSlotsSet = new Set<string>();

      for (const staffMember of assignedStaff) {
        const staffHours = weeklyHoursFromJson(normalizeWeeklyHours(staffMember.weeklyHours));
        const staffWindows = getDayWindows(staffHours, weekDay);
        const staffCandidates = generateCandidateSlots(staffWindows, slotDuration, bufferTime);

        const staffAppointments = await prisma.appointment.findMany({
          where: {
            userId: professional.id,
            staffId: staffMember.id,
            status: { in: [AppointmentStatus.PENDIENTE, AppointmentStatus.CONFIRMADA] },
            startTime: { lt: dayEnd },
            endTime: { gt: dayStart },
          },
        });

        const staffBusy: BusyBlock[] = [...busyBlocks];
        for (const apt of staffAppointments) {
          const effectiveEnd = new Date(apt.endTime.getTime() + bufferTime * 60 * 1000);
          const interval = clampBusyToDay(apt.startTime, effectiveEnd, dayStart, dayEnd);
          if (interval) staffBusy.push(interval);
        }

        const available = filterAvailableSlots(staffCandidates, slotDuration, staffBusy);
        for (const slot of available) {
          allStaffSlotsSet.add(slot);
        }
      }

      let sortedSlots = Array.from(allStaffSlotsSet).sort();

      // Filter past slots if today + 15 min lead time
      if (dateStr === todayStr) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const minBookingMinutes = currentMinutes + 15;
        sortedSlots = sortedSlots.filter((slot) => timeToMinutes(slot) >= minBookingMinutes);
      }

      return {
        slots: sortedSlots,
        meta: {
          slug: normalizedSlug,
          date: dateStr,
          slotDuration,
          bufferTime,
          weekDay,
          googleEventsBlocked: busyBlocks.length,
          appointmentsBlocked: 0,
          serviceId,
          serviceName: selectedService.name,
          staffId: null,
          resourceId: resourceId || null,
          locationId: locationId || null,
        },
      };
    }
  } else {
    // No specific staff: use standard business hours
    const weeklyHours = weeklyHoursFromJson(normalizeWeeklyHours(config.weeklyHours));
    const windows = getDayWindows(weeklyHours, weekDay);
    candidateSlotsList = generateCandidateSlots(windows, slotDuration, bufferTime);

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: professional.id,
        status: { in: [AppointmentStatus.PENDIENTE, AppointmentStatus.CONFIRMADA] },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
    });
    appointmentsCount = appointments.length;

    for (const apt of appointments) {
      const effectiveEnd = new Date(apt.endTime.getTime() + bufferTime * 60 * 1000);
      const interval = clampBusyToDay(apt.startTime, effectiveEnd, dayStart, dayEnd);
      if (interval) busyBlocks.push(interval);
    }
  }

  let finalSlots = filterAvailableSlots(
    candidateSlotsList,
    slotDuration,
    busyBlocks,
  );

  // Filter past slots if today + 15 min lead time
  if (dateStr === todayStr) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const minBookingMinutes = currentMinutes + 15;
    finalSlots = finalSlots.filter((slot) => timeToMinutes(slot) >= minBookingMinutes);
  }

  return {
    slots: finalSlots,
    meta: {
      slug: normalizedSlug,
      date: dateStr,
      slotDuration,
      bufferTime,
      weekDay,
      googleEventsBlocked: busyBlocks.length,
      appointmentsBlocked: appointmentsCount,
      serviceId,
      serviceName: selectedService?.name || null,
      staffId: staffId || null,
      resourceId: resourceId || null,
      locationId: locationId || null,
    },
  };
}

export type MonthAvailabilityResult = {
  availableDates: string[]; // List of YYYY-MM-DD
  businessDaysOff: number[]; // 1..7
};

export async function getMonthAvailability(
  slug: string,
  year: number,
  month: number, // 0 = Jan ... 11 = Dec
  staffId?: string | null,
  serviceId?: string | null,
  resourceId?: string | null,
  locationId?: string | null,
): Promise<MonthAvailabilityResult> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return { availableDates: [], businessDaysOff: [] };
  }

  const professional = await prisma.user.findUnique({
    where: { slug: normalizedSlug },
    include: {
      config: true,
      services: {
        where: serviceId ? { id: serviceId, isActive: true } : { isActive: true },
        include: {
          staffServices: {
            include: { staff: true },
          },
        },
      },
    },
  });

  if (!professional?.config) {
    return { availableDates: [], businessDaysOff: [] };
  }

  const { config } = professional;
  const selectedService = professional.services?.[0] || null;
  const slotDuration = selectedService?.duration || config.slotDuration || 30;
  const bufferTime = selectedService !== null ? selectedService.bufferTime : config.bufferTime || 0;

  // 1. Determine relevant weekly hours
  let relevantWeeklyHours: any[] = [];
  if (staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, userId: professional.id, isActive: true },
    });
    if (staff) {
      relevantWeeklyHours = normalizeWeeklyHours(staff.weeklyHours);
    }
  } else if (selectedService && selectedService.staffServices.length > 0) {
    const activeStaff = selectedService.staffServices
      .map((ss) => ss.staff)
      .filter((s) => s.isActive);
    if (activeStaff.length > 0) {
      const mergedByDay: Record<number, any[]> = {};
      for (const st of activeStaff) {
        const norm = normalizeWeeklyHours(st.weeklyHours);
        for (const d of norm) {
          if (!mergedByDay[d.day]) mergedByDay[d.day] = [];
          if (Array.isArray(d.slots)) {
            mergedByDay[d.day].push(...d.slots);
          }
        }
      }
      relevantWeeklyHours = Object.entries(mergedByDay).map(([day, slots]) => ({
        day: Number(day),
        slots,
      }));
    } else {
      relevantWeeklyHours = normalizeWeeklyHours(config.weeklyHours);
    }
  } else {
    relevantWeeklyHours = normalizeWeeklyHours(config.weeklyHours);
  }

  // 2. Determine business days off (days with no slots)
  const businessDaysOff: number[] = [];
  const activeDaysMap = new Map<number, boolean>();
  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    const dayConfig = relevantWeeklyHours.find((h) => h.day === dayNum);
    if (!dayConfig || !Array.isArray(dayConfig.slots) || dayConfig.slots.length === 0) {
      businessDaysOff.push(dayNum);
      activeDaysMap.set(dayNum, false);
    } else {
      activeDaysMap.set(dayNum, true);
    }
  }

  // 3. For all days in this month from today onwards
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const candidateDates: { dateStr: string; dateObj: Date; weekDay: number }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dateStr < todayStr) continue;

    const dateObj = new Date(year, month, day, 12, 0, 0);
    const weekDay = getWeekDayFromDate(dateObj);

    if (activeDaysMap.get(weekDay)) {
      candidateDates.push({ dateStr, dateObj, weekDay });
    }
  }

  if (candidateDates.length === 0) {
    return { availableDates: [], businessDaysOff };
  }

  // 4. Batch query appointments for the whole month
  const monthStart = new Date(year, month, 1, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const appointments = await prisma.appointment.findMany({
    where: {
      userId: professional.id,
      status: { in: [AppointmentStatus.PENDIENTE, AppointmentStatus.CONFIRMADA] },
      startTime: { lt: monthEnd },
      endTime: { gt: monthStart },
      ...(staffId ? { staffId } : {}),
      ...(resourceId ? { resourceId } : {}),
    },
    select: {
      startTime: true,
      endTime: true,
      staffId: true,
      resourceId: true,
    },
  });

  const availableDates: string[] = [];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const { dateStr, dateObj, weekDay } of candidateDates) {
    const dayStart = startOfLocalDay(dateObj);
    const dayEnd = endOfLocalDay(dateObj);

    const dayAppointments = appointments.filter(
      (a) => a.startTime < dayEnd && a.endTime > dayStart
    );

    const busyBlocks: BusyBlock[] = [];
    for (const apt of dayAppointments) {
      const effectiveEnd = new Date(apt.endTime.getTime() + bufferTime * 60 * 1000);
      const interval = clampBusyToDay(apt.startTime, effectiveEnd, dayStart, dayEnd);
      if (interval) busyBlocks.push(interval);
    }

    const weeklyHoursObj = weeklyHoursFromJson(relevantWeeklyHours);
    const windows = getDayWindows(weeklyHoursObj, weekDay);
    const candidateSlots = generateCandidateSlots(windows, slotDuration, bufferTime);
    let daySlots = filterAvailableSlots(candidateSlots, slotDuration, busyBlocks);

    // If day is today, filter out past slots + 15 min lead time
    if (dateStr === todayStr) {
      const minBookingMinutes = currentMinutes + 15;
      daySlots = daySlots.filter((slot) => timeToMinutes(slot) >= minBookingMinutes);
    }

    if (daySlots.length > 0) {
      availableDates.push(dateStr);
    }
  }

  return { availableDates, businessDaysOff };
}

