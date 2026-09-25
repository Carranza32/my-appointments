"use client";

import React from "react";
import { User, Check, Sparkles } from "lucide-react";
import type { AdaptiveStaffItem } from "@/lib/booking/adaptive-engine";

interface StaffSelectorProps {
  staff: AdaptiveStaffItem[];
  selectedStaffId: string | null;
  onSelectStaff: (member: AdaptiveStaffItem | null) => void;
  title?: string;
  allowAnyStaff?: boolean;
}

export function StaffSelector({
  staff,
  selectedStaffId,
  onSelectStaff,
  title = "¿Con quién deseas atenderte?",
  allowAnyStaff = true,
}: StaffSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#1D1D1F]">
          {title}
        </h3>
        <p className="text-sm text-[#6E6E73]">
          Selecciona a tu profesional de confianza o elige al primero disponible.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2">
        {/* Opción de Cualquier Profesional Disponible */}
        {allowAnyStaff && (
          <button
            type="button"
            onClick={() => onSelectStaff(null)}
            className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 ease-out select-none active:scale-[0.98] ${
              selectedStaffId === null
                ? "bg-white ring-2 ring-[#007AFF] shadow-[0_4px_20px_rgba(0,122,255,0.12)] border-transparent"
                : "bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedStaffId === null ? "bg-[#007AFF] text-white" : "bg-[#007AFF]/10 text-[#007AFF]"
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <h4
                    className={`text-base font-semibold tracking-[-0.01em] transition-colors ${
                      selectedStaffId === null ? "text-[#007AFF]" : "text-[#1D1D1F]"
                    }`}
                  >
                    Cualquier especialista disponible
                  </h4>
                  <p className="mt-0.5 text-xs text-[#6E6E73]">
                    Mayor disponibilidad de horarios y fechas
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                  selectedStaffId === null
                    ? "bg-[#007AFF] text-white scale-100 ring-2 ring-white"
                    : "border border-black/[0.2] bg-white/50 scale-90"
                }`}
              >
                {selectedStaffId === null && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </button>
        )}

        {/* Lista de Especialistas */}
        {staff.map((member) => {
          const isSelected = selectedStaffId === member.id;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectStaff(member)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 ease-out select-none active:scale-[0.98] ${
                isSelected
                  ? "bg-white ring-2 ring-[#007AFF] shadow-[0_4px_20px_rgba(0,122,255,0.12)] border-transparent"
                : "bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-1 ring-black/[0.08]"
                    />
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-colors ${
                        isSelected ? "bg-[#007AFF] text-white" : "bg-[#007AFF]/10 text-[#007AFF]"
                      }`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4
                      className={`text-base font-semibold tracking-[-0.01em] transition-colors ${
                        isSelected ? "text-[#007AFF]" : "text-[#1D1D1F]"
                      }`}
                    >
                      {member.name}
                    </h4>

                    {member.description && (
                      <p className="mt-0.5 text-xs text-[#6E6E73] truncate">
                        {member.description}
                      </p>
                    )}
                  </div>
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
