"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { StepHeader } from "@/components/onboarding/step-header";
import { StepIdentity } from "@/components/onboarding/steps/step-identity";
import { StepCategory } from "@/components/onboarding/steps/step-category";
import { StepWorkflow } from "@/components/onboarding/steps/step-workflow";
import { StepTeam } from "@/components/onboarding/steps/step-team";
import { StepLocation } from "@/components/onboarding/steps/step-location";
import { StepResources } from "@/components/onboarding/steps/step-resources";
import { StepServices } from "@/components/onboarding/steps/step-services";
import { StepSchedule } from "@/components/onboarding/steps/step-schedule";
import { StepPayments } from "@/components/onboarding/steps/step-payments";
import { StepQuestions } from "@/components/onboarding/steps/step-questions";
import { StepSummary } from "@/components/onboarding/steps/step-summary";

import {
  STEPS_CONFIG,
  getVisibleSteps,
  canAdvance,
  calculateProgress,
} from "@/lib/onboarding/question-engine";
import {
  createInitialOnboardingAnswers,
  resolveBusinessCapabilities,
} from "@/lib/onboarding/capability-resolver";
import { getPresetById } from "@/lib/onboarding/presets";
import type {
  OnboardingAnswers,
  OnboardingDraft,
  PresetRecommendation,
} from "@/lib/onboarding/types";
import {
  saveOnboardingDraft,
  provisionBusinessConfiguration,
} from "@/actions/smart-onboarding";

const DRAFT_STORAGE_KEY = "my_appointment_onboarding_draft_v2";

interface SmartWizardProps {
  userEmail: string;
  initialName?: string;
  initialSlug?: string;
}

