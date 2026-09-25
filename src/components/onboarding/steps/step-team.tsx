"use client";

import React, { useState } from "react";
import { Plus, Trash2, UserCheck, Mail, Phone } from "lucide-react";
import type { OnboardingStaffDraft, PresetRecommendation } from "@/lib/onboarding/types";

interface StepTeamProps {
  staffList: OnboardingStaffDraft[];
  preset?: PresetRecommendation;
  onChangeStaffList: (list: OnboardingStaffDraft[]) => void;
}

export function StepTeam({ staffList, preset, onChangeStaffList }: StepTeamProps) {
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  const staffLabel = preset?.defaultTerminology?.staff || "Especialista";
  const staffPlural = staffLabel.includes("/") ? staffLabel : `${staffLabel}s`;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newStaff: OnboardingStaffDraft = {
      id: `draft-staff-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || undefined,
      phone: newMemberPhone.trim() || undefined,
      assignedServiceNames: [],
    };

    onChangeStaffList([...staffList, newStaff]);
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberPhone("");
  };

  const handleRemoveMember = (id: string) => {
    onChangeStaffList(staffList.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-[#6E6E73]">
          {`Agrega a los ${staffPlural.toLowerCase()} que formarán parte de tu equipo de atención.`}
        </p>
      </div>

      {/* Form to add a team member */}
      <form
        onSubmit={handleAddMember}
        className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
          {`Nuevo ${staffLabel.toLowerCase()}`}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Nombre completo *"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
          />
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
          />
          <input
            type="tel"
            value={newMemberPhone}
            onChange={(e) => setNewMemberPhone(e.target.value)}
            placeholder="Teléfono / WhatsApp"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.1] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!newMemberName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold disabled:opacity-50 hover:bg-[#0071E3] transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar al equipo</span>
          </button>
        </div>
      </form>

      {/* Current Team Members List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#86868B] px-1">
          <span>{`${staffPlural} registrados (${staffList.length})`}</span>
        </div>

        {staffList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-black/[0.02] border border-dashed border-black/[0.08] text-sm text-[#86868B]">
            {`Aún no has agregado ${staffPlural.toLowerCase()} a tu equipo. Puedes agregar al menos uno o continuar y agregarlos más tarde.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {staffList.map((member, index) => (
              <div
                key={member.id || index}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white border border-black/[0.06] shadow-sm hover:border-black/[0.12] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-[#1D1D1F] truncate">
                      {member.name}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-[#86868B] mt-0.5 truncate">
                      {member.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" /> {member.email}
                        </span>
                      )}
                      {member.phone && (
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="w-3 h-3" /> {member.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-2 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors active:scale-95"
                  title="Eliminar miembro"
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
