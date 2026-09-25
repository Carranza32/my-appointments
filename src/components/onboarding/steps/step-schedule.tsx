"use client";

import React from "react";
import { Clock, Copy, Check } from "lucide-react";

interface ScheduleSlot {
  open: string;
  close: string;
}

interface DaySchedule {
  day: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  slots: ScheduleSlot[];
}

interface StepScheduleProps {
  weeklyHours: DaySchedule[];
  onChangeWeeklyHours: (hours: DaySchedule[]) => void;
}

const DAYS_META = [
  { day: 1, label: "Lunes", short: "Lun" },
  { day: 2, label: "Martes", short: "Mar" },
  { day: 3, label: "Miércoles", short: "Mié" },
  { day: 4, label: "Jueves", short: "Jue" },
  { day: 5, label: "Viernes", short: "Vie" },
  { day: 6, label: "Sábado", short: "Sáb" },
  { day: 0, label: "Domingo", short: "Dom" },
];

export function StepSchedule({ weeklyHours, onChangeWeeklyHours }: StepScheduleProps) {
  // Ensure array has entries for all 7 days
  const getDaySlots = (day: number): ScheduleSlot[] => {
    const found = weeklyHours.find((h) => h.day === day);
    return found ? found.slots : [];
  };

  const isDayActive = (day: number): boolean => {
    return getDaySlots(day).length > 0;
  };

  const toggleDay = (day: number) => {
    const active = isDayActive(day);
    if (active) {
      // Remove day slots
      onChangeWeeklyHours(weeklyHours.filter((h) => h.day !== day));
    } else {
      // Add standard 09:00 - 18:00
      onChangeWeeklyHours([...weeklyHours, { day, slots: [{ open: "09:00", close: "18:00" }] }]);
    }
  };

  const updateTime = (day: number, field: "open" | "close", val: string) => {
    const updated = weeklyHours.map((h) => {
      if (h.day === day) {
        const slot = h.slots[0] || { open: "09:00", close: "18:00" };
        return {
          ...h,
          slots: [{ ...slot, [field]: val }],
        };
      }
      return h;
    });
    onChangeWeeklyHours(updated);
  };

  const copyMondayToWeekdays = () => {
    const monday = weeklyHours.find((h) => h.day === 1);
    const mondaySlot = monday?.slots[0] || { open: "09:00", close: "18:00" };

    const newHours: DaySchedule[] = [
      { day: 1, slots: [{ ...mondaySlot }] },
      { day: 2, slots: [{ ...mondaySlot }] },
      { day: 3, slots: [{ ...mondaySlot }] },
      { day: 4, slots: [{ ...mondaySlot }] },
      { day: 5, slots: [{ ...mondaySlot }] },
      // Keep saturday and sunday if they were active
      ...(isDayActive(6) ? [{ day: 6, slots: getDaySlots(6) }] : []),
      ...(isDayActive(0) ? [{ day: 0, slots: getDaySlots(0) }] : []),
    ];

    onChangeWeeklyHours(newHours);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6E6E73]">
          Indica los días y rangos horarios en los que tu negocio recibe clientes.
        </p>

        <button
          type="button"
          onClick={copyMondayToWeekdays}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-xs font-semibold text-[#007AFF] transition-all active:scale-95 flex-shrink-0"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar Lun a Vie</span>
        </button>
      </div>

      {/* Days List */}
      <div className="space-y-2.5">
        {DAYS_META.map(({ day, label, short }) => {
          const active = isDayActive(day);
          const currentSlot = getDaySlots(day)[0] || { open: "09:00", close: "18:00" };

          return (
            <div
              key={day}
              className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl transition-all duration-150 ${
                active
                  ? "bg-white border border-black/[0.08] shadow-sm"
                  : "bg-black/[0.02] border border-transparent opacity-60"
              }`}
            >
              {/* Day Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    active ? "bg-[#34C759]" : "bg-black/[0.15]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform absolute top-0.5 left-0.5 ${
                      active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>

                <span className={`text-sm font-semibold ${active ? "text-[#1D1D1F]" : "text-[#86868B]"}`}>
                  {label}
                </span>
              </div>

              {/* Time inputs */}
              {active ? (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="time"
                    value={currentSlot.open}
                    onChange={(e) => updateTime(day, "open", e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/[0.03] border border-black/[0.08] text-[#1D1D1F] font-mono text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-[#86868B] font-medium">a</span>
                  <input
                    type="time"
                    value={currentSlot.close}
                    onChange={(e) => updateTime(day, "close", e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/[0.03] border border-black/[0.08] text-[#1D1D1F] font-mono text-xs focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              ) : (
                <span className="text-xs text-[#86868B] font-medium pr-2">Cerrado</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
