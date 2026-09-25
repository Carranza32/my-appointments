"use client";

import React, { useState } from "react";
import { Plus, Trash2, Box, Layers, MapPin } from "lucide-react";
import type { OnboardingResourceDraft, OnboardingLocationDraft } from "@/lib/onboarding/types";

interface StepResourcesProps {
  resourcesList: OnboardingResourceDraft[];
  locationsList?: OnboardingLocationDraft[];
  onChangeResourcesList: (list: OnboardingResourceDraft[]) => void;
}

const RESOURCE_TYPES = [
  { id: "CANCHA", label: "Cancha deportiva" },
  { id: "CABINA", label: "Cabina / Sala privada" },
  { id: "CONSULTORIO", label: "Consultorio / Box" },
  { id: "SILLON", label: "Sillón / Estación" },
  { id: "EQUIPO", label: "Equipo o Máquina" },
  { id: "SALA", label: "Sala de juntas / Estudio" },
  { id: "GENERAL", label: "Otro recurso físico" },
];

export function StepResources({
  resourcesList,
  locationsList = [],
  onChangeResourcesList,
}: StepResourcesProps) {
  const [newResName, setNewResName] = useState("");
  const [newResType, setNewResType] = useState("CABINA");
  const [newResLocation, setNewResLocation] = useState(
    locationsList.length > 0 ? locationsList[0].name : ""
  );

  const hasMultipleLocations = locationsList.length > 1;

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim()) return;

    const newRes: OnboardingResourceDraft = {
      id: `draft-res-${Date.now()}`,
      name: newResName.trim(),
      type: newResType,
      locationName: hasMultipleLocations && newResLocation ? newResLocation : undefined,
    };

    onChangeResourcesList([...resourcesList, newRes]);
    setNewResName("");
  };

  const handleRemoveResource = (id: string) => {
    onChangeResourcesList(resourcesList.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-[#6E6E73]">
          Define las canchas, salas, cabinas o máquinas que se asignarán automáticamente a las reservas para evitar choques de horario.
        </p>
      </div>

      {/* Form to add resource */}
      <form
        onSubmit={handleAddResource}
        className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
          Agregar nuevo recurso o espacio
        </div>

        <div className={`grid grid-cols-1 ${hasMultipleLocations ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2.5`}>
          <input
            type="text"
            value={newResName}
            onChange={(e) => setNewResName(e.target.value)}
            placeholder="Nombre (ej. Cancha 1, Cabina Spa A, Box 3) *"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
          />

          <select
            value={newResType}
            onChange={(e) => setNewResType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {hasMultipleLocations && (
            <select
              value={newResLocation}
              onChange={(e) => setNewResLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
            >
              {locationsList.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  Sede: {loc.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!newResName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold disabled:opacity-50 hover:bg-[#0071E3] transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar recurso</span>
          </button>
        </div>
      </form>

      {/* Resources list */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-[#86868B] px-1">
          Recursos registrados ({resourcesList.length})
        </div>

        {resourcesList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-black/[0.02] border border-dashed border-black/[0.08] text-sm text-[#86868B]">
            Agrega al menos una cancha, sala o cabina para habilitar la reserva por recurso.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {resourcesList.map((res, index) => (
              <div
                key={res.id || index}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-black/[0.06] shadow-sm hover:border-black/[0.12] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center flex-shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-[#1D1D1F] truncate">
                      {res.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[#86868B] uppercase tracking-wider">
                        {res.type}
                      </span>
                      {res.locationName && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.04] text-[#515154] flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {res.locationName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveResource(res.id)}
                  className="p-2 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
