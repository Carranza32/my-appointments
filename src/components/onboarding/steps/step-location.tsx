"use client";

import React, { useState } from "react";
import { Plus, Trash2, MapPin, Building } from "lucide-react";
import type { OnboardingLocationDraft, PresetRecommendation } from "@/lib/onboarding/types";

interface StepLocationProps {
  locationType: "single" | "multiple" | "none_online" | "none_domicilio";
  locationsList: OnboardingLocationDraft[];
  preset?: PresetRecommendation;
  onChangeLocationsList: (list: OnboardingLocationDraft[]) => void;
}

export function StepLocation({
  locationType,
  locationsList,
  preset,
  onChangeLocationsList,
}: StepLocationProps) {
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [newLocPhone, setNewLocPhone] = useState("");

  const locationLabel = preset?.defaultTerminology?.location || "Consultorio / Sede";
  const clientLabel = preset?.defaultTerminology?.client?.toLowerCase() || "cliente";
  const appointmentLabel = preset?.defaultTerminology?.appointment?.toLowerCase() || "cita";

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    const newLoc: OnboardingLocationDraft = {
      id: `draft-loc-${Date.now()}`,
      name: newLocName.trim(),
      address: newLocAddress.trim() || undefined,
      phone: newLocPhone.trim() || undefined,
    };

    onChangeLocationsList([...locationsList, newLoc]);
    setNewLocName("");
    setNewLocAddress("");
    setNewLocPhone("");
  };

  const handleRemoveLocation = (id: string) => {
    onChangeLocationsList(locationsList.filter((l) => l.id !== id));
  };

  const handleUpdateSingleAddress = (address: string) => {
    if (locationsList.length === 0) {
      onChangeLocationsList([{ id: "draft-loc-main", name: "Sede Principal", address }]);
    } else {
      const updated = [...locationsList];
      updated[0] = { ...updated[0], address };
      onChangeLocationsList(updated);
    }
  };

  return (
    <div className="space-y-6">
      {locationType === "single" ? (
        <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F]">
            <MapPin className="w-4 h-4 text-[#007AFF]" />
            <span>{`Dirección de tu ${locationLabel.toLowerCase()}`}</span>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={locationsList[0]?.address || ""}
              onChange={(e) => handleUpdateSingleAddress(e.target.value)}
              placeholder="Ej. Av. Insurgentes Sur 1234, Col. del Valle, CDMX"
              className="w-full px-4 py-3 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
            />
            <p className="text-xs text-[#86868B]">
              {`Tus ${clientLabel}s recibirán esta dirección en su confirmación y recordatorios de ${appointmentLabel}.`}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Multiple locations builder */}
          <form
            onSubmit={handleAddLocation}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
              {`Agregar nueva ${locationLabel.toLowerCase()}`}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                placeholder="Nombre (ej. Sede Norte) *"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
              />
              <input
                type="text"
                value={newLocAddress}
                onChange={(e) => setNewLocAddress(e.target.value)}
                placeholder="Dirección física"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
              />
              <input
                type="tel"
                value={newLocPhone}
                onChange={(e) => setNewLocPhone(e.target.value)}
                placeholder="Teléfono"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!newLocName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold disabled:opacity-50 hover:bg-[#0071E3] transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar sede</span>
              </button>
            </div>
          </form>

          {/* Locations list */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-[#86868B] px-1">
              {`${locationLabel}s configuradas (${locationsList.length})`}
            </div>

            {locationsList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black/[0.02] border border-dashed border-black/[0.08] text-sm text-[#86868B]">
                {`Agrega al menos una ${locationLabel.toLowerCase()} para que tus ${clientLabel}s puedan seleccionarla al reservar.`}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {locationsList.map((loc, index) => (
                  <div
                    key={loc.id || index}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white border border-black/[0.06] shadow-sm hover:border-black/[0.12] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#5856D6]/10 text-[#5856D6] flex items-center justify-center flex-shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#1D1D1F] truncate">
                          {loc.name}
                        </h4>
                        {loc.address && (
                          <p className="text-xs text-[#86868B] truncate mt-0.5">
                            {loc.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(loc.id)}
                      className="p-2 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
