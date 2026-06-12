"use client";

import { useState } from "react";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type Props = {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayStr() {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

export function MonthCalendar({ selectedDate, onSelectDate }: Props) {
  const today = todayStr();
  const initial = selectedDate
    ? new Date(`${selectedDate}T12:00:00`)
    : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/40 dark:bg-slate-900/30">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750 cursor-pointer active:scale-95 transition-all"
          aria-label="Mes anterior"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-150">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750 cursor-pointer active:scale-95 transition-all"
          aria-label="Mes siguiente"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-2xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;

          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isPast = dateStr < today;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary-600 text-white shadow-sm shadow-primary-500/20 active:scale-95"
                  : isPast
                    ? "cursor-not-allowed text-slate-300 dark:text-slate-700 opacity-60"
                    : "text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-700 dark:hover:text-primary-300 active:scale-95"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
