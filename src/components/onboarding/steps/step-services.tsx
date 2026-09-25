"use client";

import React, { useState } from "react";
import { Plus, Trash2, Clock, DollarSign, Sparkles } from "lucide-react";
import type { OnboardingServiceDraft, PresetRecommendation } from "@/lib/onboarding/types";

interface StepServicesProps {
  servicesList: OnboardingServiceDraft[];
  preset?: PresetRecommendation;
  onChangeServicesList: (list: OnboardingServiceDraft[]) => void;
  currency?: string;
}

export function StepServices({
  servicesList,
  preset,
  onChangeServicesList,
  currency = "USD",
}: StepServicesProps) {
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState(45);
  const [newBuffer, setNewBuffer] = useState(0);
  const [newPrice, setNewPrice] = useState<number | string>(50);

  const clientLabel = preset?.defaultTerminology?.client?.toLowerCase() || "cliente";
  const serviceLabel = preset?.defaultTerminology?.service?.toLowerCase() || "servicio";

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newService: OnboardingServiceDraft = {
      id: `draft-srv-${Date.now()}`,
      name: newName.trim(),
      duration: Number(newDuration) || 30,
      bufferTime: Number(newBuffer) || 0,
      price: Number(newPrice) || 0,
      currency,
    };

    onChangeServicesList([...servicesList, newService]);
    setNewName("");
    setNewPrice(50);
  };

  const handleRemoveService = (id: string) => {
    onChangeServicesList(servicesList.filter((s) => s.id !== id));
  };

  const handleUpdateField = (id: string, field: keyof OnboardingServiceDraft, value: any) => {
    onChangeServicesList(
      servicesList.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-[#6E6E73]">
          {`Ajusta los ${serviceLabel}s que ofrecerás a tus ${clientLabel}s, su duración y su precio.`}
        </p>
      </div>

      {/* Form to add a new service */}
      <form
        onSubmit={handleAddService}
        className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
          Agregar servicio personalizado
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del servicio *"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
            />
          </div>

          <div>
            <div className="relative">
              <input
                type="number"
                min="5"
                step="5"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                placeholder="Duración"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#86868B]">min</span>
            </div>
          </div>

          <div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#86868B]">$</span>
              <input
                type="number"
                min="0"
                step="10"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Precio"
                className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-[#86868B]">
            <span>Tiempo de buffer (descanso/limpieza):</span>
            <select
              value={newBuffer}
              onChange={(e) => setNewBuffer(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-black/[0.04] text-xs font-medium text-[#1D1D1F] border-none focus:ring-1 focus:ring-[#007AFF]"
            >
              <option value={0}>0 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold disabled:opacity-50 hover:bg-[#0071E3] transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>
      </form>

      {/* Services List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#86868B] px-1">
          <span>Servicios configurados ({servicesList.length})</span>
          <span>Puedes editar los valores directamente</span>
        </div>

        {servicesList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-black/[0.02] border border-dashed border-black/[0.08] text-sm text-[#86868B]">
            No tienes servicios en la lista. Agrega al menos uno para continuar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {servicesList.map((srv, index) => (
              <div
                key={srv.id || index}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white border border-black/[0.06] shadow-sm hover:border-black/[0.12] transition-all gap-3"
              >
                <div className="min-w-0 flex-1 sm:pr-2">
                  <input
                    type="text"
                    value={srv.name}
                    onChange={(e) => handleUpdateField(srv.id, "name", e.target.value)}
                    className="font-semibold text-sm text-[#1D1D1F] bg-transparent border-b border-transparent hover:border-black/[0.1] focus:border-[#007AFF] focus:outline-none w-full"
                  />
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap shrink-0">
                  {/* Duration input */}
                  <div className="flex items-center gap-1.5 bg-black/[0.03] px-2.5 py-1 rounded-lg text-xs">
                    <Clock className="w-3.5 h-3.5 text-[#86868B]" />
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={srv.duration}
                      onChange={(e) => handleUpdateField(srv.id, "duration", Number(e.target.value))}
                      className="w-10 bg-transparent font-medium text-[#1D1D1F] text-right focus:outline-none"
                    />
                    <span className="text-[#86868B]">min</span>
                  </div>

                  {/* Buffer input */}
                  {srv.bufferTime > 0 && (
                    <div className="flex items-center gap-1 bg-[#FF9500]/10 text-[#FF9500] px-2 py-1 rounded-lg text-xs font-medium">
                      <span>+{srv.bufferTime}m descanso</span>
                    </div>
                  )}

                  {/* Price input */}
                  <div className="flex items-center gap-1 bg-black/[0.03] px-2.5 py-1 rounded-lg text-xs font-semibold text-[#1D1D1F]">
                    <span>$</span>
                    <input
                      type="number"
                      min="0"
                      value={srv.price}
                      onChange={(e) => handleUpdateField(srv.id, "price", Number(e.target.value))}
                      className="w-14 bg-transparent font-semibold text-[#1D1D1F] text-right focus:outline-none"
                    />
                    <span className="text-[10px] text-[#86868B]">{currency}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveService(srv.id)}
                    className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors active:scale-95 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
