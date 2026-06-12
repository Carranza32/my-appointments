"use client";

import { useState, useTransition } from "react";
import {
  createStaff,
  updateStaff,
  deleteStaff,
  type StaffDTO,
} from "@/actions/personal";

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
    setWeeklyHours(JSON.parse(JSON.stringify(s.weeklyHours)));
    setActiveTab("info");
    setFormError(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await createStaff({ name, email, phone, description, avatarUrl });
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
  };  return (
    <div className="w-full space-y-6">
      {/* Search & Actions Header (Refractive Card) */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border border-white/20 bg-white/80 p-5 rounded-3xl shadow-md shadow-slate-100/50 dark:border-white/5 dark:bg-slate-900/80 dark:shadow-none backdrop-blur-xl transition-all duration-300">
        
        {/* Search Input (Precision Input) */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
          />
          <svg className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Add Staff Button (Blue Glass capsule button) */}
        <button
          onClick={openCreate}
          type="button"
          className="rounded-full bg-[#1A73E8] px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Agregar Integrante</span>
        </button>
      </div>

      {/* Datatable (Accentuated container background to stand out from luminous layout) */}
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-lg shadow-slate-100/50 dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-xl transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-405 dark:border-slate-800/40 dark:bg-slate-950/20 dark:text-slate-500 font-heading">
                <th className="px-6 py-4">Colaborador / Especialista</th>
                <th className="px-6 py-4">Correo Electrónico</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-850/60 text-xs">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-450 dark:text-slate-550">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="font-bold font-heading">No hay personal registrado</p>
                      <p className="text-[10px] font-semibold max-w-xs leading-relaxed">Agrega a tus colaboradores para que tengan su propia agenda independiente y los clientes puedan reservar con ellos.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold font-heading">
                              {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-150 leading-tight font-heading">{member.name}</p>
                          <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate max-w-[180px]">
                            {member.description || "Sin descripción"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4.5 font-semibold text-slate-600 dark:text-slate-350 font-sans">
                      {member.email}
                    </td>

                    <td className="px-6 py-4.5 font-bold text-slate-700 dark:text-slate-300 font-sans">
                      {member.phone || <span className="text-slate-350 dark:text-slate-600 italic font-medium">No registrado</span>}
                    </td>

                    <td className="px-6 py-4.5 text-right space-x-2.5 whitespace-nowrap">
                      {/* Edit/Configure Button (Outlined circle, no black borders) */}
                      <button
                        onClick={() => openEdit(member)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/40 text-slate-500 hover:bg-[#1A73E8] hover:text-white hover:border-[#1A73E8] dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400 dark:hover:bg-[#1A73E8] dark:hover:text-white dark:hover:border-[#1A73E8] transition-all cursor-pointer"
                        title="Configurar perfil y horarios"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Delete Button (Outlined circle, no black borders) */}
                      <button
                        onClick={() => setIsDeleteConfirmOpen(member.id)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/40 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400 dark:hover:bg-red-955/20 dark:hover:text-red-400 dark:hover:border-red-900/30 transition-all cursor-pointer"
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

      {/* CREATE STAFF MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md">
          <form onSubmit={handleCreate} className="w-full max-w-md overflow-hidden border border-white/20 bg-white/95 p-8 shadow-xl dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] animate-scale-up space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150 font-heading">
                Registrar Colaborador
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-450 dark:text-slate-500">
                Ingresa los datos del nuevo integrante del equipo.
              </p>
            </div>

            {formError && (
              <div className="rounded-2xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-xs font-bold text-red-750 dark:border-red-900/30 dark:bg-red-955/20 dark:text-red-300">
                {formError}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dr. Andrés Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="andres@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                  Teléfono Móvil
                </label>
                <input
                  type="tel"
                  placeholder="55790854"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCreateOpen(false)}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={pending}
                type="submit"
                className="rounded-full bg-[#1A73E8] px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT STAFF MODAL (TABBED INFRASTRUCTURE) */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/30 p-4 backdrop-blur-md">
          <form onSubmit={handleUpdate} className="w-full max-w-2xl overflow-hidden border border-white/20 bg-white/95 p-8 shadow-xl dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] animate-scale-up flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start border-b border-slate-200/40 dark:border-slate-800/60 pb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150 font-heading">
                  Configurar Especialista
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-450 dark:text-slate-500">
                  {selectedStaff.name} · {selectedStaff.email}
                </p>
              </div>
              <div className="flex rounded-full bg-slate-100 p-1 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer font-heading ${
                    activeTab === "info"
                      ? "bg-white text-slate-850 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                      : "text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Perfil Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("hours")}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer font-heading ${
                    activeTab === "hours"
                      ? "bg-white text-slate-850 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                      : "text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Horarios
                </button>
              </div>
            </div>

            {formError && (
              <div className="mt-4 rounded-2xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-xs font-bold text-red-750 dark:border-red-900/30 dark:bg-red-955/20 dark:text-red-300">
                {formError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-6 space-y-5 pr-1 min-h-[350px]">
              {/* TAB 1: INFO PROFILE */}
              {activeTab === "info" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                        Teléfono Móvil
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                        URL de Foto de Perfil
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                      Especialidad / Descripción Corta
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ej. Especialista en Ortodoncia y estética dental..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: HOURS CONFIG */}
              {activeTab === "hours" && (
                <div className="space-y-4">
                  {DAYS_KEYS.map((dayKey) => {
                    const day = weeklyHours[dayKey] || { enabled: false, ranges: [] };
                    const enabled = day.enabled;

                    return (
                      <div
                        key={dayKey}
                        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[24px] border transition-all ${
                          enabled
                            ? "border-slate-200 bg-white/70 dark:border-slate-800/80 dark:bg-slate-900/50 border-l-4 border-l-[#1A73E8]"
                            : "border-slate-200/50 bg-slate-50/50 dark:border-slate-850/30 dark:bg-slate-955/30 opacity-70"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleDay(dayKey)}
                            className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-hidden ${
                              enabled ? "bg-[#1A73E8]" : "bg-slate-200 dark:bg-slate-800"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-300 ease-in-out ${
                                enabled ? "translate-x-4.5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-150 font-heading w-20">
                            {DAY_LABELS[dayKey]}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col gap-2 md:items-end">
                          {enabled ? (
                            <div className="space-y-2">
                              {day.ranges.map((range: any, ri: number) => (
                                <div key={ri} className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={range.start}
                                    onChange={(e) => updateRange(dayKey, ri, "start", e.target.value)}
                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                                  />
                                  <span className="text-xs text-slate-400">a</span>
                                  <input
                                    type="time"
                                    value={range.end}
                                    onChange={(e) => updateRange(dayKey, ri, "end", e.target.value)}
                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-hidden dark:border-slate-800 dark:bg-slate-955 dark:text-slate-100 focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                                  />

                                  {day.ranges.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeRange(dayKey, ri)}
                                      className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-red-955/20 transition-all cursor-pointer"
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
                                  className="text-[10px] font-bold uppercase tracking-wider text-[#1A73E8] bg-white border border-slate-200 px-4 py-2.5 rounded-full hover:bg-slate-50 cursor-pointer shadow-xs dark:bg-slate-955 dark:border-slate-800 dark:text-blue-400 dark:hover:bg-slate-900 transition-all block md:ml-auto"
                                >
                                  + Pausa almuerzo
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-450 italic">
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

            <div className="border-t border-slate-200/40 dark:border-slate-800/60 pt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedStaff(null)}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={pending}
                type="submit"
                className="rounded-full bg-[#1A73E8] px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md">
          <div className="w-full max-w-md border border-white/20 bg-white/95 p-8 shadow-xl dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] animate-scale-up">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-150 font-heading">
              ¿Eliminar ficha de colaborador?
            </h4>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold font-sans">
              Esta acción eliminará de forma permanente al colaborador de tu equipo, inhabilitando sus horarios del portal público de reservas.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(null)}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-350 dark:hover:bg-slate-800 cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={pending}
                onClick={() => handleDelete(isDeleteConfirmOpen)}
                className="rounded-full bg-red-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-red-500/10 hover:bg-red-700 transition-all disabled:opacity-50 cursor-pointer"
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
