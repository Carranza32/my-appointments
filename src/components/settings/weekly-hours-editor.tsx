"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { saveWeeklyHours } from "@/actions/settings";
import {
  DAY_LABELS,
  WEEK_DAYS,
  type DaySchedule,
  type TimeSlot,
  type WeeklyHours,
} from "@/types/business";

function getDaySchedule(hours: WeeklyHours, day: number): DaySchedule {
  return hours.find((d) => d.day === day) ?? { day, slots: [] };
}

function upsertDay(hours: WeeklyHours, daySchedule: DaySchedule): WeeklyHours {
  const rest = hours.filter((d) => d.day !== daySchedule.day);
  if (daySchedule.slots.length === 0) return rest;
  return [...rest, daySchedule].sort((a, b) => a.day - b.day);
}

// Sum active working hours per day
function calculateTotalHours(slots: TimeSlot[]): number {
  let total = 0;
  for (const slot of slots) {
    const [openH, openM] = slot.open.split(":").map(Number);
    const [closeH, closeM] = slot.close.split(":").map(Number);
    if (!isNaN(openH) && !isNaN(closeH)) {
      const openMin = openH * 60 + openM;
      const closeMin = closeH * 60 + closeM;
      if (closeMin > openMin) {
        total += (closeMin - openMin) / 60;
      }
    }
  }
  return total;
}