export function SmartWizard({
  userEmail,
  initialName = "",
  initialSlug = "",
}: SmartWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core wizard state
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => {
    const initial = createInitialOnboardingAnswers();
    if (initialName) initial.businessName = initialName;
    if (initialSlug) initial.slug = initialSlug;
    return initial;
  });

  const [currentStepId, setCurrentStepId] = useState<string>("identity");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore local draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: OnboardingDraft = JSON.parse(saved);
        if (parsed.answers) {
          setAnswers((prev) => ({
            ...prev,
            ...parsed.answers,
            // Keep business name and slug if already provided
            businessName: parsed.answers.businessName || prev.businessName,
            slug: parsed.answers.slug || prev.slug,
          }));
          if (parsed.currentStepId) {
            setCurrentStepId(parsed.currentStepId);
          }
          if (parsed.completedStepIds) {
            setCompletedSteps(parsed.completedStepIds);
          }
        }
      }
    } catch {
      // Ignore parse error and proceed with defaults
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Compute dynamic visible steps based on current answers
  const visibleSteps = getVisibleSteps(answers);
  const currentStepIndex = Math.max(
    0,
    visibleSteps.findIndex((s) => s.id === currentStepId)
  );
  const currentStepConfig = visibleSteps[currentStepIndex] || visibleSteps[0];

  // Derive active preset and capabilities
  const currentPreset = answers.subCategory
    ? getPresetById(answers.subCategory)
    : answers.category
    ? getPresetById(answers.category)
    : undefined;
  const capabilities = resolveBusinessCapabilities(answers, currentPreset);

  // Keep currentStepId in sync with visibleSteps when branching conditions change
  useEffect(() => {
    if (!isLoaded || visibleSteps.length === 0) return;
    const isStepValid = visibleSteps.some((s) => s.id === currentStepId);
    if (!isStepValid) {
      setCurrentStepId(visibleSteps[0].id);
    }
  }, [visibleSteps, currentStepId, isLoaded]);

  // Auto-save draft on state change
  useEffect(() => {
    if (!isLoaded) return;
    const draft: OnboardingDraft = {
      userId: "",
      currentStepId,
      completedStepIds: completedSteps,
      answers,
      inferredCapabilities: capabilities,
      lastUpdated: new Date().toISOString(),
      isFinished: false,
    };

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {}

    // Async debounced server sync
    const timer = setTimeout(() => {
      saveOnboardingDraft(draft).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [answers, currentStepId, completedSteps, isLoaded, capabilities]);

  // Navigation handlers
  const handleNext = () => {
    setErrorMessage(null);
    if (!canAdvance(currentStepId, answers)) {
      if (currentStepId === "identity") {
        setErrorMessage("Por favor ingresa un nombre y slug válido para continuar.");
      } else if (currentStepId === "category") {
        setErrorMessage("Por favor selecciona una categoría para tu negocio.");
      } else if (currentStepId === "services") {
        setErrorMessage("Por favor agrega al menos un servicio.");
      } else {
        setErrorMessage("Por favor completa los campos requeridos.");
      }
      return;
    }

    if (!completedSteps.includes(currentStepId)) {
      setCompletedSteps([...completedSteps, currentStepId]);
    }

    if (currentStepIndex < visibleSteps.length - 1) {
      const nextStep = visibleSteps[currentStepIndex + 1];
      setCurrentStepId(nextStep.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStepIndex > 0) {
      const prevStep = visibleSteps[currentStepIndex - 1];
      setCurrentStepId(prevStep.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step specific state mutators
  const handleSelectCategory = (category: string) => {
    setAnswers((prev) => ({
      ...prev,
      category,
      subCategory: undefined,
    }));
  };

  const handleSelectSubCategory = (
    subCategory: string,
    preset: PresetRecommendation
  ) => {
    setAnswers((prev) => {
      const isSameSubCategory = prev.subCategory === subCategory;
      // Preserve existing edited services if user re-selects the same subcategory
      const servicesList =
        isSameSubCategory && prev.servicesList.length > 0
          ? prev.servicesList
          : preset.suggestedServices.map((s, idx) => ({
              id: `draft-srv-${idx}`,
              name: s.name,
              duration: s.duration,
              bufferTime: s.bufferTime,
              price: s.price,
              currency: "USD",
              description: s.description,
            }));

      // Preserve existing custom fields if user re-selects the same subcategory
      const clientFields =
        isSameSubCategory && prev.clientFields.length > 0
          ? prev.clientFields
          : [
              { name: "name", label: "Nombre Completo", type: "text" as const, required: true },
              { name: "email", label: "Correo Electrónico", type: "email" as const, required: true },
              { name: "phone", label: "Teléfono / WhatsApp", type: "tel" as const, required: true },
              ...(preset.suggestedQuestions || []),
            ];

      return {
        ...prev,
        category: preset.category,
        subCategory,
        bookingItemType: preset.suggestedBookingItemType,
        servicesList,
        clientFields,
        enableClinicalModule: Boolean(preset.recommendedCapabilities.clinicalRecords),
      };
    });
  };

  // Final Provisioning Submit
  const handleFinalSubmit = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const draft: OnboardingDraft = {
        userId: "",
        currentStepId: "summary",
        completedStepIds: visibleSteps.map((s) => s.id),
        answers,
        inferredCapabilities: capabilities,
        lastUpdated: new Date().toISOString(),
        isFinished: true,
      };

      const result = await provisionBusinessConfiguration(draft);

      if (!result.success) {
        setErrorMessage(result.error || "Ocurrió un error al configurar tu negocio.");
        return;
      }

      // Clear local draft upon successful launch
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}

      // Smooth transition to dashboard
      router.push(result.redirectUrl || "/dashboard");
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Apple Frosted Glass Card Container */}
      <div className="relative rounded-3xl bg-white/90 backdrop-blur-2xl border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6 sm:p-10 transition-all">
        {/* Step Header */}
        <StepHeader
          currentStepIndex={currentStepIndex}
          totalSteps={visibleSteps.length}
          title={currentStepConfig?.title || "Configuración"}
          description={currentStepConfig?.description}
          onBack={handleBack}
          canGoBack={currentStepIndex > 0}
          categoryBadge={currentPreset?.title}
        />

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center gap-3 text-sm text-[#FF3B30] animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Step Content Switcher */}
        <div className="min-h-[300px]">
          {currentStepId === "identity" && (
            <StepIdentity
              businessName={answers.businessName}
              slug={answers.slug}
              userEmail={userEmail}
              onChangeName={(name) =>
                setAnswers((prev) => ({ ...prev, businessName: name }))
              }
              onChangeSlug={(slug) =>
                setAnswers((prev) => ({ ...prev, slug }))
              }
            />
          )}

          {currentStepId === "category" && (
            <StepCategory
              selectedCategory={answers.category}
              selectedSubCategory={answers.subCategory}
              onSelectCategory={handleSelectCategory}
              onSelectSubCategory={handleSelectSubCategory}
            />
          )}

          {currentStepId === "workflow" && (
            <StepWorkflow
              answers={answers}
              preset={currentPreset}
              onChangeTeamStructure={(val) =>
                setAnswers((prev) => ({ ...prev, teamStructure: val }))
              }
              onChangeLocationType={(val) =>
                setAnswers((prev) => ({ ...prev, locationType: val }))
              }
              onChangeModality={(val) =>
                setAnswers((prev) => ({ ...prev, modality: val }))
              }
              onChangeUsesResources={(val) =>
                setAnswers((prev) => ({ ...prev, usesPhysicalResources: val }))
              }
            />
          )}

          {currentStepId === "team" && (
            <StepTeam
              staffList={answers.staffList}
              preset={currentPreset}
              onChangeStaffList={(list) =>
                setAnswers((prev) => ({ ...prev, staffList: list }))
              }
            />
          )}

          {currentStepId === "location" && (
            <StepLocation
              locationType={answers.locationType}
              locationsList={answers.locationsList}
              preset={currentPreset}
              onChangeLocationsList={(list) =>
                setAnswers((prev) => ({ ...prev, locationsList: list }))
              }
            />
          )}

          {currentStepId === "resources" && (
            <StepResources
              resourcesList={answers.resourcesList}
              locationsList={answers.locationsList}
              onChangeResourcesList={(list) =>
                setAnswers((prev) => ({ ...prev, resourcesList: list }))
              }
            />
          )}

          {currentStepId === "services" && (
            <StepServices
              servicesList={answers.servicesList}
              preset={currentPreset}
              onChangeServicesList={(list) =>
                setAnswers((prev) => ({ ...prev, servicesList: list }))
              }
            />
          )}

          {currentStepId === "schedule" && (
            <StepSchedule
              weeklyHours={answers.weeklyHours}
              onChangeWeeklyHours={(hours) =>
                setAnswers((prev) => ({ ...prev, weeklyHours: hours }))
              }
            />
          )}

          {currentStepId === "payments" && (
            <StepPayments
              paymentPreference={answers.paymentPreference}
              onChangePaymentPreference={(val) =>
                setAnswers((prev) => ({ ...prev, paymentPreference: val }))
              }
            />
          )}

          {currentStepId === "questions" && (
            <StepQuestions
              clientFields={answers.clientFields}
              preset={currentPreset}
              onChangeClientFields={(fields) =>
                setAnswers((prev) => ({ ...prev, clientFields: fields }))
              }
            />
          )}

          {currentStepId === "summary" && (
            <StepSummary
              answers={answers}
              capabilities={capabilities}
              preset={currentPreset}
              isSubmitting={isPending}
              onSubmit={handleFinalSubmit}
            />
          )}
        </div>

        {/* Step Navigation Bar (except on summary where submit button is embedded) */}
        {currentStepId !== "summary" && (
          <div className="mt-8 pt-6 border-t border-black/[0.06] flex items-center justify-between gap-4">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3 rounded-2xl bg-black/[0.04] hover:bg-black/[0.08] text-sm font-semibold text-[#1D1D1F] transition-all active:scale-95"
              >
                Atrás
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-sm font-semibold shadow-[0_4px_16px_rgba(0,122,255,0.25)] transition-all active:scale-95"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
