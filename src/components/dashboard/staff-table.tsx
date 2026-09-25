"use client";

import { useState, useTransition } from "react";
import {
  createStaff,
  updateStaff,
  deleteStaff,
  type StaffDTO,
} from "@/actions/personal";
import { X } from "lucide-react";

type Props = {
  initialStaff: StaffDTO[];
};

const DAYS_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export function StaffTable({ initialStaff }: Props) {
  const [staffList, setStaffList] = useState<StaffDTO[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffDTO | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "hours">("info");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [weeklyHours, setWeeklyHours] = useState<any>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [pending, startTransition] = useTransition();

  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone && s.phone.includes(searchQuery))
  );

  const openCreate = () => {
    setName("");
    setEmail("");
    setPhone("");
    setDescription("");
    setAvatarUrl("");
    setSlug("");
    setIsActive(true);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEdit = (s: StaffDTO) => {
    setSelectedStaff(s);
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone || "");
    setDescription(s.description || "");
    setAvatarUrl(s.avatarUrl || "");
    setSlug(s.slug || "");
    setIsActive(s.isActive);
    setWeeklyHours(JSON.parse(JSON.stringify(s.weeklyHours)));
    setActiveTab("info");
    setFormError(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await createStaff({ name, email, phone, description, avatarUrl, slug });
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsCreateOpen(false);
        // Refresh local list
        const newMember: StaffDTO = {
          id: res.staffId || Math.random().toString(),
          name,
          email,
          phone: phone || null,
          description: description || null,
          avatarUrl: avatarUrl || null,
          weeklyHours: {},
          createdAt: new Date().toISOString(),
          slug: slug || null,
          isActive: true,
        };
        setStaffList((prev) => [...prev, newMember].sort((a, b) => a.name.localeCompare(b.name)));
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setFormError(null);

    startTransition(async () => {
      const res = await updateStaff(selectedStaff.id, {
        name,
        email,
        phone,
        description,
        avatarUrl,
        weeklyHours,
        slug,
        isActive,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setStaffList((prev) =>
          prev
            .map((s) =>
              s.id === selectedStaff.id
                ? {
                    ...s,
                    name,
                    email,
                    phone: phone || null,
                    description: description || null,
                    avatarUrl: avatarUrl || null,
                    weeklyHours,
                    slug: slug || null,
                    isActive,
                  }
                : s
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setSelectedStaff(null);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteStaff(id);
      if (res.error) {
        alert(res.error);
      } else {
        setIsDeleteConfirmOpen(null);
        setStaffList((prev) => prev.filter((s) => s.id !== id));
      }
    });
  };

  const toggleDay = (dayKey: string) => {
    const day = weeklyHours[dayKey] || { enabled: false, ranges: [{ start: "09:00", end: "17:00" }] };
    setWeeklyHours({
      ...weeklyHours,
      [dayKey]: {
        ...day,
        enabled: !day.enabled,
      },
    });
  };

  const updateRange = (dayKey: string, rangeIdx: number, field: "start" | "end", val: string) => {
    const day = weeklyHours[dayKey];
    const ranges = [...day.ranges];
    ranges[rangeIdx] = { ...ranges[rangeIdx], [field]: val };
    setWeeklyHours({
      ...weeklyHours,
      [dayKey]: {
        ...day,
        ranges,
      },
    });
  };

  const addRange = (dayKey: string) => {
    const day = weeklyHours[dayKey];
    setWeeklyHours({
      ...weeklyHours,
      [dayKey]: {
        ...day,
        ranges: [...day.ranges, { start: "15:00", end: "19:00" }],
      },
    });
  };

  const removeRange = (dayKey: string, rangeIdx: number) => {
    const day = weeklyHours[dayKey];
    setWeeklyHours({
      ...weeklyHours,
      [dayKey]: {
        ...day,
        ranges: day.ranges.filter((_: any, i: number) => i !== rangeIdx),
      },
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 pl-10 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
          />
          <svg className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Add Staff Button */}
        <button
          onClick={openCreate}
          type="button"
          className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] px-5 py-2.5 text-xs font-medium text-white shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Agregar Integrante</span>
        </button>
      </div>

      {/* Datatable */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01] text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
                <th className="px-6 py-3.5">Colaborador / Especialista</th>
                <th className="px-6 py-3.5">Correo Electrónico</th>
                <th className="px-6 py-3.5">Teléfono</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-xs font-normal">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#86868B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/[0.03] text-[#86868B]">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-[#1D1D1F]">No hay personal registrado</p>
                      <p className="text-xs text-[#86868B] max-w-xs leading-relaxed">Agrega a tus colaboradores para que tengan su propia agenda independiente y los clientes puedan reservar con ellos.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-black/[0.015] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-[#1D1D1F] overflow-hidden border border-black/[0.06]">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[11px] font-semibold">
                                {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                            member.isActive ? "bg-[#34C759]" : "bg-[#86868B]"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-[#1D1D1F] leading-tight">{member.name}</p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {member.slug && (
                              <span className="text-[10px] font-medium text-[#007AFF] font-mono select-all">
                                @{member.slug}
                              </span>
                            )}
                            <p className="text-[10px] text-[#86868B] truncate max-w-[180px]">
                              {member.description || "Sin descripción"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-[#86868B]">
                      {member.email}
                    </td>

                    <td className="px-6 py-4 text-[#1D1D1F] font-medium">
                      {member.phone || <span className="text-[#86868B] font-normal">No registrado</span>}
                    </td>

                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      {/* Edit/Configure Button */}
                      <button
                        onClick={() => openEdit(member)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#86868B] hover:text-[#007AFF] hover:bg-[#007AFF]/10 active:scale-95 transition-all cursor-pointer"
                        title="Configurar perfil y horarios"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setIsDeleteConfirmOpen(member.id)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 active:scale-95 transition-all cursor-pointer"
                        title="Eliminar colaborador"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MODAL (Apple Design System Inset Grouped Cards) */}
      {isCreateOpen && (
        <div 
          onClick={() => setIsCreateOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.16)] animate-in zoom-in-95 duration-200"
          >
            {/* 1. STICKY HEADER */}
            <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] font-heading leading-tight">
                  Registrar Colaborador
                </h3>
                <p className="mt-0.5 text-xs text-[#86868B] font-medium">
                  Ingresa los datos del nuevo integrante del equipo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                {formError && (
                  <div className="rounded-2xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-3.5 text-xs font-semibold text-[#FF3B30]">
                    {formError}
                  </div>
                )}

                {/* CARD 1: DATOS PERSONALES */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Información Personal
                  </p>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Nombre Completo <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Dr. Andrés Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Correo Electrónico <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="andres@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Teléfono Móvil
                      </label>
                      <input
                        type="tel"
                        placeholder="55790854"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 2: CONFIGURACIÓN PÚBLICA */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Portal y Enlace
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Slug de Reserva Personal
                    </label>
                    <input
                      type="text"
                      placeholder="dr-andres-silva"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. STICKY FOOTER */}
              <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-row gap-3 justify-end">
                <button
                  onClick={() => setIsCreateOpen(false)}
                  type="button"
                  className="flex-1 sm:flex-none sm:min-w-[120px] rounded-xl border border-black/[0.08] bg-[#F2F2F7] py-2.5 px-5 text-xs font-semibold text-[#1D1D1F] hover:bg-[#E5E5EA] active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  disabled={pending}
                  type="submit"
                  className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] py-2.5 px-6 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] transition-all disabled:opacity-50 text-center cursor-pointer"
                >
                  {pending ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL (Responsive Apple Design 3-Tier Layout) */}
      {selectedStaff && (
        <div 
          onClick={() => setSelectedStaff(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.16)] animate-in zoom-in-95 duration-200"
          >
            {/* 1. STICKY HEADER */}
            <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] font-heading leading-tight truncate">
                  Configurar Especialista
                </h3>
                <p className="mt-0.5 text-xs text-[#86868B] font-medium truncate">
                  {selectedStaff.name} · {selectedStaff.email}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-black/[0.05] p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("info")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "info"
                        ? "bg-white text-[#1D1D1F] shadow-xs"
                        : "text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                  >
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("hours")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "hours"
                        ? "bg-white text-[#1D1D1F] shadow-xs"
                        : "text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                  >
                    Horarios
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                {formError && (
                  <div className="rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 px-4 py-2.5 text-xs font-semibold text-[#FF3B30]">
                    {formError}
                  </div>
                )}

                {/* TAB 1: INFO PROFILE */}
                {activeTab === "info" && (
                  <div className="space-y-4">
                    {/* CARD 1: DATOS PERSONALES */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                        Información Personal
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                            Nombre Completo <span className="text-[#FF3B30]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                            Correo Electrónico <span className="text-[#FF3B30]">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                            Teléfono Móvil
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                            Slug de Reserva
                          </label>
                          <input
                            type="text"
                            placeholder="dr-andres-silva"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: PERFIL PÚBLICO Y DESCRIPCIÓN */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                        Perfil Público y Visibilidad
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                            URL de Foto de Perfil
                          </label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                            Estado en el Sistema
                          </label>
                          <select
                            value={isActive ? "true" : "false"}
                            onChange={(e) => setIsActive(e.target.value === "true")}
                            className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] shadow-xs cursor-pointer"
                          >
                            <option value="true">Activo (Disponible)</option>
                            <option value="false">Inactivo / Vacaciones</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                          Especialidad / Descripción Corta
                        </label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Ej. Especialista en psicología clínica y terapia cognitivo-conductual..."
                          className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all resize-none shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: WORKING HOURS SCHEDULE */}
                {activeTab === "hours" && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#86868B] font-medium mb-3">
                      Establece las franjas de disponibilidad semanal en las que este colaborador atiende citas.
                    </p>

                    {DAYS_KEYS.map((dayKey) => {
                      const day = weeklyHours[dayKey] || { enabled: false, ranges: [] };
                      const enabled = day.enabled;

                      return (
                        <div
                          key={dayKey}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                            enabled
                              ? "border-black/[0.08] bg-white shadow-xs"
                              : "border-black/[0.04] bg-[#F5F5F7]/50 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleDay(dayKey)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${
                                enabled ? "bg-[#34C759]" : "bg-black/[0.12]"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                                  enabled ? "translate-x-4.5" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                            <span className="text-xs font-bold text-[#1D1D1F] w-24">
                              {DAY_LABELS[dayKey]}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col gap-2 sm:items-end">
                            {enabled ? (
                              <div className="space-y-2">
                                {day.ranges.map((range: any, ri: number) => (
                                  <div key={ri} className="flex items-center gap-2">
                                    <input
                                      type="time"
                                      value={range.start}
                                      onChange={(e) => updateRange(dayKey, ri, "start", e.target.value)}
                                      className="rounded-xl border border-black/[0.08] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1D1D1F] focus:border-[#007AFF] shadow-xs"
                                    />
                                    <span className="text-xs text-[#86868B]">a</span>
                                    <input
                                      type="time"
                                      value={range.end}
                                      onChange={(e) => updateRange(dayKey, ri, "end", e.target.value)}
                                      className="rounded-xl border border-black/[0.08] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1D1D1F] focus:border-[#007AFF] shadow-xs"
                                    />

                                    {day.ranges.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeRange(dayKey, ri)}
                                        className="h-6 w-6 inline-flex items-center justify-center rounded-md text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all cursor-pointer text-xs"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}

                                {day.ranges.length < 2 && (
                                  <button
                                    type="button"
                                    onClick={() => addRange(dayKey)}
                                    className="text-[11px] font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer block sm:ml-auto"
                                  >
                                    + Pausa almuerzo
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-[#86868B] italic">
                                No laborable
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. STICKY FOOTER */}
              <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-row gap-3 justify-end">
                <button
                  onClick={() => setSelectedStaff(null)}
                  type="button"
                  className="flex-1 sm:flex-none sm:min-w-[120px] rounded-xl border border-black/[0.08] bg-[#F2F2F7] py-2.5 px-5 text-xs font-semibold text-[#1D1D1F] hover:bg-[#E5E5EA] active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  disabled={pending}
                  type="submit"
                  className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] py-2.5 px-6 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] transition-all disabled:opacity-50 text-center cursor-pointer"
                >
                  {pending ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG (Responsive Apple Design Layout) */}
      {isDeleteConfirmOpen && (
        <div 
          onClick={() => setIsDeleteConfirmOpen(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden bg-white/95 backdrop-blur-2xl border border-black/[0.08] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)] rounded-[28px] space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF3B30]/10 text-[#FF3B30]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#1D1D1F] font-heading leading-tight">
                ¿Eliminar ficha de colaborador?
              </h4>
              <p className="mt-1.5 text-xs text-[#86868B] leading-relaxed font-normal">
                Esta acción eliminará de forma permanente al colaborador de tu equipo, inhabilitando sus horarios del portal público de reservas.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-black/[0.06]">
              <button
                onClick={() => setIsDeleteConfirmOpen(null)}
                type="button"
                className="rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-4 py-2 text-xs font-semibold text-[#1D1D1F] hover:bg-[#E5E5EA] active:scale-[0.98] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={pending}
                onClick={() => handleDelete(isDeleteConfirmOpen)}
                className="rounded-xl bg-[#FF3B30] hover:bg-[#d9342b] active:scale-[0.98] px-5 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(255,59,48,0.25)] transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Eliminando..." : "Eliminar Colaborador"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
