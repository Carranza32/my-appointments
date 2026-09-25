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

import { getLabels } from "@/lib/labels";
import { getRubroConfig } from "@/lib/rubros";
import { X } from "lucide-react";

type Props = {
  initialClients: ClientDTO[];
  rubro: string;
};

export function ClientsTable({ initialClients, rubro }: Props) {
  const [clients, setClients] = useState<ClientDTO[]>(initialClients);
  const labels = getLabels(rubro);
  const rubroConfig = getRubroConfig(rubro);
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

  // AI assistant states
  const [isGeneratingAiNote, setIsGeneratingAiNote] = useState(false);

  const handleGenerateSoapNote = async () => {
    const textToProcess = recordContent.trim();
    if (!textToProcess || textToProcess.length < 5) {
      alert("Por favor escribe primero algunas notas u observaciones en el campo para que la IA las estructure en formato SOAP.");
      return;
    }
    setIsGeneratingAiNote(true);
    try {
      const response = await fetch("/api/ai/clinical-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: textToProcess }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al conectar con el asistente de IA.");
      }
      setRecordContent(data.formattedNote);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al estructurar la nota con IA.");
    } finally {
      setIsGeneratingAiNote(false);
    }
  };

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

    const titleToSave = recordTitle;
    const typeToSave = recordType;
    const contentToSave = recordContent;
    const attachmentsToSave = recordAttachmentUrl ? [recordAttachmentUrl] : [];

    startTransition(async () => {
      const res = await createClinicalRecord(historyClient.id, {
        title: titleToSave,
        type: typeToSave,
        content: contentToSave,
        attachments: attachmentsToSave,
      });

      if (res.error) {
        setRecordError(res.error);
      } else {
        const optimisticRecord = {
          id: res.recordId || String(Date.now()),
          title: titleToSave,
          type: typeToSave,
          content: contentToSave,
          attachments: attachmentsToSave.length > 0 ? attachmentsToSave : null,
          createdAt: new Date().toISOString(),
        };

        // Instant optimistic update so it appears immediately without switching tabs
        setCrmDetails((prev: any) =>
          prev
            ? {
                ...prev,
                clinicalRecords: [optimisticRecord, ...prev.clinicalRecords],
              }
            : null
        );

        setRecordTitle("");
        setRecordContent("");
        setRecordAttachmentUrl("");
        setIsAddRecordOpen(false);

        const details = await getClientCRMDetails(historyClient.id);
        if (details) {
          setCrmDetails(details);
        }
      }
    });
  };

  const handleDeleteClinicalRecord = (recordId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta ficha clínica?")) return;

    // Instant optimistic removal
    setCrmDetails((prev: any) =>
      prev
        ? {
            ...prev,
            clinicalRecords: prev.clinicalRecords.filter((r: any) => r.id !== recordId),
          }
        : null
    );

    startTransition(async () => {
      const res = await deleteClinicalRecord(recordId);
      if (res.error) {
        alert(res.error);
      } else if (historyClient) {
        const details = await getClientCRMDetails(historyClient.id);
        if (details) {
          setCrmDetails(details);
        }
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
      
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border border-black/[0.06] bg-white/80 backdrop-blur-2xl p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-black/[0.08] bg-white py-2 pl-9 pr-4 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all placeholder-[#86868B] shadow-xs"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-[#86868B]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Add Button */}
        <button
          onClick={openCreate}
          type="button"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Agregar {labels.client}</span>
        </button>
      </div>

      {/* Datatable Card */}
      <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E5E5EA]/60 bg-[#F5F5F7]/50 text-[11px] font-semibold uppercase tracking-wider text-[#86868B] select-none">
                <th className="px-5 py-3.5">{labels.client}</th>
                <th className="px-5 py-3.5">Correo Electrónico</th>
                <th className="px-5 py-3.5">Teléfono Móvil</th>
                <th className="px-5 py-3.5">Notas</th>
                <th className="px-5 py-3.5">Fecha de Registro</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]/50 text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#86868B] select-none">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="h-8 w-8 text-[#86868B]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="font-semibold text-sm text-[#1D1D1F]">No se encontraron {labels.clients.toLowerCase()}</p>
                      <p className="text-xs max-w-xs leading-relaxed text-[#86868B]">Comienza agregando un {labels.client.toLowerCase()} manualmente o mediante una nueva reserva en tu portal.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-[#F5F5F7]/50 transition-colors"
                  >
                    {/* Client Name Profile */}
                    <td className="px-5 py-3.5 font-semibold text-[#1D1D1F] font-heading">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007AFF]/10 text-[10px] font-bold text-[#007AFF] shadow-xs">
                          {client.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <span>{client.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 font-medium text-[#86868B]">
                      {client.email}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3.5 font-semibold text-[#1D1D1F]">
                      {client.phone}
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-3.5 max-w-[200px] truncate text-[#86868B] font-normal">
                      {client.notes || <span className="text-[#86868B]/50 italic">Sin observaciones</span>}
                    </td>

                    {/* Registration Date */}
                    <td className="px-5 py-3.5 text-[#86868B] font-medium">
                      {new Date(client.createdAt).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* History Button */}
                      <button
                        onClick={() => openHistory(client)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#86868B] hover:bg-[#007AFF] hover:text-white hover:border-[#007AFF] active:scale-[0.95] transition-all cursor-pointer shadow-xs"
                        title="Ver historial y expediente"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEdit(client)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#86868B] hover:bg-[#007AFF] hover:text-white hover:border-[#007AFF] active:scale-[0.95] transition-all cursor-pointer shadow-xs"
                        title="Editar datos"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setIsDeleteConfirmOpen(client.id)}
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#86868B] hover:bg-[#FF3B30] hover:text-white hover:border-[#FF3B30] active:scale-[0.95] transition-all cursor-pointer shadow-xs"
                        title="Eliminar cliente"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
          {/* CREATE CLIENT MODAL (Apple Design System Inset Grouped Cards) */}
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
                  Registrar {labels.client}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-[#86868B]">
                  Ingresa los datos de contacto de tu {labels.client.toLowerCase()}
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                type="button"
                className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                {formError && (
                  <div className="rounded-2xl border border-red-200/60 bg-red-50/80 p-3.5 text-xs font-semibold text-[#FF3B30]">
                    {formError}
                  </div>
                )}

                {/* CARD 1: INFORMACIÓN PERSONAL */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Datos de Contacto
                  </p>

                  {/* Name */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Nombre Completo <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Mendoza"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Correo Electrónico <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="carlos@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Teléfono Móvil <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="55790854"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 2: OBSERVACIONES */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Observaciones y Preferencias
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Notas u Observaciones (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Detalles adicionales, recordatorios o preferencias..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs resize-none"
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
                  className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl bg-[#007AFF] py-2.5 px-6 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] hover:bg-[#0062CC] active:scale-[0.98] transition-all disabled:opacity-50 text-center cursor-pointer"
                >
                  {pending ? "Guardando..." : `Registrar ${labels.client}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT MODAL (Apple Design System Inset Grouped Cards) */}
      {selectedClient && (
        <div 
          onClick={() => setSelectedClient(null)}
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
                  Modificar datos de {labels.client}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-[#86868B]">
                  Edita la información de tu {labels.client.toLowerCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                type="button"
                className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                {formError && (
                  <div className="rounded-2xl border border-red-200/60 bg-red-50/80 p-3.5 text-xs font-semibold text-[#FF3B30]">
                    {formError}
                  </div>
                )}

                {/* CARD 1: INFORMACIÓN PERSONAL */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Datos de Contacto
                  </p>

                  {/* Name */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Nombre Completo <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Mendoza"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Correo Electrónico <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="carlos@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Teléfono Móvil <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="55790854"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 2: OBSERVACIONES */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Observaciones y Preferencias
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Notas u Observaciones (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Detalles adicionales, recordatorios o preferencias..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. STICKY FOOTER */}
              <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-row gap-3 justify-end">
                <button
                  onClick={() => setSelectedClient(null)}
                  type="button"
                  className="flex-1 sm:flex-none sm:min-w-[120px] rounded-xl border border-black/[0.08] bg-[#F2F2F7] py-2.5 px-5 text-xs font-semibold text-[#1D1D1F] hover:bg-[#E5E5EA] active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  disabled={pending}
                  type="submit"
                  className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl bg-[#007AFF] py-2.5 px-6 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] hover:bg-[#0062CC] active:scale-[0.98] transition-all disabled:opacity-50 text-center cursor-pointer"
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
            className="w-full max-w-md border border-black/[0.08] bg-white/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)] backdrop-blur-2xl rounded-[28px] animate-in zoom-in-95 duration-200"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF3B30]/10 text-[#FF3B30]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="mt-3.5 text-lg font-bold text-[#1D1D1F] font-heading leading-tight">
              ¿Eliminar {labels.client.toLowerCase()}?
            </h4>
            <p className="mt-1.5 text-xs text-[#86868B] leading-relaxed font-normal">
              Esta acción no puede deshacerse. Se eliminará permanentemente de tu base de datos de {labels.clients.toLowerCase()}.
            </p>
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
                className="rounded-xl bg-[#FF3B30] px-5 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(255,59,48,0.25)] hover:bg-[#D70015] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Eliminando..." : `Eliminar ${labels.client}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CLIENT CRM & CLINICAL RECORDS PORTAL (Responsive Apple Design 3-Tier Layout) */}
      {historyClient && (
        <div 
          onClick={() => setHistoryClient(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.16)] animate-in zoom-in-95 duration-200"
          >
            {/* 1. STICKY HEADER */}
            <div className="p-5 sm:p-6 pb-3.5 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] font-heading leading-tight truncate">
                    Expediente y CRM de {labels.client}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-[#86868B] truncate">
                    {historyClient.name} · {historyClient.email} · {historyClient.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryClient(null)}
                  className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0 ml-3"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tab Navigation (Apple Segmented Style) */}
              {rubroConfig.enableClinicalRecords && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setCrmTab("history")}
                    className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      crmTab === "history"
                        ? "bg-[#007AFF] text-white shadow-xs"
                        : "bg-[#F2F2F7] text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                  >
                    Historial y Pagos
                  </button>
                  <button
                    onClick={() => setCrmTab("clinical")}
                    className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      crmTab === "clinical"
                        ? "bg-[#007AFF] text-white shadow-xs"
                        : "bg-[#F2F2F7] text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                  >
                    Expediente Clínico / Notas
                  </button>
                </div>
              )}
            </div>

            {/* 2. SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 overscroll-contain space-y-4">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#86868B]">
                  <svg className="h-6 w-6 animate-spin text-[#007AFF] mb-2.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-xs font-medium text-[#86868B]">Cargando expediente de {labels.client.toLowerCase()}...</p>
                </div>
              ) : !crmDetails ? (
                <div className="text-center py-20 text-xs font-medium text-[#86868B]">
                  No se pudo cargar el expediente.
                </div>
              ) : (
                <>
                  {/* TAB 1: HISTORY & PAYMENTS */}
                  {crmTab === "history" && (
                    <div className="space-y-6 animate-fade-in">
                      {/* CRM Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl border border-black/[0.06] bg-[#F5F5F7]/80">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Total Reservas</p>
                          <p className="mt-1 text-2xl font-bold text-[#1D1D1F] tracking-tight">{crmDetails.metrics.totalBooked}</p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-black/[0.06] bg-[#F5F5F7]/80">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Asistencias</p>
                          <p className="mt-1 text-2xl font-bold text-[#1D1D1F] tracking-tight">
                            {crmDetails.metrics.totalAttended} <span className="text-xs font-medium text-[#86868B]">({crmDetails.metrics.attendanceRate}%)</span>
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-black/[0.06] bg-[#F5F5F7]/80">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Facturación Cobrada</p>
                          <p className="mt-1 text-2xl font-bold text-[#34C759] tracking-tight">${crmDetails.metrics.totalPaid}</p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-black/[0.06] bg-[#F5F5F7]/80">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Servicio Favorito</p>
                          <p className="mt-1.5 text-xs font-bold text-[#1D1D1F] truncate max-w-full leading-tight h-5 flex items-center">
                            {crmDetails.metrics.favoriteService}
                          </p>
                        </div>
                      </div>

                      {/* Appointment List */}
                      <div className="mt-6">
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-3">
                          Bitácora de {labels.appointments} y Pagos
                        </h4>

                        {crmDetails.appointments.length === 0 ? (
                           <p className="text-xs text-[#86868B] text-center py-8">
                            No hay {labels.appointments.toLowerCase()} registradas para este {labels.client.toLowerCase()}.
                          </p>
                        ) : (
                          <div className="space-y-2.5">
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

                              let badgeColor = "bg-amber-500/10 text-[#FF9500]";
                              let label = "Pendiente";
                              if (app.status === "CONFIRMADA") {
                                badgeColor = "bg-[#007AFF]/10 text-[#007AFF]";
                                label = "Confirmada";
                              } else if (app.status === "CANCELADA") {
                                badgeColor = "bg-[#86868B]/10 text-[#86868B]";
                                label = "Cancelada";
                              }

                              const isPaid = app.paymentStatus === "PAGADO";

                              return (
                                <div
                                  key={app.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-black/[0.06] bg-white hover:border-[#007AFF]/20 transition-all shadow-xs"
                                >
                                  {/* Appointment Info */}
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-[#1D1D1F] capitalize font-heading">
                                        {formattedDate}
                                      </p>
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badgeColor}`}>
                                        {label}
                                      </span>
                                    </div>
                                    <p className="text-xs font-medium text-[#86868B]">
                                      ⏱️ {timeStr} hs
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#86868B]">
                                      {app.serviceName && (
                                        <span>⚙️ Servicio: <strong className="text-[#1D1D1F] font-semibold">{app.serviceName}</strong></span>
                                      )}
                                      {app.locationName && (
                                        <span>📍 Sede: <strong className="text-[#1D1D1F] font-semibold">{app.locationName}</strong></span>
                                      )}
                                      {app.staffName && (
                                        <span>👤 Especialista: <strong className="text-[#1D1D1F] font-semibold">{app.staffName}</strong></span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Pricing and Invoicing actions */}
                                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-black/[0.04] pt-2.5 sm:pt-0 shrink-0">
                                    <div className="text-right">
                                      <p className="text-xs font-bold text-[#1D1D1F] font-heading">
                                        ${app.price || 0}
                                      </p>
                                      
                                      {isPaid ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#34C759]/10 px-2 py-0.5 text-[9px] font-semibold text-[#34C759]">
                                          <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#34C759] text-white text-[7px] font-bold">✓</span>
                                          PAGADO
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-[#FF9500]">
                                          PENDIENTE
                                        </span>
                                      )}
                                    </div>

                                    {/* Action button */}
                                    <button
                                      onClick={() => togglePaymentStatus(app.id, app.paymentStatus, app.price)}
                                      disabled={pending}
                                      type="button"
                                      className={`inline-flex items-center justify-center rounded-xl px-3.5 py-1.5 text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all ${
                                        isPaid
                                          ? "bg-[#F2F2F7] border border-black/[0.06] text-[#1D1D1F] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]"
                                          : "bg-[#007AFF] text-white hover:bg-[#0062CC] shadow-xs"
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

                  {rubroConfig.enableClinicalRecords && crmTab === "clinical" && (
                    <div className="space-y-5 animate-fade-in">
                      {/* Action Header */}
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
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
                          className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          {isAddRecordOpen ? "Cancelar" : "+ Nueva Ficha"}
                        </button>
                      </div>

                      {/* Form inline to add a clinical record */}
                      {isAddRecordOpen && (
                        <form onSubmit={handleAddClinicalRecord} className="p-5 rounded-2xl border border-black/[0.08] bg-white space-y-3.5 animate-fade-in shadow-xs">
                          <h5 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider font-heading">
                            {rubro === "PSICOLOGIA"
                              ? "Nueva Nota de Sesión / Ficha Clínica"
                              : rubro === "SALUD"
                              ? "Nueva Entrada Médica / Registro"
                              : "Nueva Entrada / Registro"}
                          </h5>

                          {recordError && (
                            <div className="rounded-xl border border-red-200/60 bg-red-50/80 px-3.5 py-2 text-xs font-semibold text-[#FF3B30]">
                              {recordError}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                                Título del Registro *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder={
                                  rubro === "PSICOLOGIA"
                                    ? "Ej. Sesión inicial, Seguimiento semanal, Evaluación de ansiedad"
                                    : rubro === "SALUD"
                                    ? "Ej. Control médico, Revisión de análisis"
                                    : "Ej. Control de evolución, Sesión de seguimiento"
                                }
                                value={recordTitle}
                                onChange={(e) => setRecordTitle(e.target.value)}
                                className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                                Tipo de Ficha
                              </label>
                              <select
                                value={recordType}
                                onChange={(e) => setRecordType(e.target.value)}
                                className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] cursor-pointer shadow-xs"
                              >
                                <option value="EVOLUCION">Evolución</option>
                                <option value="NOTA">Nota de Sesión</option>
                                <option value="CONSENTIMIENTO">Consentimiento</option>
                              </select>
                            </div>
                          </div>

                           <div>
                             <div className="flex items-center justify-between mb-1">
                               <label className="block text-xs font-semibold text-[#1D1D1F]">
                                 Notas Clínicas y Diagnóstico *
                               </label>
                               <button
                                 type="button"
                                 disabled={isGeneratingAiNote}
                                 onClick={handleGenerateSoapNote}
                                 className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 active:scale-[0.98] rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                 title="Convierte lo escrito en este campo al formato clínico formal SOAP"
                               >
                                 {isGeneratingAiNote ? (
                                   <>
                                     <div className="w-3 h-3 border-2 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin" />
                                     <span>Estructurando con IA...</span>
                                   </>
                                 ) : (
                                   <>
                                     <span>🪄 Estructurar con IA</span>
                                   </>
                                 )}
                               </button>
                             </div>
                            <textarea
                              rows={4}
                              required
                              placeholder={
                                rubro === "PSICOLOGIA"
                                  ? "Describe la evolución del paciente, estado emocional, temas tratados, técnicas aplicadas (TCC, relajación), tareas..."
                                  : "Describe la evolución, procedimientos realizados, observaciones del paciente..."
                              }
                              value={recordContent}
                              onChange={(e) => setRecordContent(e.target.value)}
                              className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs resize-none"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                              {rubro === "PSICOLOGIA"
                                ? "URL de Test Psicológico / Consentimiento Firmado (Opcional)"
                                : "URL del Adjunto / Consentimiento Firmado (Opcional)"}
                            </label>
                            <input
                              type="url"
                              placeholder="https://bucket.com/documento.pdf"
                              value={recordAttachmentUrl}
                              onChange={(e) => setRecordAttachmentUrl(e.target.value)}
                              className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                            />
                          </div>

                          <div className="flex justify-end gap-2.5 pt-2">
                            <button
                              onClick={() => setIsAddRecordOpen(false)}
                              type="button"
                              className="rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-4 py-2 text-xs font-semibold text-[#1D1D1F] hover:bg-[#E5E5EA] transition-all cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              disabled={pending}
                              type="submit"
                              className="rounded-xl bg-[#007AFF] px-5 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] hover:bg-[#0062CC] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {pending ? "Guardando..." : "Guardar Ficha"}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Timeline */}
                      <div className="space-y-3">
                        {crmDetails.clinicalRecords.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-[#86868B] gap-2 border border-dashed border-black/[0.08] rounded-2xl p-6">
                            <svg className="h-8 w-8 text-[#86868B]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-xs font-semibold text-[#1D1D1F]">No hay fichas clínicas en este expediente.</p>
                             <p className="text-xs text-[#86868B] max-w-xs text-center leading-relaxed">Crea notas de evolución y consentimientos firmados para llevar un registro profesional.</p>
                          </div>
                        ) : (
                          <div className="relative border-l-2 border-[#E5E5EA] pl-5 ml-2 space-y-4">
                            {crmDetails.clinicalRecords.map((record: any) => {
                              const dateStr = new Date(record.createdAt).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              });

                              let colorTheme = "bg-[#007AFF]/10 text-[#007AFF]";
                              let typeLabel = "Evolución";
                              if (record.type === "NOTA") {
                                colorTheme = "bg-[#86868B]/10 text-[#86868B]";
                                typeLabel = "Nota de Sesión";
                              } else if (record.type === "CONSENTIMIENTO") {
                                colorTheme = "bg-[#34C759]/10 text-[#34C759]";
                                typeLabel = "Consentimiento";
                              }

                              return (
                                <div key={record.id} className="relative group">
                                  {/* Circle indicator */}
                                  <div className="absolute -left-[27px] top-2 h-3 w-3 rounded-full border-2 border-white bg-[#007AFF] transition-all shadow-xs" />

                                  <div className="p-4 rounded-xl border border-black/[0.06] bg-white hover:border-[#007AFF]/20 transition-all space-y-2 shadow-xs">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h5 className="font-semibold text-sm text-[#1D1D1F] font-heading">
                                            {record.title}
                                          </h5>
                                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${colorTheme}`}>
                                            {typeLabel}
                                          </span>
                                        </div>
                                        <p className="text-[10px] font-medium text-[#86868B] mt-0.5">
                                          📅 {dateStr}
                                        </p>
                                      </div>
                                      
                                      <button
                                        onClick={() => handleDeleteClinicalRecord(record.id)}
                                        disabled={pending}
                                        type="button"
                                        className="text-[#86868B] hover:text-[#FF3B30] cursor-pointer p-1 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar registro"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>

                                    {/* Record Notes text */}
                                    <p className="text-xs text-[#1D1D1F] leading-relaxed font-normal whitespace-pre-wrap">
                                      {record.content}
                                    </p>

                                    {/* Attachments links list */}
                                    {record.attachments && record.attachments.length > 0 && (
                                      <div className="border-t border-black/[0.04] pt-2 flex items-center gap-1.5 text-xs font-medium text-[#007AFF]">
                                        <span>📎 Adjunto:</span>
                                        {record.attachments.map((link: string, i: number) => (
                                          <a
                                            key={i}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline break-all truncate max-w-[250px] hover:text-[#0056B3]"
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

            {/* 3. STICKY FOOTER */}
            <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryClient(null)}
                className="rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] px-5 py-2 text-xs font-semibold text-[#1D1D1F] cursor-pointer active:scale-[0.98] transition-all"
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
