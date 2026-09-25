"use client";

import React from "react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

interface StepHeaderProps {
  currentStepIndex: number;
  totalSteps: number;
  title: string;
  description?: string;
  onBack?: () => void;
  canGoBack?: boolean;
  categoryBadge?: string;
}

export function StepHeader({
  currentStepIndex,
  totalSteps,
  title,
  description,
  onBack,
  canGoBack = true,
  categoryBadge,
}: StepHeaderProps) {
  const progressPercent = Math.round(((currentStepIndex + 1) / Math.max(totalSteps, 1)) * 100);

  return (
    <div className="w-full space-y-4 mb-8">
      {/* Top Bar with Back Button, Step Indicator & Progress */}
      <div className="flex items-center justify-between text-xs font-medium text-[#86868B]">
        <div className="flex items-center gap-2">
          {canGoBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
              aria-label="Volver al paso anterior"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Atrás</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-semibold text-[11px] tracking-wide uppercase">
              <Sparkles className="w-3 h-3" />
              <span>Smart Setup</span>
            </div>
          )}

          {categoryBadge && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-black/[0.03] text-[#515154] text-[11px] font-normal border border-black/[0.04]">
              {categoryBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="tabular-nums font-semibold text-[#1D1D1F]">
            Paso {currentStepIndex + 1}
          </span>
          <span className="text-[#A1A1A6]">de {totalSteps}</span>
          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-black/[0.03] text-[#86868B] tabular-nums font-medium">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Progress Bar with Apple Fluid Transition */}
      <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#007AFF] to-[#5856D6] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Title & Description with Apple optical typography */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-[#1D1D1F] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm sm:text-base text-[#6E6E73] leading-relaxed font-normal">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
