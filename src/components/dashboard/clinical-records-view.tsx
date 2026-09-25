"use client";

import { useState, useTransition } from "react";
import { createClinicalRecord, deleteClinicalRecord } from "@/actions/crm";
import { getLabels } from "@/lib/labels";
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Calendar,
  User,
  X,
  CheckCircle,
  AlertCircle,
  Filter,
} from "lucide-react";

export type ClinicalRecordItem = {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  title: string;
  type: string;
  content: string;
  attachments: string[] | null;
  createdAt: string;
};

type ClientOption = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type Props = {
  initialRecords: ClinicalRecordItem[];
  clients: ClientOption[];
  rubro: string;
};

export function ClinicalRecordsView({ initialRecords, clients, rubro }: Props) {
  const labels = getLabels(rubro);
  const [records, setRecords] = useState<ClinicalRecordItem[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecordItem | null>(null);

  // Creation modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("EVOLUCION");
  const [content, setContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // AI assistant states
  const [isGeneratingAiNote, setIsGeneratingAiNote] = useState(false);

  const [pending, startTransition] = useTransition();

  const handleGenerateSoapNote = async () => {
    const textToProcess = content.trim();
    if (!textToProcess || textToProcess.length < 5) {
      alert("Por favor escribe primero algunas notas u observaciones en el campo para que la IA las estructure en formato SOAP.");
      return;
    }
    setIsGeneratingAiNote(true);
    try {
      const response = await fetch("/api/ai/clinical-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: textToProcess }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al conectar con el asistente de IA.");
      }
      setContent(data.formattedNote);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al estructurar la nota clínica con IA.");
    } finally {
      setIsGeneratingAiNote(false);
    }
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setCreateError(`Debes seleccionar un ${labels.client.toLowerCase()}.`);
      return;
    }
    setCreateError(null);

    startTransition(async () => {
      const res = await createClinicalRecord(clientId, {
        title,
        type,
        content,
        attachments: attachmentUrl ? [attachmentUrl] : [],
      });

      if (res.error) {
        setCreateError(res.error);
      } else {
        const client = clients.find((c) => c.id === clientId);
        const newRecord: ClinicalRecordItem = {
          id: res.recordId || Date.now().toString(),
          clientId,
          clientName: client?.name || "Desconocido",
          clientEmail: client?.email || "",
          clientPhone: client?.phone || "",
          title,
          type,
          content,
          attachments: attachmentUrl ? [attachmentUrl] : null,
          createdAt: new Date().toISOString(),
        };

        setRecords((prev) => [newRecord, ...prev]);
        setIsCreateOpen(false);
        setTitle("");
        setContent("");
        setAttachmentUrl("");
      }
    });
  };

  const handleDeleteRecord = (id: string) => {
    if (!confirm("¿Eliminar este expediente clínico permanentemente?")) return;
    startTransition(async () => {
      const res = await deleteClinicalRecord(id);
      if (res.error) {
        alert(res.error);
      } else {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
      }
    });
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Filter & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border border-black/[0.06] bg-white/80 backdrop-blur-2xl p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={`Buscar por ${labels.client.toLowerCase()}, título o diagnóstico...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-black/[0.08] bg-black/[0.03] py-2 pl-9 pr-3.5 text-xs font-normal text-[#1D1D1F] focus:outline-hidden focus:bg-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#86868B]"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#86868B]" />
        </div>

        {/* Filter & Add Button */}
        <div className="flex items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF] cursor-pointer shadow-xs"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="EVOLUCION">Evolución / SOAP</option>
            <option value="NOTA">Nota de Sesión</option>
            <option value="CONSENTIMIENTO">Consentimiento</option>
          </select>

          <button
            onClick={() => setIsCreateOpen(true)}
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] px-4 py-2 text-xs font-medium text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer select-none"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva Nota Clínica</span>
          </button>
        </div>
      </div>

      {/* Main Grid / Table */}
      <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] w-full overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-black/[0.03] text-[#86868B] flex items-center justify-center mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              No hay expedientes clínicos registrados
            </h3>
            <p className="text-xs text-[#86868B] max-w-sm mt-1 leading-relaxed">
              Registra las notas de sesión y evoluciones de tus {labels.clients.toLowerCase()} con asistencia de Inteligencia Artificial (formato SOAP).
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              type="button"
              className="mt-4 rounded-xl bg-[#007AFF] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#0062cc] active:scale-[0.98] transition-all cursor-pointer"
            >
              + Crear Primera Nota
            </button>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {filteredRecords.map((rec) => {
              const dateStr = new Date(rec.createdAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.015] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="h-9 w-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-medium text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
                          {rec.title}
                        </h4>
                        <span
                          className={`text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-md ${
                            rec.type === "EVOLUCION"
                              ? "bg-[#007AFF]/10 text-[#007AFF]"
                              : rec.type === "CONSENTIMIENTO"
                              ? "bg-[#5856D6]/10 text-[#5856D6]"
                              : "bg-[#34C759]/10 text-[#34C759]"
                          }`}
                        >
                          {rec.type}
                        </span>
                      </div>
                      <p className="text-xs text-[#86868B] mt-0.5">
                        {labels.client}: <strong className="text-[#1D1D1F] font-medium">{rec.clientName}</strong> · {dateStr}
                      </p>
                      <p className="text-xs text-[#86868B] line-clamp-1 mt-1 font-normal">
                        {rec.content.replace(/[#*`_]/g, "")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(rec);
                      }}
                      className="text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/15 px-3 py-1.5 rounded-lg active:scale-[0.98] transition-all"
                    >
                      Ver Detalle
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRecord(rec.id);
                      }}
                      className="p-1.5 text-[#86868B] hover:text-[#FF3B30] rounded-lg hover:bg-[#FF3B30]/10 active:scale-95 transition-all"
                      title="Eliminar nota"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL (Responsive Apple Design 3-Tier Layout) */}
      {selectedRecord && (
        <div 
          onClick={() => setSelectedRecord(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.16)] animate-in zoom-in-95 duration-200"
          >
            {/* 1. STICKY HEADER */}
            <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex justify-between items-start gap-3">
              <div className="min-w-0">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#007AFF]/10 text-[#007AFF]">
                  {selectedRecord.type}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] font-heading leading-tight mt-1.5 truncate">
                  {selectedRecord.title}
                </h3>
                <p className="text-xs text-[#86868B] mt-1 font-medium truncate">
                  {labels.client}: <strong className="text-[#1D1D1F] font-semibold">{selectedRecord.clientName}</strong> ({selectedRecord.clientEmail}) · {new Date(selectedRecord.createdAt).toLocaleString("es-ES")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 2. SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F5F7]/80 border border-black/[0.06] text-xs font-mono whitespace-pre-wrap leading-relaxed text-[#1D1D1F]">
                {selectedRecord.content}
              </div>

              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#F5F5F7]/80 border border-black/[0.06] space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Archivos Adjuntos
                  </p>
                  <div className="space-y-1.5">
                    {selectedRecord.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] hover:underline"
                      >
                        📎 Ver Documento Adjunto #{i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. STICKY FOOTER */}
            <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => handleDeleteRecord(selectedRecord.id)}
                className="text-xs font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/10 px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Eliminar Nota
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] px-6 py-2.5 text-xs font-semibold text-[#1D1D1F] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE RECORD MODAL (Apple Design System Inset Grouped Cards) */}
      {isCreateOpen && (
        <div 
          onClick={() => setIsCreateOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.16)] animate-in zoom-in-95 duration-200"
          >
            {/* 1. STICKY HEADER */}
            <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex justify-between items-center">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] font-heading leading-tight">
                  Nueva Nota de Expediente Clínico
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5 font-medium">
                  Agrega una nota clínica, evolución médica o consulta de seguimiento.
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

            <form onSubmit={handleCreateRecord} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                {createError && (
                  <p className="text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/10 p-3.5 rounded-2xl border border-[#FF3B30]/20">
                    {createError}
                  </p>
                )}

                {/* CARD 1: CONTEXTO DEL PACIENTE Y SESIÓN */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Información del Paciente
                  </p>

                  {/* Select Client */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      {labels.client} *
                    </label>
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] cursor-pointer shadow-xs"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title & Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Título de la Nota *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Sesión #4 - Seguimiento"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Tipo de Registro *
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] cursor-pointer shadow-xs"
                      >
                        <option value="EVOLUCION">Evolución / SOAP</option>
                        <option value="NOTA">Nota de Sesión</option>
                        <option value="CONSENTIMIENTO">Consentimiento Informado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* CARD 2: REDACCIÓN CLÍNICA Y ASISTENCIA IA */}
                <div className="p-4 sm:p-5 rounded-2xl border border-[#007AFF]/15 bg-[#007AFF]/[0.02] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#007AFF]">
                      Evolución Clínica *
                    </p>
                    <button
                      type="button"
                      disabled={isGeneratingAiNote}
                      onClick={handleGenerateSoapNote}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#007AFF] cursor-pointer bg-white hover:bg-[#007AFF]/10 px-3 py-1.5 rounded-xl border border-[#007AFF]/25 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
                    >
                      {isGeneratingAiNote ? (
                        <>
                          <div className="w-3 h-3 border-2 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin" />
                          <span>Estructurando con IA...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-[#007AFF]" />
                          <span>Estructurar con IA (SOAP)</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    required
                    rows={6}
                    placeholder="Redacta las observaciones de la sesión o pulsa 'Estructurar con IA' para formatear automáticamente en esquema médico SOAP..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white p-3.5 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 resize-none shadow-xs"
                  />
                </div>

                {/* CARD 3: ARCHIVOS Y ADJUNTOS */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Documentos y Adjuntos
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      URL de Documento / Archivo Adjunto (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. STICKY FOOTER */}
              <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 sm:flex-none sm:min-w-[120px] rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] py-2.5 px-5 text-xs font-semibold text-[#1D1D1F] active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl bg-[#007AFF] hover:bg-[#0062cc] py-2.5 px-6 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] active:scale-[0.98] transition-all text-center cursor-pointer disabled:opacity-50"
                >
                  {pending ? "Guardando..." : "Guardar Nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
