"use client";

import { useState, useTransition } from "react";
import {
  createLocation,
  updateLocation,
  deleteLocation,
  type LocationDTO,
} from "@/actions/sedes";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
import { X } from "lucide-react";

type Props = {
  initialLocations: LocationDTO[];
  planTier?: "FREE" | "PRO";
};

export function LocationTable({ initialLocations, planTier = "FREE" }: Props) {
  const [locationList, setLocationList] = useState<LocationDTO[]>(initialLocations);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDTO | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();

  const filteredLocations = locationList.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (loc.phone && loc.phone.includes(searchQuery))
  );

  const openCreate = () => {
    if (planTier === "FREE" && locationList.length >= 1) {
      setIsUpgradeOpen(true);
      return;
    }
    setName("");
    setAddress("");
    setPhone("");
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEdit = (loc: LocationDTO) => {
    setSelectedLocation(loc);
    setName(loc.name);
    setAddress(loc.address);
    setPhone(loc.phone || "");
    setFormError(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await createLocation({ name, address, phone });
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsCreateOpen(false);
        // Refresh local list
        const newLocation: LocationDTO = {
          id: res.locationId || Math.random().toString(),
          name,
          address,
          phone: phone || null,
          createdAt: new Date().toISOString(),
        };
        setLocationList((prev) => [...prev, newLocation].sort((a, b) => a.name.localeCompare(b.name)));
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    setFormError(null);

    startTransition(async () => {
      const res = await updateLocation(selectedLocation.id, {
        name,
        address,
        phone,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setLocationList((prev) =>
          prev
            .map((loc) =>
              loc.id === selectedLocation.id
                ? {
                    ...loc,
                    name,
                    address,
                    phone: phone || null,
                  }
                : loc
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setSelectedLocation(null);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteLocation(id);
      if (res.error) {
        alert(res.error);
      } else {
        setIsDeleteConfirmOpen(null);
        setLocationList((prev) => prev.filter((loc) => loc.id !== id));
      }
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
            placeholder="Buscar por nombre, dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 pl-10 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
          />
          <svg className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Add Location Button */}
        <button
          onClick={openCreate}
          type="button"
          className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] px-5 py-2.5 text-xs font-medium text-white shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          {planTier === "FREE" && locationList.length >= 1 ? (
            <>
              <span>⭐</span>
              <span>Agregar Sede (PRO)</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Agregar Sede / Sucursal</span>
            </>
          )}
        </button>
      </div>

      {/* Datatable */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01] text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
                <th className="px-6 py-3.5">Sede / Sucursal</th>
                <th className="px-6 py-3.5">Dirección</th>
                <th className="px-6 py-3.5">Teléfono de Contacto</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-xs font-normal">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#86868B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/[0.03] text-[#86868B]">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-[#1D1D1F]">No hay sedes registradas</p>
                      <p className="text-xs text-[#86868B] max-w-xs leading-relaxed">Agrega las direcciones de tus consultorios o establecimientos para que los clientes elijan su sede preferida.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-black/[0.015] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007AFF]/10 text-[#007AFF]">
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-[#1D1D1F] leading-snug">{loc.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-[#86868B] max-w-xs truncate">
                      {loc.address}
                    </td>

                    <td className="px-6 py-4 text-[#1D1D1F] font-medium">
                      {loc.phone || <span className="text-[#86868B] font-normal">No registrado</span>}
                    </td>

                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEdit(loc)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#86868B] hover:text-[#007AFF] hover:bg-[#007AFF]/10 active:scale-95 transition-all cursor-pointer"
                        title="Editar dirección y detalles"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setIsDeleteConfirmOpen(loc.id)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 active:scale-95 transition-all cursor-pointer"
                        title="Eliminar sede"
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

      {/* CREATE LOCATION MODAL (Apple Design System Inset Grouped Cards) */}
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
                  Registrar Sede / Sucursal
                </h3>
                <p className="mt-0.5 text-xs text-[#86868B] font-medium">
                  Ingresa los datos de ubicación de la nueva sucursal.
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

                {/* CARD 1: DATOS DE LA SEDE */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Información del Establecimiento
                  </p>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Nombre de la Sede <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Consultorio Principal, Sede Médica Norte"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Dirección Física <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Av. Insurgentes Sur #450, Piso 3, Consultorio 302"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. +52 55 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                  {pending ? "Guardando..." : "Registrar Sede"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LOCATION MODAL (Apple Design System Inset Grouped Cards) */}
      {selectedLocation && (
        <div 
          onClick={() => setSelectedLocation(null)}
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
                  Editar Sede / Sucursal
                </h3>
                <p className="mt-0.5 text-xs text-[#86868B] font-medium">
                  Modifica los datos de la sucursal seleccionada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLocation(null)}
                className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                {formError && (
                  <div className="rounded-2xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 px-4 py-2.5 text-xs font-semibold text-[#FF3B30]">
                    {formError}
                  </div>
                )}

                {/* CARD 1: DATOS DE LA SEDE */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Información del Establecimiento
                  </p>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Nombre de la Sede <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Consultorio Principal, Sede Médica Norte"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Dirección Física <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Av. Insurgentes Sur #450, Piso 3, Consultorio 302"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. +52 55 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. STICKY FOOTER */}
              <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-row gap-3 justify-end">
                <button
                  onClick={() => setSelectedLocation(null)}
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
                ¿Eliminar sede / sucursal?
              </h4>
              <p className="mt-1.5 text-xs text-[#86868B] leading-relaxed font-normal">
                Esta acción eliminará de forma permanente la sede seleccionada, removiendo esta opción del portal público de reservas.
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
                {pending ? "Eliminando..." : "Eliminar Sede"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* UPGRADE PLAN MODAL */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        featureName="Multi-sede"
        description="El plan gratuito permite registrar únicamente 1 sede o consultorio. Actualiza tu suscripción a PRO para poder registrar sedes y sucursales ilimitadas."
      />
    </div>
  );
}

