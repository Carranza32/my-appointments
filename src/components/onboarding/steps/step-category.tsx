"use client";

import React from "react";
import { Sparkles, Check } from "lucide-react";
import { CategoryCard } from "@/components/onboarding/cards/category-card";
import { CATEGORIES_LIST, ALL_PRESETS_FLAT, getPresetById } from "@/lib/onboarding/presets";
import type { PresetRecommendation } from "@/lib/onboarding/types";

interface StepCategoryProps {
  selectedCategory: string;
  selectedSubCategory?: string;
  onSelectCategory: (category: string) => void;
  onSelectSubCategory: (subCategory: string, preset: PresetRecommendation) => void;
}

export function StepCategory({
  selectedCategory,
  selectedSubCategory,
  onSelectCategory,
  onSelectSubCategory,
}: StepCategoryProps) {
  // Get available subcategories for selected category
  const availablePresets = selectedCategory
    ? ALL_PRESETS_FLAT.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase())
    : [];

  const currentPreset = selectedSubCategory ? getPresetById(selectedSubCategory) : null;

  return (
    <div className="space-y-6">
      {/* 1. Main Category Grid */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold tracking-[-0.01em] text-[#1D1D1F]">
          1. ¿Cuál es la categoría principal de tu negocio?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES_LIST.map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              description={cat.description}
              icon={cat.icon}
              isSelected={selectedCategory === cat.id}
              onClick={() => onSelectCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* 2. Subcategory / Especialidad Selection */}
      {selectedCategory && availablePresets.length > 0 && (
        <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-sm font-semibold tracking-[-0.01em] text-[#1D1D1F]">
            2. Selecciona tu especialidad exacta para configurar sugerencias
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availablePresets.map((p) => {
              const isSelected = selectedSubCategory === p.subCategory;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectSubCategory(p.subCategory, p)}
                  className={`flex items-center justify-between p-3.5 rounded-xl text-left text-sm transition-all duration-150 active:scale-[0.98] ${
                    isSelected
                      ? "bg-[#007AFF] text-white font-semibold shadow-md ring-2 ring-[#007AFF]/30"
                      : "bg-white/90 hover:bg-white text-[#1D1D1F] border border-black/[0.08] hover:border-black/[0.15]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-xl">{p.icon}</span>
                    <span className="truncate">{p.title}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Preset Recommendation Banner */}
      {currentPreset && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#007AFF]/[0.06] border border-[#007AFF]/15 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-[#007AFF] font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Configuración recomendada para {currentPreset.title}</span>
          </div>

          <div className="text-xs text-[#515154] leading-relaxed space-y-1.5">
            <p>
              • <strong>Servicios sugeridos:</strong>{" "}
              {currentPreset.suggestedServices.map((s) => s.name).join(", ")}.
            </p>
            <p>
              • <strong>Terminología:</strong> &quot;{currentPreset.defaultTerminology.service}&quot; y &quot;{currentPreset.defaultTerminology.appointment}&quot;.
            </p>
            {currentPreset.recommendedCapabilities.clinicalRecords && (
              <p>
                • <strong>Módulo de Expediente Clínico:</strong> Habilitado automáticamente.
              </p>
            )}
          </div>
          <p className="text-[11px] text-[#86868B] italic">
            Podrás personalizar y ajustar todos los servicios y horarios en los siguientes pasos.
          </p>
        </div>
      )}
    </div>
  );
}
