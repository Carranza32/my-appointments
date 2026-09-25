"use client";

import React from "react";
import { Clock, Sparkles, Check } from "lucide-react";
import type { AdaptiveServiceItem } from "@/lib/booking/adaptive-engine";

interface ServiceSelectorProps {
  services: AdaptiveServiceItem[];
  selectedServiceId: string | null;
  onSelectService: (service: AdaptiveServiceItem) => void;
  currency?: string;
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelectService,
  currency = "USD",
}: ServiceSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#1D1D1F]">
          ¿Qué servicio deseas reservar?
        </h3>
        <p className="text-sm text-[#6E6E73]">
          Selecciona una opción para ver los horarios y especialistas disponibles.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2">
        {services.map((s) => {
          const isSelected = selectedServiceId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectService(s)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 ease-out select-none active:scale-[0.98] ${
                isSelected
                  ? "bg-white ring-2 ring-[#007AFF] shadow-[0_4px_20px_rgba(0,122,255,0.12)] border-transparent"
                  : "bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`text-base font-semibold tracking-[-0.01em] transition-colors ${
                        isSelected ? "text-[#007AFF]" : "text-[#1D1D1F]"
                      }`}
                    >
                      {s.name}
                    </h4>
                    {s.bufferTime > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/[0.04] text-[#86868B]">
                        +{s.bufferTime}m buffer
                      </span>
                    )}
                  </div>

                  {s.description && (
                    <p className="mt-1 text-xs sm:text-sm text-[#6E6E73] leading-relaxed line-clamp-2">
                      {s.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-[#86868B]">
                    <span className="flex items-center gap-1 font-medium text-[#1D1D1F]">
                      <Clock className="w-3.5 h-3.5 text-[#007AFF]" />
                      {s.duration} minutos
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-[#1D1D1F]">
                      ${s.price} {s.currency || currency}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 ${
                    isSelected
                      ? "bg-[#007AFF] text-white scale-100 ring-2 ring-white"
                      : "border border-black/[0.2] bg-white/50 scale-90"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
