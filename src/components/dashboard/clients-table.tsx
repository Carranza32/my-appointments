"use client";

import { useState, useTransition } from "react";
import {
  createClient,
  updateClient,
  deleteClient,
  type ClientDTO,
} from "@/actions/clients";
import {
  getClientCRMDetails,
  createClinicalRecord,
  deleteClinicalRecord,
  updateAppointmentPayment,
} from "@/actions/crm";

type Props = {
  initialClients: ClientDTO[];
};

export function ClientsTable({ initialClients }: Props) {
  const [clients, setClients] = useState<ClientDTO[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDTO | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // CRM details states
  const [historyClient, setHistoryClient] = useState<ClientDTO | null>(null);
  const [crmDetails, setCrmDetails] = useState<any | null>(null);
  const [crmTab, setCrmTab] = useState<"history" | "clinical">("history");
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Clinical record form states
  const [recordTitle, setRecordTitle] = useState("");
  const [recordType, setRecordType] = useState("EVOLUCION");
  const [recordContent, setRecordContent] = useState("");
  const [recordAttachmentUrl, setRecordAttachmentUrl] = useState("");
  const [recordError, setRecordError] = useState<string | null>(null);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();

  // Search filter
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const openCreate = () => {
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEdit = (client: ClientDTO) => {
    setSelectedClient(client);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone);
    setNotes(client.notes || "");
    setFormError(null);
  };

  const openHistory = (client: ClientDTO) => {
    setHistoryClient(client);
    setLoadingHistory(true);
    setCrmDetails(null);
    setCrmTab("history");
    startTransition(async () => {
      const details = await getClientCRMDetails(client.id);
      setCrmDetails(details);
      setLoadingHistory(false);
    });
  };

  const handleAddClinicalRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyClient) return;
    setRecordError(null);

    startTransition(async () => {
      const res = await createClinicalRecord(historyClient.id, {
        title: recordTitle,
        type: recordType,
        content: recordContent,
        attachments: recordAttachmentUrl ? [recordAttachmentUrl] : [],
      });

      if (res.error) {
        setRecordError(res.error);
      } else {
        setRecordTitle("");
        setRecordContent("");
        setRecordAttachmentUrl("");
        setIsAddRecordOpen(false);
        const details = await getClientCRMDetails(historyClient.id);
        setCrmDetails(details);
      }
    });
  };

  const handleDeleteClinicalRecord = (recordId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta ficha clínica?")) return;
    startTransition(async () => {
      const res = await deleteClinicalRecord(recordId);
      if (res.error) {
        alert(res.error);
      } else if (historyClient) {
        const details = await getClientCRMDetails(historyClient.id);
        setCrmDetails(details);
      }
    });
  };

  const togglePaymentStatus = async (appId: string, currentStatus: string, price: number) => {
    const nextStatus = currentStatus === "PAGADO" ? "PENDIENTE" : "PAGADO";
    const nextPrice = currentStatus === "PAGADO" ? 0 : (price || 50);
    let finalPrice = nextPrice;

    if (nextStatus === "PAGADO" && price === 0) {
      const val = prompt("Ingresa el monto cobrado para esta cita ($):", "50");
      if (val === null) return;
      const parsed = parseFloat(val);
      finalPrice = isNaN(parsed) ? 0 : parsed;
    }

    startTransition(async () => {
      const res = await updateAppointmentPayment(appId, {
        paymentStatus: nextStatus,
        price: finalPrice,
      });
      if (res.error) {
        alert(res.error);
      } else if (historyClient) {
        const details = await getClientCRMDetails(historyClient.id);
        setCrmDetails(details);
      }
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await createClient({ name, email, phone, notes });
      if ("error" in res) {
        setFormError(res.error || "Ocurrió un error al registrar el cliente.");
      } else {
        setIsCreateOpen(false);
        // Refresh local list dynamically
        const newClient: ClientDTO = {
          id: res.clientId || Math.random().toString(),
          name,
          email,
          phone,
          notes: notes || null,
          createdAt: new Date().toISOString(),
        };
        setClients((prev) => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
      }
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setFormError(null);

    startTransition(async () => {
      const res = await updateClient(selectedClient.id, { name, email, phone, notes });
      if ("error" in res) {
        setFormError(res.error || "Ocurrió un error al modificar el cliente.");
      } else {
        setSelectedClient(null);
        setClients((prev) =>
          prev
            .map((c) =>
              c.id === selectedClient.id
                ? { ...c, name, email, phone, notes: notes || null }
                : c
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const res = await deleteClient(id);
      if ("error" in res) {
        alert(res.error || "Ocurrió un error al eliminar el cliente.");
      } else {
        setIsDeleteConfirmOpen(null);
        setClients((prev) => prev.filter((c) => c.id !== id));
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
            placeholder="Buscar por nombre, correo o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-10 pr-4 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] transition-all shadow-xs"
          />
          <svg
            className="absolute left-3.5 top-4 h-4.5 w-4.5 text-slate-450 dark:text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Add Button (Blue Glass Button) */}
        <button
          onClick={openCreate}
          type="button"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1A73E8] px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] hover:shadow-lg active:scale-98 transition-all cursor-pointer select-none"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.8">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Agregar Cliente</span>
        </button>
      </div>

      {/* Datatable Card (Refractive Card container) */}
      <div className="bg-white/90 border border-slate-200 rounded-[32px] dark:bg-slate-900/90 dark:border-slate-800 shadow-lg shadow-slate-100/50 dark:shadow-none w-full overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100/50 bg-slate-50/20 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800/20 dark:bg-slate-950/10 dark:text-slate-500 select-none">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Correo Electrónico</th>
                <th className="px-6 py-4">Teléfono Móvil</th>
                <th className="px-6 py-4">Notas</th>
                <th className="px-6 py-4">Fecha de Registro</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/20 text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-450 dark:text-slate-555 select-none">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <svg className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="font-bold">No se encontraron clientes</p>
                      <p className="text-[10px] max-w-xs leading-relaxed text-slate-400">Comienza agregando un cliente manualmente o mediante una nueva reserva en tu portal de citas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/20 dark:hover:bg-slate-950/10 transition-colors"
                  >
                    {/* Client Name Profile */}
                    <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-100 font-heading">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-xs">
                          {client.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <span>{client.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4.5 font-semibold text-slate-500 dark:text-slate-400">
                      {client.email}
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4.5 font-bold text-slate-700 dark:text-slate-350">
                      {client.phone}
                    </td>

                    {/* Notes */}
                    <td className="px-6 py-4.5 max-w-[200px] truncate text-slate-500 dark:text-slate-400 font-semibold">
                      {client.notes || <span className="text-slate-300 dark:text-slate-700 italic">Sin observaciones</span>}
                    </td>

                    {/* Registration Date */}
                    <td className="px-6 py-4.5 text-slate-450 dark:text-slate-500 font-semibold">
                      {new Date(client.createdAt).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions (Outlined Circle Action Buttons) */}
                    <td className="px-6 py-4.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* History Button */}
                      <button
                        onClick={() => openHistory(client)}
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/50 text-slate-600 hover:bg-[#1A73E8] hover:text-white dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:bg-[#1A73E8] dark:hover:text-white transition-all cursor-pointer"
                        title="Ver historial de citas"
                      >
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEdit(client)}
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/50 text-slate-600 hover:bg-[#1A73E8] hover:text-white dark:border-slate-800 dark:bg-slate-955/50 dark:text-slate-400 dark:hover:bg-[#1A73E8] dark:hover:text-white transition-all cursor-pointer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setIsDeleteConfirmOpen(client.id)}
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/50 text-slate-600 hover:bg-red-50 hover:text-white dark:border-slate-800 dark:bg-slate-955/50 dark:text-slate-400 dark:hover:bg-red-500 dark:hover:text-white transition-all cursor-pointer"
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
          {/* CREATE CLIENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg overflow-hidden border border-white/20 bg-white/95 p-8 shadow-xl dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] animate-fade-in"
          >
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150 font-heading">
              Registrar Nuevo Cliente
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-450 dark:text-slate-500">
              Ingresa los datos del contacto
            </p>

            {formError && (
              <div className="mt-4 rounded-2xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-xs font-bold text-red-750 dark:border-red-900/30 dark:bg-red-955/20 dark:text-red-400 backdrop-blur-xs animate-pulse">
                {formError}
              </div>
            )}

            <div className="mt-6 space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-550 dark:text-slate-400">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-550 dark:text-slate-400">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-555 dark:text-slate-400">
                    Teléfono Móvil *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="55790854"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-555 dark:text-slate-400">
                  Notas u Observaciones (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles adicionales, recordatorios o preferencias..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-3">
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
                {pending ? "Guardando..." : "Registrar Cliente"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/30 p-4 backdrop-blur-md">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-lg overflow-hidden border border-white/20 bg-white/95 p-8 shadow-xl dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] animate-fade-in"
          >
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150 font-heading">
              Modificar Ficha de Cliente
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-450 dark:text-slate-500">
              Edita el contacto registrado
            </p>

            {formError && (
              <div className="mt-4 rounded-2xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-xs font-bold text-red-750 dark:border-red-900/30 dark:bg-red-955/20 dark:text-red-400 backdrop-blur-xs animate-pulse">
                {formError}
              </div>
            )}

            <div className="mt-6 space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-555 dark:text-slate-400">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-555 dark:text-slate-400">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-555 dark:text-slate-400">
                    Teléfono Móvil *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="55790854"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-555 dark:text-slate-400">
                  Notas u Observaciones (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles adicionales, recordatorios o preferencias..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setSelectedClient(null)}
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
              ¿Eliminar ficha de cliente?
            </h4>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Esta acción no puede deshacerse. El registro se eliminará permanentemente de tu base de datos de contactos.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(null)}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={pending}
                onClick={() => handleDelete(isDeleteConfirmOpen)}
                className="rounded-full bg-red-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-red-500/10 hover:bg-red-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Eliminando..." : "Eliminar Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT CRM & CLINICAL RECORDS PORTAL */}
      {historyClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md">
          <div className="w-full max-w-4xl overflow-hidden border border-white/20 bg-white/95 p-8 shadow-xl dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200/40 dark:border-slate-800/60 pb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150 font-heading">
                  Expediente y CRM de Cliente
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-450 dark:text-slate-500">
                  {historyClient.name} · {historyClient.email} · {historyClient.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryClient(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/40 text-slate-500 hover:bg-[#1A73E8] hover:text-white dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400 dark:hover:bg-[#1A73E8] dark:hover:text-white transition-all cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200/40 dark:border-slate-800/60 mt-6">
              <button
                onClick={() => setCrmTab("history")}
                className={`py-3 px-5 border-b-2 text-xs font-bold transition-all cursor-pointer font-heading ${
                  crmTab === "history"
                    ? "border-[#1A73E8] text-[#1A73E8]"
                    : "border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Historial y Pagos
              </button>
              <button
                onClick={() => setCrmTab("clinical")}
                className={`py-3 px-5 border-b-2 text-xs font-bold transition-all cursor-pointer font-heading ${
                  crmTab === "clinical"
                    ? "border-[#1A73E8] text-[#1A73E8]"
                    : "border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Expediente Clínico / Notas
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-6 pr-1 min-h-[350px]">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-450 dark:text-slate-550">
                  <svg className="h-7 w-7 animate-spin text-[#1A73E8] mb-2.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando expediente del cliente...</p>
                </div>
              ) : !crmDetails ? (
                <div className="text-center py-20 text-slate-400">
                  No se pudo cargar el expediente.
                </div>
              ) : (
                <>
                  {/* TAB 1: HISTORY & PAYMENTS */}
                  {crmTab === "history" && (
                    <div className="space-y-6 animate-fade-in">
                      {/* CRM Metrics Grid (Luminous Glassmorphism Refractive Cards) */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-5 rounded-[24px] border border-white/20 bg-white/40 shadow-xs dark:bg-slate-900/20 dark:border-white/5 backdrop-blur-md">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">Total Reservas</p>
                          <p className="mt-1.5 text-2xl font-bold text-slate-800 dark:text-slate-100 font-heading">{crmDetails.metrics.totalBooked}</p>
                        </div>
                        <div className="p-5 rounded-[24px] border border-white/20 bg-white/40 shadow-xs dark:bg-slate-900/20 dark:border-white/5 backdrop-blur-md">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">Asistencias</p>
                          <p className="mt-1.5 text-2xl font-bold text-slate-800 dark:text-slate-100 font-heading">
                            {crmDetails.metrics.totalAttended} <span className="text-xs font-semibold text-slate-450 dark:text-slate-550">({crmDetails.metrics.attendanceRate}%)</span>
                          </p>
                        </div>
                        <div className="p-5 rounded-[24px] border border-white/20 bg-white/40 shadow-xs dark:bg-slate-900/20 dark:border-white/5 backdrop-blur-md">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">Facturación Cobrada</p>
                          <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-heading">${crmDetails.metrics.totalPaid}</p>
                        </div>
                        <div className="p-5 rounded-[24px] border border-white/20 bg-white/40 shadow-xs dark:bg-slate-900/20 dark:border-white/5 backdrop-blur-md">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">Servicio Favorito</p>
                          <p className="mt-1.5 text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-full leading-tight h-5 flex items-center">
                            {crmDetails.metrics.favoriteService}
                          </p>
                        </div>
                      </div>

                      {/* Appointment List */}
                      <div className="mt-8">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 font-heading">
                          Bitácora de Citas y Pagos
                        </h4>

                        {crmDetails.appointments.length === 0 ? (
                           <p className="text-xs text-slate-500 dark:text-slate-450 text-center py-8">
                            No hay citas registradas para este cliente.
                          </p>
                        ) : (
                          <div className="space-y-3.5">
                            {crmDetails.appointments.map((app: any) => {
                              const start = new Date(app.startTime);
                              const end = new Date(app.endTime);
                              const formattedDate = start.toLocaleDateString("es-ES", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              });
                              const timeStr = `${start.toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })} - ${end.toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}`;

                              let badgeColor = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30";
                              let label = "Pendiente";
                              if (app.status === "CONFIRMADA") {
                                badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30";
                                label = "Confirmada";
                              } else if (app.status === "CANCELADA") {
                                badgeColor = "bg-red-50 text-red-700 border-red-200 dark:bg-red-955/30 dark:text-red-400 dark:border-red-900/30";
                                label = "Cancelada";
                              }

                              const isPaid = app.paymentStatus === "PAGADO";

                              return (
                                <div
                                  key={app.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[24px] border border-white/20 bg-white/30 dark:border-white/5 dark:bg-slate-900/20 hover:bg-white/50 dark:hover:bg-slate-900/30 transition-all shadow-xs"
                                >
                                  {/* Appointment Info */}
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-150 capitalize font-heading">
                                        {formattedDate}
                                      </p>
                                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                                        {label}
                                      </span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                      ⏱️ {timeStr} hs
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-450 font-semibold">
                                      {app.serviceName && (
                                        <span>⚙️ Servicio: <strong className="text-slate-700 dark:text-slate-300">{app.serviceName}</strong></span>
                                      )}
                                      {app.locationName && (
                                        <span>📍 Sede: <strong className="text-slate-700 dark:text-slate-300">{app.locationName}</strong></span>
                                      )}
                                      {app.staffName && (
                                        <span>👤 Especialista: <strong className="text-slate-700 dark:text-slate-300">{app.staffName}</strong></span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Pricing and Invoicing actions */}
                                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-200/50 pt-2.5 sm:pt-0 shrink-0">
                                    <div className="text-right">
                                      <p className="text-xs font-bold text-slate-850 dark:text-slate-100 font-heading">
                                        ${app.price || 0}
                                      </p>
                                      
                                      {/* Payment State capsule inspired by System States mockup */}
                                      {isPaid ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50/50 border border-blue-200/50 px-2 py-0.5 text-[8px] font-bold text-[#1A73E8] dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400">
                                          <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#1A73E8] text-white text-[6px] font-black">✓</span>
                                          PAGADO
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/50 border border-amber-200/50 px-2 py-0.5 text-[8px] font-bold text-amber-600 dark:bg-amber-955/20 dark:border-amber-900/30 dark:text-amber-400">
                                          <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-500 text-white text-[6px] font-black animate-pulse">…</span>
                                          PENDIENTE
                                        </span>
                                      )}
                                    </div>

                                    {/* Action button */}
                                    <button
                                      onClick={() => togglePaymentStatus(app.id, app.paymentStatus, app.price)}
                                      disabled={pending}
                                      type="button"
                                      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                                        isPaid
                                          ? "bg-white/60 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-950/40 dark:hover:text-red-450"
                                          : "bg-[#1A73E8] border-transparent text-white hover:bg-[#005bbf] shadow-xs"
                                      }`}
                                    >
                                      {isPaid ? "Desmarcar Pago" : "Registrar Pago"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {crmTab === "clinical" && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Action Header */}
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 font-heading">
                          Expediente de Sesiones y Consentimientos
                        </h4>
                        <button
                          onClick={() => {
                            setRecordTitle("");
                            setRecordContent("");
                            setRecordAttachmentUrl("");
                            setRecordError(null);
                            setIsAddRecordOpen(!isAddRecordOpen);
                          }}
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 transition-all cursor-pointer shadow-xs"
                        >
                          {isAddRecordOpen ? "Cancelar" : "+ Nueva Ficha"}
                        </button>
                      </div>

                      {/* Form inline to add a clinical record */}
                      {isAddRecordOpen && (
                        <form onSubmit={handleAddClinicalRecord} className="p-6 rounded-[24px] border border-white/20 bg-white/40 dark:border-white/5 dark:bg-slate-900/20 space-y-4 animate-fade-in backdrop-blur-md">
                          <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-heading">
                            Nueva Entrada Médica / Estética
                          </h5>

                          {recordError && (
                            <div className="rounded-2xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-xs font-bold text-red-750 dark:border-red-900/30 dark:bg-red-955/20 dark:text-red-300">
                              {recordError}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <label className="mb-1.5 block text-xs font-semibold text-slate-550 dark:text-slate-400">
                                Título del Registro *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. Control de evolución, Sesión láser"
                                value={recordTitle}
                                onChange={(e) => setRecordTitle(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-slate-555 dark:text-slate-400">
                                Tipo de Ficha
                              </label>
                              <select
                                value={recordType}
                                onChange={(e) => setRecordType(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-850 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs cursor-pointer"
                              >
                                <option value="EVOLUCION" className="bg-white dark:bg-slate-900">Evolución</option>
                                <option value="NOTA" className="bg-white dark:bg-slate-900">Nota de Sesión</option>
                                <option value="CONSENTIMIENTO" className="bg-white dark:bg-slate-900">Consentimiento</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-555 dark:text-slate-400">
                              Notas Clínicas y Diagnóstico *
                            </label>
                            <textarea
                              rows={4}
                              required
                              placeholder="Describe la evolución, procedimientos realizados, observaciones del paciente, consentimiento obtenido..."
                              value={recordContent}
                              onChange={(e) => setRecordContent(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs resize-none"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-555 dark:text-slate-400">
                              URL del Adjunto / Consentimiento Firmado (Opcional)
                            </label>
                            <input
                              type="url"
                              placeholder="https://bucket.com/documento.pdf"
                              value={recordAttachmentUrl}
                              onChange={(e) => setRecordAttachmentUrl(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/80 dark:text-slate-100 focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-xs"
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => setIsAddRecordOpen(false)}
                              type="button"
                              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 cursor-pointer transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              disabled={pending}
                              type="submit"
                              className="rounded-full bg-[#1A73E8] px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {pending ? "Guardando..." : "Guardar Ficha"}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Timeline */}
                      <div className="space-y-4">
                        {crmDetails.clinicalRecords.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500 gap-2 border border-dashed border-slate-200/60 dark:border-slate-800/60 rounded-[24px] p-6">
                            <svg className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-xs font-bold">No hay fichas clínicas en este expediente.</p>
                            <p className="text-[10px] text-slate-450 max-w-xs text-center leading-relaxed">Crea notas de evolución y consentimientos firmados para llevar un registro profesional de tus sesiones.</p>
                          </div>
                        ) : (
                          <div className="relative border-l-2 border-slate-200/60 dark:border-slate-800/60 pl-6 ml-3 space-y-6">
                            {crmDetails.clinicalRecords.map((record: any) => {
                              const dateStr = new Date(record.createdAt).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              });

                              let colorTheme = "bg-blue-50/50 border border-blue-200/50 text-[#1A73E8] dark:bg-blue-955/20 dark:border-blue-900/30 dark:text-blue-400";
                              let typeLabel = "Evolución";
                              if (record.type === "NOTA") {
                                colorTheme = "bg-slate-50/50 border border-slate-200/50 text-slate-500 dark:bg-slate-900/20 dark:border-slate-800/30 dark:text-slate-400";
                                typeLabel = "Nota de Sesión";
                              } else if (record.type === "CONSENTIMIENTO") {
                                colorTheme = "bg-emerald-50/50 border border-emerald-200/50 text-emerald-750 dark:bg-emerald-955/20 dark:border-emerald-900/30 dark:text-emerald-400";
                                typeLabel = "Consentimiento";
                              }

                              return (
                                <div key={record.id} className="relative group">
                                  {/* Circle indicator */}
                                  <div className="absolute -left-[31px] top-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-350 dark:border-slate-900 group-hover:bg-[#1A73E8] transition-all shadow-xs" />

                                  <div className="p-5 rounded-[24px] border border-white/20 bg-white/40 dark:border-white/5 dark:bg-slate-900/20 hover:bg-white/50 dark:hover:bg-slate-900/30 hover:shadow-xs transition-all space-y-3 shadow-xs">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h5 className="font-bold text-sm text-slate-850 dark:text-slate-150 font-heading">
                                            {record.title}
                                          </h5>
                                          <span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider ${colorTheme}`}>
                                            {typeLabel}
                                          </span>
                                        </div>
                                        <p className="text-[10px] font-semibold text-slate-405 dark:text-slate-500 mt-1">
                                          📅 {dateStr}
                                        </p>
                                      </div>
                                      
                                      <button
                                        onClick={() => handleDeleteClinicalRecord(record.id)}
                                        disabled={pending}
                                        type="button"
                                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar registro"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>

                                    {/* Record Notes text */}
                                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold whitespace-pre-wrap font-sans">
                                      {record.content}
                                    </p>

                                    {/* Attachments links list */}
                                    {record.attachments && record.attachments.length > 0 && (
                                      <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-3 flex items-center gap-1.5 text-[10px] font-bold text-[#1A73E8] dark:text-blue-400 font-heading">
                                        <span>📎 Adjunto:</span>
                                        {record.attachments.map((link: string, i: number) => (
                                          <a
                                            key={i}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline break-all truncate max-w-[250px] hover:text-[#005bbf]"
                                          >
                                            {link.substring(link.lastIndexOf("/") + 1) || "Ver Documento"}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200/40 dark:border-slate-800/60 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryClient(null)}
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-350 dark:hover:bg-slate-800 cursor-pointer transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







