"use client";

import React from "react";
import { Clock, Calendar, AlertCircle } from "lucide-react";

interface TimeSlotSelectorProps {
  slots: string[];
  selectedTime: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectTime: (time: string) => void;
  dateLabel: string;
  onBackDate?: () => void;
}

export function TimeSlotSelector({
  slots,
  selectedTime,
  isLoading,
  error,
  onSelectTime,
  dateLabel,
  onBackDate,
}: TimeSlotSelectorProps) {
  // Split slots into morning (before 13:00) and afternoon (13:00+)
  const morningSlots = slots.filter((s) => {
    const hour = parseInt(s.split(":")[0], 10);
    return hour < 13;
  });

  const afternoonSlots = slots.filter((s) => {
    const hour = parseInt(s.split(":")[0], 10);
    return hour >= 13;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#1D1D1F]">
            Selecciona un horario
          </h3>
          <p className="text-sm text-[#6E6E73] flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>{dateLabel}</span>
          </p>
        </div>

        {onBackDate && (
          <button
            type="button"
            onClick={onBackDate}
            className="text-xs font-semibold text-[#007AFF] hover:underline px-2.5 py-1 rounded-lg bg-[#007AFF]/8"
          >
            Cambiar fecha
          </button>
        )}
      </div>

      {isLoading && (
        <div className="py-16 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#86868B] font-medium">Consultando horarios disponibles...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-4 rounded-2xl bg-[#FF3B30]/8 border border-[#FF3B30]/15 flex items-center gap-3 text-sm text-[#FF3B30]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && slots.length === 0 && (
        <div className="py-12 px-4 rounded-2xl bg-black/[0.02] border border-dashed border-black/[0.08] text-center space-y-2">
          <Clock className="w-8 h-8 text-[#86868B] mx-auto opacity-50" />
          <p className="text-sm font-semibold text-[#1D1D1F]">No hay horarios disponibles para este día</p>
          <p className="text-xs text-[#86868B] max-w-xs mx-auto">
            Por favor elige otra fecha en el calendario o consulta otro especialista.
          </p>
          {onBackDate && (
            <button
              type="button"
              onClick={onBackDate}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold"
            >
              Ver otras fechas
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && slots.length > 0 && (
        <div className="space-y-6 pt-1">
          {morningSlots.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Mañana
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {morningSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onSelectTime(slot)}
                      className={`py-3 px-2 rounded-xl text-center font-mono text-sm font-semibold transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? "bg-[#007AFF] text-white shadow-md shadow-blue-500/20 ring-2 ring-[#007AFF]"
                          : "bg-white border border-black/[0.08] hover:border-black/[0.2] text-[#1D1D1F] hover:bg-black/[0.02]"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {afternoonSlots.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Tarde
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {afternoonSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onSelectTime(slot)}
                      className={`py-3 px-2 rounded-xl text-center font-mono text-sm font-semibold transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? "bg-[#007AFF] text-white shadow-md shadow-blue-500/20 ring-2 ring-[#007AFF]"
                          : "bg-white border border-black/[0.08] hover:border-black/[0.2] text-[#1D1D1F] hover:bg-black/[0.02]"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
