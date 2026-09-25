"use client";

import { useState, useEffect } from "react";

const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type Props = {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  availableDates?: string[];
  businessDaysOff?: number[];
  isLoading?: boolean;
  onMonthChange?: (year: number, month: number) => void;
};

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayStr() {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

export function MonthCalendar({
  selectedDate,
  onSelectDate,
  availableDates,
  businessDaysOff,
  isLoading = false,
  onMonthChange,
}: Props) {
  const today = todayStr();
  const initial = selectedDate
    ? new Date(`${selectedDate}T12:00:00`)
    : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(viewYear, viewMonth);
    }
  }, [viewYear, viewMonth]);

  function prevMonth() {
    let nextY = viewYear;
    let nextM = viewMonth - 1;
    if (viewMonth === 0) {
      nextM = 11;
      nextY = viewYear - 1;
    }
    setViewMonth(nextM);
    setViewYear(nextY);
  }

  function nextMonth() {
    let nextY = viewYear;
    let nextM = viewMonth + 1;
    if (viewMonth === 11) {
      nextM = 0;
      nextY = viewYear + 1;
    }
    setViewMonth(nextM);
    setViewYear(nextY);
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const currentNow = new Date();
  const isCurrentMonthOrPast =
    viewYear < currentNow.getFullYear() ||
    (viewYear === currentNow.getFullYear() && viewMonth <= currentNow.getMonth());

  return (
    <div className="w-full">
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold tracking-tight text-[#1D1D1F]">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-[#007AFF] font-medium animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-[#007AFF]" />
              Verificando cupos...
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isCurrentMonthOrPast}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150 ${
              isCurrentMonthOrPast
                ? "text-[#C7C7CC] opacity-40 cursor-not-allowed"
                : "text-[#48484A] hover:bg-[#F2F2F7] hover:text-[#007AFF] cursor-pointer active:scale-90"
            }`}
            aria-label="Mes anterior"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#48484A] hover:bg-[#F2F2F7] hover:text-[#007AFF] transition-all duration-150 cursor-pointer active:scale-90"
            aria-label="Mes siguiente"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-bold text-[#86868B] uppercase tracking-wider py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="aspect-square" />;

          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isPast = dateStr < today;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;

          // Check availability
          const hasSlots = availableDates !== undefined ? availableDates.includes(dateStr) : !isPast;
          const isDisabled = isPast || (availableDates !== undefined && !hasSlots);

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(dateStr)}
              className={`
                relative aspect-square rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-150 flex flex-col items-center justify-center
                ${
                  isSelected
                    ? "bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/30 scale-105 font-bold z-10"
                    : isDisabled
                      ? "cursor-not-allowed text-[#8E8E93]/40 bg-black/[0.01] select-none hover:bg-transparent"
                      : isToday
                        ? "border-2 border-[#007AFF] text-[#007AFF] font-bold hover:bg-[#007AFF]/10 cursor-pointer active:scale-95"
                        : "text-[#1D1D1F] hover:bg-[#F2F2F7] hover:text-[#007AFF] cursor-pointer active:scale-95"
                }
              `}
            >
              <span>{day}</span>
              {/* Availability Micro-dot */}
              {!isDisabled && !isSelected && (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#34C759]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Availability Legend */}
      <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex items-center justify-between text-[11px] text-[#86868B]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#34C759]" />
          <span>Días con horarios disponibles</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#8E8E93]/40" />
          <span>No disponible / Cerrado</span>
        </div>
      </div>
    </div>
  );
}
