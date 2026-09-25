"use client";

import React from "react";
import { MapPin, Video, Check } from "lucide-react";

interface ModalitySelectorProps {
  selectedModality: "presencial" | "online" | null;
  onSelectModality: (modality: "presencial" | "online") => void;
  locationName?: string;
}

export function ModalitySelector({
  selectedModality,
  onSelectModality,
  locationName,
}: ModalitySelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#1D1D1F]">
          ¿Cómo prefieres tomar tu cita?
        </h3>
        <p className="text-sm text-[#6E6E73]">
          Elige entre asistir en persona o realizar tu sesión a través de videollamada.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {/* Presencial */}
        <button
          type="button"
          onClick={() => onSelectModality("presencial")}
          className={`w-full text-left p-5 rounded-2xl transition-all duration-200 ease-out select-none active:scale-[0.98] ${
            selectedModality === "presencial"
              ? "bg-white ring-2 ring-[#007AFF] shadow-[0_4px_20px_rgba(0,122,255,0.12)] border-transparent"
              : "bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>

            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                selectedModality === "presencial"
                  ? "bg-[#007AFF] text-white scale-100 ring-2 ring-white"
                  : "border border-black/[0.2] bg-white/50 scale-90"
              }`}
            >
              {selectedModality === "presencial" && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>

          <div className="mt-4">
            <h4
              className={`text-base font-semibold tracking-[-0.01em] ${
                selectedModality === "presencial" ? "text-[#007AFF]" : "text-[#1D1D1F]"
              }`}
            >
              Presencial
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
              {locationName ? `En ${locationName}` : "Asistencia directa en las instalaciones"}
            </p>
          </div>
        </button>

        {/* Online */}
        <button
          type="button"
          onClick={() => onSelectModality("online")}
          className={`w-full text-left p-5 rounded-2xl transition-all duration-200 ease-out select-none active:scale-[0.98] ${
            selectedModality === "online"
              ? "bg-white ring-2 ring-[#007AFF] shadow-[0_4px_20px_rgba(0,122,255,0.12)] border-transparent"
              : "bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5856D6]/10 text-[#5856D6] flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>

            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                selectedModality === "online"
                  ? "bg-[#007AFF] text-white scale-100 ring-2 ring-white"
                  : "border border-black/[0.2] bg-white/50 scale-90"
              }`}
            >
              {selectedModality === "online" && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>

          <div className="mt-4">
            <h4
              className={`text-base font-semibold tracking-[-0.01em] ${
                selectedModality === "online" ? "text-[#007AFF]" : "text-[#1D1D1F]"
              }`}
            >
              Videollamada / Online
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
              Recibirás el enlace de Google Meet o Zoom por correo
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
