"use client";

import React from "react";
import { MapPin, Phone, Building, Check } from "lucide-react";
import type { AdaptiveLocationItem } from "@/lib/booking/adaptive-engine";

interface LocationSelectorProps {
  locations: AdaptiveLocationItem[];
  selectedLocationId: string | null;
  onSelectLocation: (location: AdaptiveLocationItem) => void;
  title?: string;
}

export function LocationSelector({
  locations,
  selectedLocationId,
  onSelectLocation,
  title = "¿En qué sucursal deseas atenderte?",
}: LocationSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#1D1D1F]">
          {title}
        </h3>
        <p className="text-sm text-[#6E6E73]">
          Elige la ubicación más conveniente para tu cita.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2">
        {locations.map((loc) => {
          const isSelected = selectedLocationId === loc.id;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelectLocation(loc)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 ease-out select-none active:scale-[0.98] ${
                isSelected
                  ? "bg-white ring-2 ring-[#007AFF] shadow-[0_4px_20px_rgba(0,122,255,0.12)] border-transparent"
                  : "bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? "bg-[#007AFF] text-white" : "bg-black/[0.04] text-[#1D1D1F]"
                    }`}
                  >
                    <Building className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h4
                      className={`text-base font-semibold tracking-[-0.01em] transition-colors ${
                        isSelected ? "text-[#007AFF]" : "text-[#1D1D1F]"
                      }`}
                    >
                      {loc.name}
                    </h4>

                    {loc.address && (
                      <p className="mt-1 text-xs sm:text-sm text-[#6E6E73] flex items-center gap-1.5 leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#86868B]" />
                        <span>{loc.address}</span>
                      </p>
                    )}

                    {loc.phone && (
                      <p className="mt-1 text-xs text-[#86868B] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{loc.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-1 ${
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
