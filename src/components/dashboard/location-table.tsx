"use client";

import { useState, useTransition } from "react";
import {
  createLocation,
  updateLocation,
  deleteLocation,
  type LocationDTO,
} from "@/actions/sedes";

type Props = {
  initialLocations: LocationDTO[];
};

export function LocationTable({ initialLocations }: Props) {
  const [locationList, setLocationList] = useState<LocationDTO[]>(initialLocations);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
      {/* Search & Actions Header (Refractive Card) */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border border-white/20 bg-white/80 p-5 rounded-3xl shadow-md shadow-slate-100/50 dark:border-white/5 dark:bg-slate-900/80 dark:shadow-none backdrop-blur-xl transition-all duration-300">
        
        {/* Search Input (Precision Input) */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
          />
          <svg className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Add Location Button (Blue Glass capsule button) */}
        <button
          onClick={openCreate}
          type="button"
          className="rounded-full bg-[#1A73E8] px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Agregar Sede / Sucursal</span>
        </button>
      </div>

      {/* Datatable (Accentuated container background to stand out from background glows) */}
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-lg shadow-slate-100/50 dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-xl transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-405 dark:border-slate-800/40 dark:bg-slate-950/20 dark:text-slate-500 font-heading">
                <th className="px-6 py-4">Sede / Sucursal</th>
                <th className="px-6 py-4">Dirección</th>
                <th className="px-6 py-4">Teléfono de Contacto</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-850/60 text-xs">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-450 dark:text-slate-550">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="font-bold font-heading">No hay sedes registradas</p>
                      <p className="text-[10px] font-semibold max-w-xs leading-relaxed">Agrega las direcciones de tus consultorios o establecimientos para que los clientes elijan su sede preferida.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 overflow-hidden border border-indigo-100/40 dark:border-indigo-900/30 shadow-inner">
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-150 leading-tight font-heading">{loc.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4.5 font-semibold text-slate-600 dark:text-slate-355 max-w-xs truncate font-sans">
                      {loc.address}
                    </td>

                    <td className="px-6 py-4.5 font-bold text-slate-700 dark:text-slate-300 font-sans">
                      {loc.phone || <span className="text-slate-350 dark:text-slate-600 italic font-medium">No registrado</span>}
                    </td>

                    <td className="px-6 py-4.5 text-right space-x-2.5 whitespace-nowrap">
                      {/* Edit Button (Outlined circle, no black borders) */}
                      <button
                        onClick={() => openEdit(loc)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/40 text-slate-500 hover:bg-[#1A73E8] hover:text-white hover:border-[#1A73E8] dark:border-slate-800 dark:bg-slate-955/30 dark:text-slate-400 dark:hover:bg-[#1A73E8] dark:hover:text-white dark:hover:border-[#1A73E8] transition-all cursor-pointer"
                        title="Editar dirección y detalles"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button (Outlined circle, no black borders) */}
                      <button
                        onClick={() => setIsDeleteConfirmOpen(loc.id)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/40 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-slate-800 dark:bg-slate-955/30 dark:text-slate-400 dark:hover:bg-red-955/20 dark:hover:text-red-400 dark:hover:border-red-900/30 transition-all cursor-pointer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.1425A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* CREATE LOCATION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md">
          <form onSubmit={handleCreate} className="w-full max-w-md overflow-hidden border border-white/20 bg-white/95 p-8 shadow-xl dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] animate-scale-up space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150 font-heading">
                Registrar Sede / Sucursal
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-450 dark:text-slate-550">
                Ingresa los datos de ubicación de la nueva sucursal.
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
                  Nombre de la Sede *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sede Norte, Consultorio Central"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                  Dirección Física *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Av. Principal #123, Colonia Centro"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  placeholder="Ej. +52 55 1234 5678"
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
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-905 dark:text-slate-400 dark:hover:bg-slate-900 cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={pending}
                type="submit"
                className="rounded-full bg-[#1A73E8] px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Guardando..." : "Registrar Sede"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT LOCATION MODAL */}
      {selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md">
          <form onSubmit={handleUpdate} className="w-full max-w-md overflow-hidden border border-white/20 bg-white/95 p-8 shadow-xl dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] animate-scale-up space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150 font-heading">
                Editar Sede / Sucursal
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-455 dark:text-slate-500">
                Modifica los datos de la sucursal seleccionada.
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
                  Nombre de la Sede *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sede Norte, Consultorio Central"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                  Dirección Física *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Av. Principal #123, Colonia Centro"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-350 font-heading">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  placeholder="Ej. +52 55 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedLocation(null)}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-905 dark:text-slate-400 dark:hover:bg-slate-900 cursor-pointer transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/30 p-4 backdrop-blur-md">
          <div className="w-full max-w-md border border-white/20 bg-white/95 p-8 shadow-xl dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] animate-scale-up">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-150 font-heading">
              ¿Eliminar sede / sucursal?
            </h4>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold font-sans">
              Esta acción eliminará de forma permanente la sede seleccionada, removiendo esta opción del portal público de reservas.
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
                {pending ? "Eliminando..." : "Eliminar Sede"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
