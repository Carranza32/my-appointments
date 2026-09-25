"use client";

import React from "react";
import { Check } from "lucide-react";

interface ChoiceCardProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function ChoiceCard({
  id,
  title,
  description,
  icon,
  badge,
  isSelected,
  onClick,
  disabled = false,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 ease-out select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"
      } ${
        isSelected
          ? "bg-white ring-2 ring-[#007AFF] shadow-[0_4px_20px_rgba(0,122,255,0.12)] border-transparent"
          : "bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Optional Icon */}
        {icon && (
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
              isSelected
                ? "bg-[#007AFF] text-white"
                : "bg-black/[0.04] text-[#1D1D1F] group-hover:bg-black/[0.06]"
            }`}
          >
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-base font-semibold tracking-[-0.01em] transition-colors ${
                isSelected ? "text-[#007AFF]" : "text-[#1D1D1F]"
              }`}
            >
              {title}
            </h3>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#007AFF]/10 text-[#007AFF]">
                {badge}
              </span>
            )}
          </div>

          {description && (
            <p className="mt-1 text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Selection Indicator */}
        <div
          className={`absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
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
}