// Validate slots ranges
function hasInvalidSlots(slots: TimeSlot[]): boolean {
  return slots.some((slot) => {
    const [openH, openM] = slot.open.split(":").map(Number);
    const [closeH, closeM] = slot.close.split(":").map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;
    return closeMin <= openMin;
  });
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

function getOptionsForValue(val: string) {
  if (!TIME_OPTIONS.includes(val)) {
    return [val, ...TIME_OPTIONS].sort();
  }
  return TIME_OPTIONS;
}

type Props = {
  initialHours: WeeklyHours;
};

export function WeeklyHoursEditor({ initialHours }: Props) {
  const [hours, setHours] = useState<WeeklyHours>(initialHours);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pending, startTransition] = useTransition();

  // Self-hiding notifications
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5500);
      return () => clearTimeout(t);
    }
  }, [message]);

  function updateDay(day: number, slots: TimeSlot[]) {
    setHours((prev) => upsertDay(prev, { day, slots }));
  }

  function addSlot(day: number) {
    const current = getDaySchedule(hours, day);
    // standard 09:00 to 18:00 default
    const newSlot = current.slots.length === 0
      ? { open: "09:00", close: "18:00" }
      : { open: "09:00", close: "13:00" };
    updateDay(day, [...current.slots, newSlot]);
  }

  function removeSlot(day: number, index: number) {
    const current = getDaySchedule(hours, day);
    updateDay(
      day,
      current.slots.filter((_, i) => i !== index)
    );
  }

  function updateSlot(
    day: number,
    index: number,
    field: "open" | "close",
    value: string
  ) {
    const current = getDaySchedule(hours, day);
    const slots = current.slots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    updateDay(day, slots);
  }

  // Copy to Monday-Friday workdays
  function copyToWorkdays(fromDay: number) {
    const currentSchedule = getDaySchedule(hours, fromDay);
    const slotsToCopy = [...currentSchedule.slots];

    if (slotsToCopy.length === 0) return;

    setHours((prev) => {
      let newHours = [...prev];
      const workdays = [1, 2, 3, 4, 5]; // Lun (1) to Vie (5)
      for (const wd of workdays) {
        newHours = upsertDay(newHours, {
          day: wd,
          slots: JSON.parse(JSON.stringify(slotsToCopy)),
        });
      }
      return newHours;
    });

    setMessage({
      text: "Horarios copiados a todos los días laborables (Lun - Vie).",
      type: "success",
    });
  }

  function handleSave() {
    setMessage(null);

    // Final sanity check before submission
    const globalInvalid = hours.some((d) => hasInvalidSlots(d.slots));
    if (globalInvalid) {
      setMessage({
        text: "Corrige los intervalos de tiempo inválidos antes de guardar.",
        type: "error",
      });
      return;
    }

    startTransition(async () => {
      const result = await saveWeeklyHours(hours);
      if (result?.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        setMessage({ text: "Horarios guardados correctamente en tu perfil.", type: "success" });
      }
    });
  }

  // Check if any day has invalid ranges to disable the general save action
  const hasAnyValidationError = useMemo(() => {
    return hours.some((d) => hasInvalidSlots(d.slots));
  }, [hours]);

  return (
    <div className="space-y-6">
      {/* High contrast, Solid Notification Banner */}
      {message && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-3 rounded-2xl border px-4.5 py-4 shadow-xl transition-all duration-300 ${
            message.type === "success"
              ? "border-emerald-250 bg-white text-emerald-800 dark:border-emerald-900/30 dark:bg-slate-900 dark:text-emerald-350"
              : "border-red-200 bg-white text-red-700 dark:border-red-900/30 dark:bg-slate-900 dark:text-red-400"
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${message.type === "success" ? "bg-emerald-400" : "bg-red-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${message.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}></span>
          </span>
          <p className="text-xs font-bold leading-none">{message.text}</p>
        </div>
      )}

      {/* Week days loops */}
      <div className="grid grid-cols-1 gap-4">
        {WEEK_DAYS.map((day) => {
          const schedule = getDaySchedule(hours, day);
          const enabled = schedule.slots.length > 0;
          const totalHours = calculateTotalHours(schedule.slots);
          const hasError = hasInvalidSlots(schedule.slots);

          return (
            <div
              key={day}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 shadow-xs ${
                enabled
                  ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 border-l-4 border-l-primary-600 dark:border-l-primary-500"
                  : "border-slate-200/50 bg-slate-50/70 dark:border-slate-800/30 dark:bg-slate-950/40 opacity-70"
              }`}
            >
              {/* Day Header Row */}
              <div className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Sliding Toggle switch */}
                  <button
                    onClick={() => {
                      if (enabled) updateDay(day, []);
                      else addSlot(day);
                    }}
                    type="button"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-hidden ${
                      enabled ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-300 ease-in-out ${
                        enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
                      {DAY_LABELS[day]}
                    </span>
                    {enabled ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-100 dark:border-blue-900/30 px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                        {totalHours.toFixed(1)} hrs laborables
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                        No laborable
                      </span>
                    )}
                  </div>
                </div>

                {/* Day level actions */}
                {enabled && (
                  <div className="flex items-center gap-2">
                    {/* Copy to workdays shortcut button */}
                    <button
                      type="button"
                      onClick={() => copyToWorkdays(day)}
                      title="Copiar horario de este día a Lunes-Viernes"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-3xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      <span>Copiar a laborables</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addSlot(day)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/30 dark:hover:bg-primary-950/50 border border-primary-100/50 dark:border-primary-900/20 px-3.5 py-2 text-3xs font-black uppercase tracking-wider text-primary-700 dark:text-primary-400 transition-colors cursor-pointer"
                    >
                      <span>+ Franja</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Time Slots rows (if enabled) */}
              {enabled && (
                <div className="mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-3.5">
                  {schedule.slots.map((slot, index) => {
                    const isSlotInvalid = slot.close <= slot.open;
                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 relative"
                      >
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 px-4 py-2.5 rounded-xl shadow-inner inline-flex self-start focus-within:border-primary-500 transition-colors">
                          {/* Clock icon */}
                          <svg className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>

                          {/* Time Selector Dropdowns */}
                          <div className="flex items-center gap-1.5">
                            <select
                              value={slot.open}
                              onChange={(e) =>
                                updateSlot(day, index, "open", e.target.value)
                              }
                              className="bg-transparent border-0 font-extrabold text-slate-850 dark:text-slate-105 text-sm focus:outline-hidden cursor-pointer appearance-none pr-1 select-none"
                            >
                              {getOptionsForValue(slot.open).map((t) => (
                                <option key={`open-${t}`} value={t} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold">
                                  {t}
                                </option>
                              ))}
                            </select>
                            <svg className="h-3 w-3 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          <span className="text-xs font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest px-1">a</span>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={slot.close}
                              onChange={(e) =>
                                updateSlot(day, index, "close", e.target.value)
                              }
                              className="bg-transparent border-0 font-extrabold text-slate-850 dark:text-slate-105 text-sm focus:outline-hidden cursor-pointer appearance-none pr-1 select-none"
                            >
                              {getOptionsForValue(slot.close).map((t) => (
                                <option key={`close-${t}`} value={t} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold">
                                  {t}
                                </option>
                              ))}
                            </select>
                            <svg className="h-3 w-3 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Trash Action */}
                        <button
                          type="button"
                          onClick={() => removeSlot(day, index)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/10 bg-red-500/5 text-red-600 hover:bg-red-500/15 hover:scale-102 transition-all cursor-pointer shadow-xs self-start sm:self-center"
                        >
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" x2="10" y1="11" y2="17" />
                            <line x1="14" x2="14" y1="11" y2="17" />
                          </svg>
                        </button>

                        {/* Error warning label */}
                        {isSlotInvalid && (
                          <span className="sm:absolute sm:-bottom-4.5 sm:left-0 text-3xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/5 px-2 py-0.5 rounded-md border border-red-500/10 animate-pulse">
                            ¡Aviso! La hora de salida debe ser posterior a la de entrada
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Save Action Bar */}
      <div className="flex items-center gap-3.5 border-t border-slate-200/50 dark:border-slate-800/40 pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || hasAnyValidationError}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-primary-600/10 hover:bg-primary-700 hover:scale-102 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 cursor-pointer"
        >
          {pending ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Guardando horarios…</span>
            </>
          ) : (
            <span>Guardar Horarios</span>
          )}
        </button>

        {hasAnyValidationError && (
          <p className="text-xs font-bold text-red-650 dark:text-red-400">
            * Corrige los errores en tus intervalos antes de guardar.
          </p>
        )}
      </div>
    </div>
  );
}
