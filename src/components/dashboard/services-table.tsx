"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  Clock,
  DollarSign,
  ShieldAlert,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Layers,
  Search,
  Globe,
  Lock,
} from "lucide-react";
import {
  type ServiceDTO,
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
} from "@/actions/services";
import type { StaffDTO } from "@/actions/personal";

import { SUPPORTED_CURRENCIES } from "@/lib/regional";

type Props = {
  initialServices: ServiceDTO[];
  staffList: StaffDTO[];
  currencySymbol?: string;
  defaultCurrency?: string;
};

export function ServicesTable({
  initialServices,
  staffList,
  currencySymbol = "$",
  defaultCurrency,
}: Props) {
  const [services, setServices] = useState<ServiceDTO[]>(initialServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDTO | null>(null);

  const fallbackCurrency = defaultCurrency || initialServices[0]?.currency || "USD";

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [bufferTime, setBufferTime] = useState(0);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState(fallbackCurrency);
  const [isActive, setIsActive] = useState(true);
  const [onlineBooking, setOnlineBooking] = useState(true);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function resetForm() {
    setEditingService(null);
    setName("");
    setDescription("");
    setDuration(30);
    setBufferTime(0);
    setPrice(0);
    setCurrency(fallbackCurrency);
    setIsActive(true);
    setOnlineBooking(true);
    setRequiresPayment(false);
    setSelectedStaffIds(staffList.map((s) => s.id)); // default select all staff
    setErrorMsg(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(service: ServiceDTO) {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || "");
    setDuration(service.duration);
    setBufferTime(service.bufferTime);
    setPrice(service.price);
    setCurrency(service.currency);
    setIsActive(service.isActive);
    setOnlineBooking(service.onlineBooking);
    setRequiresPayment(service.requiresPayment);
    setSelectedStaffIds(service.staffIds || []);
    setErrorMsg(null);
    setIsModalOpen(true);
  }

  function toggleStaffSelection(staffId: string) {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      if (editingService) {
        const res = await updateService(editingService.id, {
          name,
          description,
          duration,
          bufferTime,
          price,
          currency,
          isActive,
          onlineBooking,
          requiresPayment,
          staffIds: selectedStaffIds,
        });

        if (res.error) {
          setErrorMsg(res.error);
          return;
        }

        setServices((prev) =>
          prev.map((s) =>
            s.id === editingService.id
              ? {
                  ...s,
                  name,
                  description,
                  duration,
                  bufferTime,
                  price,
                  currency,
                  isActive,
                  onlineBooking,
                  requiresPayment,
                  staffIds: selectedStaffIds,
                }
              : s
          )
        );
        setSuccessMsg("Servicio actualizado correctamente.");
      } else {
        const res = await createService({
          name,
          description,
          duration,
          bufferTime,
          price,
          currency,
          isActive,
          onlineBooking,
          requiresPayment,
          staffIds: selectedStaffIds,
        });

        if (res.error) {
          setErrorMsg(res.error);
          return;
        }

        const newService: ServiceDTO = {
          id: res.serviceId!,
          name,
          description,
          duration,
          bufferTime,
          price,
          currency,
          isActive,
          onlineBooking,
          requiresPayment,
          staffIds: selectedStaffIds,
          appointmentsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setServices((prev) => [...prev, newService]);
        setSuccessMsg("Servicio creado correctamente.");
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    });
  }

  async function handleToggleActive(service: ServiceDTO) {
    const nextState = !service.isActive;
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, isActive: nextState } : s))
    );

    const res = await toggleServiceActive(service.id, nextState);
    if (res.error) {
      // rollback
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: !nextState } : s))
      );
      alert(res.error);
    }
  }

  async function handleDelete(service: ServiceDTO) {
    if (
      !confirm(
        `¿Estás seguro de eliminar el servicio «${service.name}»? Si tiene citas asociadas se desactivará para no perder el historial.`
      )
    ) {
      return;
    }

    const res = await deleteService(service.id);
    if (res.error) {
      alert(res.error);
    } else {
      if (res.message) {
        alert(res.message);
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, isActive: false, onlineBooking: false } : s
          )
        );
      } else {
        setServices((prev) => prev.filter((s) => s.id !== service.id));
      }
    }
  }

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed right-6 top-24 z-50 flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/95 px-5 py-3.5 text-[#1D1D1F] shadow-[0_12px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34C759]" />
          </span>
          <p className="text-xs font-semibold leading-none">{successMsg}</p>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-[#1D1D1F] tracking-tight">
            Servicios y Tarifas
          </h1>
          <p className="text-sm text-[#86868B] mt-1 font-medium">
            Configura los servicios que ofreces, sus duraciones, precios y el personal asignado.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#007AFF] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] hover:bg-[#0062CC] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
          <input
            type="text"
            placeholder="Buscar servicio por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-black/[0.08] bg-white/80 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#86868B] bg-white/80 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-black/[0.06] shadow-xs">
          <Layers className="h-3.5 w-3.5 text-[#007AFF]" />
          <span>
            {services.length} {services.length === 1 ? "servicio" : "servicios"} registrados
          </span>
        </div>
      </div>

      {/* Grid of services */}
      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[0.12] bg-white/60 p-12 text-center backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007AFF]/10 text-[#007AFF] mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F]">
            {searchTerm ? "No se encontraron servicios" : "No tienes servicios creados todavía"}
          </h3>
          <p className="text-xs text-[#86868B] mt-1 max-w-md mx-auto font-medium">
            {searchTerm
              ? "Prueba buscando con otro término o limpia el filtro."
              : "Comienza creando tu primer servicio para que tus clientes puedan seleccionarlo al reservar su cita."}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#007AFF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0062CC] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Crear mi primer servicio
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const assignedStaff = staffList.filter((s) =>
              service.staffIds.includes(s.id)
            );

            return (
              <div
                key={service.id}
                className={`relative group rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between backdrop-blur-2xl ${
                  service.isActive
                    ? "bg-white/80 border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:border-[#007AFF]/30"
                    : "bg-[#F5F5F7]/80 border-black/[0.04] opacity-70"
                }`}
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          service.isActive
                            ? "bg-[#34C759]/10 text-[#34C759]"
                            : "bg-[#86868B]/10 text-[#86868B]"
                        }`}
                      >
                        {service.isActive ? "Activo" : "Inactivo"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          service.onlineBooking
                            ? "bg-[#007AFF]/10 text-[#007AFF]"
                            : "bg-[#FF9500]/10 text-[#FF9500]"
                        }`}
                        title={
                          service.onlineBooking
                            ? "Visible en el portal público"
                            : "Solo reservas internas/manuales"
                        }
                      >
                        {service.onlineBooking ? (
                          <>
                            <Globe className="h-3 w-3" /> Online
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" /> Privado
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
                        title="Editar servicio"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="p-1.5 rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
                        title="Eliminar o desactivar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & description */}
                  <h3 className="text-base font-bold text-[#1D1D1F] leading-snug group-hover:text-[#007AFF] transition-colors font-heading">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-xs text-[#86868B] mt-1 line-clamp-2 leading-relaxed font-normal">
                      {service.description}
                    </p>
                  )}

                  {/* Duration & Price pills */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-black/[0.04]">
                    <div className="flex items-center gap-1.5 text-xs text-[#1D1D1F] font-semibold bg-[#F5F5F7] rounded-xl px-2.5 py-1.5 border border-black/[0.03]">
                      <Clock className="h-3.5 w-3.5 text-[#007AFF]" />
                      <span>{service.duration} min</span>
                      {service.bufferTime > 0 && (
                        <span className="text-[10px] text-[#86868B] font-normal">
                          (+{service.bufferTime}m)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#1D1D1F] font-bold bg-[#F5F5F7] rounded-xl px-2.5 py-1.5 border border-black/[0.03]">
                      <DollarSign className="h-3.5 w-3.5 text-[#34C759]" />
                      <span>
                        {service.price > 0
                          ? `${currencySymbol}${service.price} ${service.currency}`
                          : "Gratis"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Staff section */}
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#86868B]">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#86868B]" />
                    <span className="font-medium">
                      {assignedStaff.length === 0
                        ? "Todo el equipo"
                        : assignedStaff.length === 1
                        ? assignedStaff[0].name
                        : `${assignedStaff.length} especialistas`}
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-[#86868B]">
                    {service.appointmentsCount}{" "}
                    {service.appointmentsCount === 1 ? "cita" : "citas"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Crear / Editar Servicio (Apple Design System Inset Grouped Cards) */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.16)] animate-in zoom-in-95 duration-200"
          >
            {/* 1. STICKY HEADER */}
            <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] font-heading leading-tight">
                  {editingService ? "Editar Servicio" : "Nuevo Servicio"}
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5 font-medium">Configura los parámetros del servicio ofertado.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                {errorMsg && (
                  <div className="rounded-2xl bg-red-50/80 border border-red-200/60 p-3.5 text-xs text-[#FF3B30] font-semibold">
                    ⚠️ {errorMsg}
                  </div>
                )}

                {/* CARD 1: INFORMACIÓN PRINCIPAL */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Información Básica
                  </p>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Nombre del servicio <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Consulta Psicológica, Terapia Individual..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Descripción (opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Breve explicación de lo que incluye este servicio o sesión..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all resize-none shadow-xs"
                    />
                  </div>
                </div>

                {/* CARD 2: DURACIÓN Y HONORARIOS */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Tiempos y Tarifas
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Duración <span className="text-[#FF3B30]">*</span>
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-xs font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF] cursor-pointer shadow-xs"
                      >
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={50}>50 min</option>
                        <option value={60}>60 min (1h)</option>
                        <option value={75}>75 min</option>
                        <option value={90}>90 min (1.5h)</option>
                        <option value={120}>120 min (2h)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Colchón / Buffer
                      </label>
                      <select
                        value={bufferTime}
                        onChange={(e) => setBufferTime(Number(e.target.value))}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-xs font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF] cursor-pointer shadow-xs"
                      >
                        <option value={0}>0 min</option>
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Precio ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF] transition-all shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Moneda
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-xs font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF] cursor-pointer shadow-xs"
                      >
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* CARD 3: ESPECIALISTAS ASIGNADOS */}
                {staffList.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                      Especialistas que brindan este servicio
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {staffList.map((member) => {
                        const isSelected = selectedStaffIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleStaffSelection(member.id)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer active:scale-[0.98] ${
                              isSelected
                                ? "bg-white border-[#007AFF] text-[#007AFF] shadow-xs font-semibold"
                                : "bg-white/60 border-black/[0.06] text-[#1D1D1F] hover:bg-white font-medium"
                            }`}
                          >
                            <span
                              className={`h-5 w-5 rounded-lg flex items-center justify-center text-xs transition-all ${
                                isSelected
                                  ? "bg-[#007AFF] text-white font-bold"
                                  : "border border-black/[0.15] bg-white text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <span className="truncate">{member.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CARD 4: CANALES Y VISIBILIDAD (iOS STYLE TOGGLES) */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Canales y Disponibilidad
                  </p>

                  {/* Online Booking Toggle */}
                  <label className="flex items-center justify-between cursor-pointer group select-none">
                    <div>
                      <p className="text-xs font-semibold text-[#1D1D1F]">Permitir reserva pública en la web</p>
                      <p className="text-[11px] text-[#86868B]">Los pacientes podrán agendar este servicio desde el portal</p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={onlineBooking}
                        onChange={(e) => setOnlineBooking(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-black/[0.12] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/[0.04] after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-xs peer-checked:bg-[#007AFF] transition-colors" />
                    </div>
                  </label>

                  <div className="border-t border-black/[0.04]" />

                  {/* Active Toggle */}
                  <label className="flex items-center justify-between cursor-pointer group select-none">
                    <div>
                      <p className="text-xs font-semibold text-[#1D1D1F]">Servicio activo en el catálogo</p>
                      <p className="text-[11px] text-[#86868B]">Visible para agendamiento interno y reportes</p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-black/[0.12] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/[0.04] after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-xs peer-checked:bg-[#007AFF] transition-colors" />
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. STICKY FOOTER */}
              <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none sm:min-w-[120px] rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] py-2.5 px-5 text-xs font-semibold text-[#1D1D1F] active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl bg-[#007AFF] hover:bg-[#0062CC] py-2.5 px-6 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] active:scale-[0.98] disabled:opacity-50 transition-all text-center cursor-pointer"
                >
                  {pending
                    ? "Guardando..."
                    : editingService
                    ? "Guardar Cambios"
                    : "Crear Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
