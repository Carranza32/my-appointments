"use client";

import React from "react";
import {
  Sparkles,
  Globe,
  Users,
  Building,
  Layers,
  CreditCard,
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import type { OnboardingAnswers, BusinessCapabilities, PresetRecommendation } from "@/lib/onboarding/types";

interface StepSummaryProps {
  answers: OnboardingAnswers;
  capabilities: BusinessCapabilities;
  preset?: PresetRecommendation;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function StepSummary({
  answers,
  capabilities,
  preset,
  isSubmitting,
  onSubmit,
}: StepSummaryProps) {
  const activeDaysCount = answers.weeklyHours.filter((h) => h.slots.length > 0).length;
  const staffTerm = preset?.defaultTerminology?.staff || "Especialista";
  const serviceTerm = preset?.defaultTerminology?.service || "Servicios";

  return (
    <div className="space-y-6">
      {/* Hero Badge Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#007AFF]/10 via-[#5856D6]/10 to-[#007AFF]/10 border border-[#007AFF]/20 text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#007AFF] text-white shadow-md mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
          ¡Tu negocio está listo para configurarse!
        </h3>
        <p className="text-xs sm:text-sm text-[#6E6E73] max-w-md mx-auto">
          Hemos generado la arquitectura ideal para{" "}
          <strong className="text-[#1D1D1F]">{answers.businessName}</strong>. Revisa el resumen a continuación.
        </p>
      </div>

      {/* Main Breakdown Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-6">
        {/* Header row: Name & Slug */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
              Negocio / Marca
            </span>
            <h4 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              {answers.businessName}
            </h4>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007AFF]/8 text-[#007AFF] font-mono text-xs font-semibold">
            <Globe className="w-3.5 h-3.5" />
            <span>my-appointment.com/{answers.slug}</span>
          </div>
        </div>

        {/* Enabled Capabilities Badges Grid */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
            Módulos y Capacidades Habilitadas
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
              <Calendar className="w-4 h-4 text-[#007AFF]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1D1D1F] truncate">
                  {serviceTerm.includes("/") ? serviceTerm.split("/")[0].trim() : serviceTerm}
                </p>
                <p className="text-[10px] text-[#86868B]">{answers.servicesList.length} registrados</p>
              </div>
            </div>

            {capabilities.staff ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                <Users className="w-4 h-4 text-[#5856D6]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1D1D1F] truncate">Equipo</p>
                  <p className="text-[10px] text-[#86868B]">
                    {answers.staffList.length} {staffTerm.toLowerCase()}{answers.staffList.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                <Users className="w-4 h-4 text-[#34C759]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1D1D1F] truncate">{staffTerm}</p>
                  <p className="text-[10px] text-[#86868B]">Atención directa</p>
                </div>
              </div>
            )}

            {capabilities.locations && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                <Building className="w-4 h-4 text-[#FF9500]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1D1D1F] truncate">Sedes Físicas</p>
                  <p className="text-[10px] text-[#86868B]">
                    {answers.locationsList.length > 0 ? `${answers.locationsList.length} sedes` : "1 sede"}
                  </p>
                </div>
              </div>
            )}

            {!capabilities.locations && capabilities.serviceModality.online && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                <Globe className="w-4 h-4 text-[#007AFF]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1D1D1F] truncate">Modalidad</p>
                  <p className="text-[10px] text-[#86868B]">100% Online</p>
                </div>
              </div>
            )}

            {capabilities.serviceModality.presencial && capabilities.serviceModality.online && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                <Globe className="w-4 h-4 text-[#34C759]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1D1D1F] truncate">Modalidad</p>
                  <p className="text-[10px] text-[#86868B]">Presencial + Online</p>
                </div>
              </div>
            )}

            {capabilities.resources && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                <Layers className="w-4 h-4 text-[#FF2D55]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1D1D1F] truncate">Recursos / Salas</p>
                  <p className="text-[10px] text-[#86868B]">{answers.resourcesList.length} recursos</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
              <CreditCard className="w-4 h-4 text-[#5856D6]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1D1D1F] truncate">Cobros</p>
                <p className="text-[10px] text-[#86868B]">
                  {capabilities.paymentMode === "UPFRONT" && "Anticipo online"}
                  {capabilities.paymentMode === "LATER" && "En persona / Al finalizar"}
                  {capabilities.paymentMode === "BOTH" && "Online y Presencial"}
                  {capabilities.paymentMode === "NONE" && "Sin cobro"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
              <Clock className="w-4 h-4 text-[#34C759]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1D1D1F] truncate">Horario</p>
                <p className="text-[10px] text-[#86868B]">{activeDaysCount} días a la semana</p>
              </div>
            </div>

            {capabilities.clinicalRecords && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#007AFF]/5 border border-[#007AFF]/15">
                <FileText className="w-4 h-4 text-[#007AFF]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#007AFF] truncate">Expedientes Clínicos</p>
                  <p className="text-[10px] text-[#86868B]">SOAP con IA activo</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Services & Pricing Snapshot */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
            {`Catálogo de ${serviceTerm} Inicial`}
          </span>
          <div className="divide-y divide-black/[0.04] bg-black/[0.02] rounded-xl px-3 py-1">
            {answers.servicesList.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-xs">
                <span className="font-medium text-[#1D1D1F]">{s.name}</span>
                <span className="text-[#6E6E73]">
                  {s.duration} min • ${s.price} {s.currency || "USD"}
                </span>
              </div>
            ))}
            {answers.servicesList.length > 4 && (
              <div className="py-2 text-[11px] text-[#86868B] text-center">
                + {answers.servicesList.length - 4} servicios adicionales
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Launch Confirmation Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white font-semibold text-base shadow-[0_4px_20px_rgba(0,122,255,0.25)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Configurando tu espacio...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Finalizar y Lanzar My Appointment</span>
            </>
          )}
        </button>
        <p className="text-center text-xs text-[#86868B] mt-2">
          Podrás modificar cualquiera de estas opciones más adelante en la sección de Ajustes.
        </p>
      </div>
    </div>
  );
}
