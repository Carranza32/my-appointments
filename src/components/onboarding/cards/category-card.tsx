"use client";

import React from "react";
import { Check } from "lucide-react";

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
  badge?: string;
}

export function CategoryCard({
  id,
  name,
  description,
  icon,
  isSelected,
  onClick,
  badge,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      id={`cat-${id}`}
      onClick={onClick}
      className={`group relative text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 ease-out select-none active:scale-[0.98] ${
        isSelected
          ? "bg-white ring-2 ring-[#007AFF] shadow-[0_4px_24px_rgba(0,122,255,0.15)] border-transparent"
          : "bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/[0.15] shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-3xl sm:text-4xl p-1 select-none">{icon}</div>

        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
            isSelected
              ? "bg-[#007AFF] text-white scale-100 ring-2 ring-white"
              : "border border-black/[0.2] bg-white/50 scale-90"
          }`}
        >
          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className={`text-base font-semibold tracking-[-0.01em] transition-colors ${
              isSelected ? "text-[#007AFF]" : "text-[#1D1D1F]"
            }`}
          >
            {name}
          </h3>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF] uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[#6E6E73] line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
}
