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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#007AFF] text-white shadow-xs">
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
          <h3 className="text-base font-semibold text-[#1D1D1F] leading-tight">
            Probar disponibilidad en vivo
          </h3>
          <p className="mt-0.5 text-xs text-[#86868B]">
            Verifica slots libres cruzando horarios, Google Calendar y citas locales.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3.5">
        <div className="flex-1 min-w-[200px] max-w-[280px]">
          <label className="mb-1.5 block text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
            Seleccionar Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-xs font-normal text-[#1D1D1F] outline-none transition-all focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
          />
        </div>
        <button
          type="button"
          onClick={handleCheck}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-[#007AFF] px-5 py-2 text-xs font-medium text-white hover:bg-[#0062cc] active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 cursor-pointer h-[38px]"
        >
          {pending ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
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
          <span className="inline-block rounded-lg bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#86868B]">
            {meta}
          </span>
        </div>
      )}

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-3 text-xs text-[#FF3B30] animate-in fade-in duration-200">
          <span className="shrink-0 text-base leading-none select-none">⚠️</span>
          <span className="leading-relaxed font-medium text-[#1D1D1F]">{error}</span>
        </div>
      )}

      {slots.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider mb-3">
            Horarios Disponibles para Reserva
          </p>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <span
                key={slot}
                className="inline-block rounded-xl border border-[#007AFF]/20 bg-[#007AFF]/10 px-3 py-1.5 text-xs font-medium text-[#007AFF] shadow-xs active:scale-[0.98] transition-all cursor-default"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
      )}

      {!pending && !error && slots.length === 0 && meta && (
        <div className="mt-6 rounded-xl border border-dashed border-black/[0.08] p-6 text-center">
          <p className="text-xs text-[#86868B]">
            Sin huecos disponibles para el día seleccionado.
          </p>
        </div>
      )}
    </div>
  );
}
