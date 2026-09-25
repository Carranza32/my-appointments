"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckSquare, Sparkles } from "lucide-react";
import type { OnboardingFormFieldDraft, PresetRecommendation } from "@/lib/onboarding/types";

interface StepQuestionsProps {
  clientFields: OnboardingFormFieldDraft[];
  preset?: PresetRecommendation;
  onChangeClientFields: (fields: OnboardingFormFieldDraft[]) => void;
}

export function StepQuestions({
  clientFields,
  preset,
  onChangeClientFields,
}: StepQuestionsProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"text" | "tel" | "email" | "textarea">("text");
  const [newRequired, setNewRequired] = useState(false);

  const clientLabel = preset?.defaultTerminology?.client?.toLowerCase() || "cliente";
  const appointmentLabel = preset?.defaultTerminology?.appointment?.toLowerCase() || "cita";

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const name = newLabel
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_");

    const newField: OnboardingFormFieldDraft = {
      name: `${name}_${Date.now()}`,
      label: newLabel.trim(),
      type: newType,
      required: newRequired,
    };

    onChangeClientFields([...clientFields, newField]);
    setNewLabel("");
    setNewRequired(false);
  };

  const handleRemoveField = (index: number) => {
    // Keep first 3 default fields safe if desired, or allow full customization
    onChangeClientFields(clientFields.filter((_, i) => i !== index));
  };

  const handleToggleRequired = (index: number) => {
    const updated = clientFields.map((f, i) =>
      i === index ? { ...f, required: !f.required } : f
    );
    onChangeClientFields(updated);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-[#6E6E73]">
          {`Selecciona qué información necesitas solicitar a tus ${clientLabel}s antes de confirmar su ${appointmentLabel}.`}
        </p>
      </div>

      {/* Questions list */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-[#86868B] px-1">
          {`Campos del formulario de ${appointmentLabel} (${clientFields.length})`}
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {clientFields.map((field, index) => {
            const isBaseField = index < 3; // Name, Email, Phone
            return (
              <div
                key={field.name || index}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white border border-black/[0.06] shadow-sm hover:border-black/[0.12] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-[#1D1D1F] truncate">
                      {field.label}
                    </h4>
                    <span className="text-[11px] text-[#86868B]">
                      Tipo: {field.type === "textarea" ? "Texto largo" : field.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleRequired(index)}
                    disabled={isBaseField}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      field.required
                        ? "bg-[#34C759]/10 text-[#34C759]"
                        : "bg-black/[0.04] text-[#86868B]"
                    } ${isBaseField ? "opacity-75 cursor-default" : "hover:scale-105 active:scale-95"}`}
                  >
                    {field.required ? "Obligatorio" : "Opcional"}
                  </button>

                  {!isBaseField && (
                    <button
                      type="button"
                      onClick={() => handleRemoveField(index)}
                      className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add custom question form */}
      <form
        onSubmit={handleAddField}
        className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
          Agregar pregunta personalizada
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ej. ¿Tienes alguna alergia o padecimiento?, Matrícula..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
            />
          </div>

          <div>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
            >
              <option value="text">Texto corto</option>
              <option value="textarea">Texto largo / Notas</option>
              <option value="tel">Teléfono adicional</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs font-medium text-[#1D1D1F] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newRequired}
              onChange={(e) => setNewRequired(e.target.checked)}
              className="w-4 h-4 rounded text-[#007AFF] focus:ring-[#007AFF]"
            />
            <span>Hacer obligatorio para reservar</span>
          </label>

          <button
            type="submit"
            disabled={!newLabel.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold disabled:opacity-50 hover:bg-[#0071E3] transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar pregunta</span>
          </button>
        </div>
      </form>
    </div>
  );
}
