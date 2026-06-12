"use client";

import { useState, useTransition } from "react";
import { getAvailableSlots } from "@/actions/availability";

type Props = {
  slug: string;
};

export function AvailabilityTester({ slug }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCheck() {
    setError(null);
    setMeta(null);
    startTransition(async () => {
      const result = await getAvailableSlots(slug, new Date(`${date}T12:00:00`));
      if ("error" in result) {
        setError(result.error);
        setSlots([]);
        return;
      }
      setSlots(result.slots);
      setMeta(
        `Duración ${result.meta.slotDuration} min · Buffer ${result.meta.bufferTime} min · Día ${result.meta.weekDay}`
      );
    });
  }

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="m21 16-4 4-4-4" />
            <path d="M17 20V4" />
            <path d="m3 8 4-4 4 4" />
            <path d="M7 4v16" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
            Probar disponibilidad en vivo
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Verifica slots libres cruzando horarios, Google Calendar y citas locales.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3.5">
        <div className="flex-1 min-w-[200px] max-w-[280px]">
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Seleccionar Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/60 px-3.5 py-2.5 text-sm font-extrabold text-slate-700 shadow-2xs outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-primary-500/20"
          />
        </div>
        <button
          type="button"
          onClick={handleCheck}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-primary-700 active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary-500/10 disabled:opacity-50 cursor-pointer h-[46px]"
        >
          {pending ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculando…
            </span>
          ) : (
            "Calcular slots"
          )}
        </button>
      </div>

      {meta && (
        <div className="mt-4">
          <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-2xs font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/20">
            {meta}
          </span>
        </div>
      )}

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200/60 bg-red-50/98 p-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/40 dark:text-red-300 animate-in fade-in duration-200">
          <span className="shrink-0 text-base leading-none select-none">⚠️</span>
          <span className="leading-relaxed font-semibold">{error}</span>
        </div>
      )}

      {slots.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
            Horarios Disponibles para Reserva
          </p>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <span
                key={slot}
                className="inline-block rounded-xl border border-primary-100/50 bg-primary-50 px-3.5 py-2 text-xs font-bold text-primary-750 dark:border-primary-900/30 dark:bg-primary-950/40 dark:text-primary-350 shadow-2xs hover:scale-105 active:scale-95 duration-200 transition-all cursor-default"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
      )}

      {!pending && !error && slots.length === 0 && meta && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Sin huecos disponibles para el día seleccionado.
          </p>
        </div>
      )}
    </div>
  );
}
