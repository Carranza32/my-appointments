"use client";

import React from "react";
import { Layers, MapPin, Check } from "lucide-react";
import type { AdaptiveResourceItem } from "@/lib/booking/adaptive-engine";

interface ResourceSelectorProps {
  resources: AdaptiveResourceItem[];
  selectedResourceId: string | null;
  onSelectResource: (resource: AdaptiveResourceItem) => void;
  title?: string;
  badgeLabel?: string;
  isSpaceFirst?: boolean;
}

export function ResourceSelector({
  resources,
  selectedResourceId,
  onSelectResource,
  title = "Elige tu cancha o espacio",
  badgeLabel = "Espacio",
  isSpaceFirst = false,
}: ResourceSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#1D1D1F]">
          {title}
        </h3>
        <p className="text-sm text-[#6E6E73]">
          {isSpaceFirst
            ? "Selecciona la cancha o instalación que deseas reservar."
            : "Selecciona el espacio o cabina asignada a tu sesión."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {resources.map((res) => {
          const isSelected = selectedResourceId === res.id;
          return (
            <button
              key={res.id}
              type="button"
              onClick={() => onSelectResource(res)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 ease-out select-none active:scale-[0.98] ${
                isSelected
                  ? "bg-white ring-2 ring-[#007AFF] shadow-[0_4px_20px_rgba(0,122,255,0.12)] border-transparent"
                  : "bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? "bg-[#007AFF] text-white" : "bg-[#FF9500]/10 text-[#FF9500]"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    isSelected
                      ? "bg-[#007AFF] text-white scale-100 ring-2 ring-white"
                      : "border border-black/[0.2] bg-white/50 scale-90"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <div className="mt-3">
                <h4
                  className={`text-base font-semibold tracking-[-0.01em] transition-colors ${
                    isSelected ? "text-[#007AFF]" : "text-[#1D1D1F]"
                  }`}
                >
                  {res.name}
                </h4>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] text-[#86868B] uppercase tracking-wider">
                    {res.type || badgeLabel}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
