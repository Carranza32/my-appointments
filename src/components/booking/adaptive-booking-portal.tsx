"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  AdaptiveBusinessData,
  AdaptiveServiceItem,
  AdaptiveStaffItem,
  AdaptiveLocationItem,
  AdaptiveResourceItem,
  BookingState,
  BookingStepId,
  resolveBookingRequirements,
  getBookingSteps,
  createInitialBookingState,
  filterCompatibleStaff,
  filterCompatibleResources,
  sanitizeStateOnModalityChange,
  getContextualLabels,
} from "@/lib/booking/adaptive-engine";
import { ServiceSelector } from "./selectors/service-selector";
import { ModalitySelector } from "./selectors/modality-selector";
import { LocationSelector } from "./selectors/location-selector";
import { StaffSelector } from "./selectors/staff-selector";
import { ResourceSelector } from "./selectors/resource-selector";
import { TimeSlotSelector } from "./selectors/time-slot-selector";
import { MonthCalendar } from "./month-calendar";
import { DynamicBookingForm } from "./dynamic-booking-form";
import { getAvailableSlots, getMonthAvailability } from "@/actions/availability";
import { uploadPaymentProofAction } from "@/actions/appointments";
import { formatDateLabel, buildAppointmentRange } from "@/lib/booking";

type Props = {
  data: AdaptiveBusinessData;
};

export function AdaptiveBookingPortal({ data }: Props) {
  // Ensure Light Mode color scheme
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const requirements = useMemo(() => resolveBookingRequirements(data), [data]);
  const labels = useMemo(
    () => getContextualLabels(data.rubro, requirements.isSpaceFirst),
    [data.rubro, requirements.isSpaceFirst]
  );

  const [state, setState] = useState<BookingState>(() =>
    createInitialBookingState(data, requirements)
  );

  // Dynamically resolve active steps sequence
  const steps = useMemo(
    () => getBookingSteps(requirements, state, data),
    [requirements, state, data]
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Ensure currentStepIndex stays within bounds if steps array dynamically shrinks/expands
  useEffect(() => {
    if (currentStepIndex >= steps.length) {
      setCurrentStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, currentStepIndex]);

  const currentStep = steps[currentStepIndex] || "service";

  // Slots fetching state for Time selection
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Month availability for Calendar
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [availableDates, setAvailableDates] = useState<string[] | undefined>(undefined);
  const [businessDaysOff, setBusinessDaysOff] = useState<number[]>([]);
  const [isMonthLoading, setIsMonthLoading] = useState(false);

  // Bank transfer / payment proof state
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active selected service and duration
  const selectedService = useMemo(() => {
    if (!state.serviceId) {
      return data.services.length === 1 ? data.services[0] : null;
    }
    return data.services.find((s) => s.id === state.serviceId) || null;
  }, [data.services, state.serviceId]);

  const effectiveDuration =
    selectedService?.duration || data.config.slotDuration || 30;

  // Compatible staff list
  const compatibleStaff = useMemo(
    () => filterCompatibleStaff(selectedService, data.staff),
    [selectedService, data.staff]
  );

  // Selected staff item
  const selectedStaff = useMemo(() => {
    if (!state.staffId) return null;
    return data.staff.find((st) => st.id === state.staffId) || null;
  }, [data.staff, state.staffId]);

  // Compatible resources list
  const compatibleResources = useMemo(
    () =>
      filterCompatibleResources(
        selectedService,
        state.locationId,
        data.resources
      ),
    [selectedService, state.locationId, data.resources]
  );

  // Selected resource item
  const selectedResource = useMemo(() => {
    if (!state.resourceId) return null;
    return data.resources.find((r) => r.id === state.resourceId) || null;
  }, [data.resources, state.resourceId]);

  // Selected location item
  const selectedLocation = useMemo(() => {
    if (!state.locationId) return null;
    return data.locations.find((l) => l.id === state.locationId) || null;
  }, [data.locations, state.locationId]);

  // Navigation helpers
  const goToNextStep = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goToPrevStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  // Step selection handlers
  const handleSelectService = (srv: AdaptiveServiceItem) => {
    const nextStaff = filterCompatibleStaff(srv, data.staff);
    const nextResources = filterCompatibleResources(
      srv,
      state.locationId,
      data.resources
    );

    setState((prev) => ({
      ...prev,
      serviceId: srv.id,
      staffId: nextStaff.length === 1 ? nextStaff[0].id : prev.staffId,
      resourceId:
        nextResources.length === 1 ? nextResources[0].id : prev.resourceId,
      time: null,
    }));
    goToNextStep();
  };

  const handleSelectModality = (modality: "presencial" | "online") => {
    setState((prev) => {
      const sanitized = sanitizeStateOnModalityChange(prev, modality);
      if (modality === "presencial" && data.locations.length === 1) {
        sanitized.locationId = data.locations[0].id;
      }
      return sanitized;
    });
    goToNextStep();
  };

  const handleSelectLocation = (loc: AdaptiveLocationItem) => {
    const nextResources = filterCompatibleResources(
      selectedService,
      loc.id,
      data.resources
    );
    setState((prev) => ({
      ...prev,
      locationId: loc.id,
      resourceId:
        nextResources.length === 1 ? nextResources[0].id : prev.resourceId,
      time: null,
    }));
    goToNextStep();
  };

  const handleSelectStaff = (st: AdaptiveStaffItem | null) => {
    setState((prev) => ({ ...prev, staffId: st ? st.id : null, time: null }));
    goToNextStep();
  };

  const handleSelectResource = (res: AdaptiveResourceItem) => {
    setState((prev) => ({ ...prev, resourceId: res.id, time: null }));
    goToNextStep();
  };

  const handleSelectDate = (date: string) => {
    setState((prev) => ({ ...prev, date, time: null }));
    goToNextStep();
  };

  // Fetch available dates for the calendar month
  useEffect(() => {
    let isCancelled = false;
    setIsMonthLoading(true);
    getMonthAvailability(
      data.slug,
      calendarYear,
      calendarMonth,
      state.staffId,
      state.serviceId,
      state.resourceId,
      state.locationId
    )
      .then((res) => {
        if (!isCancelled) {
          setAvailableDates(res.availableDates);
          setBusinessDaysOff(res.businessDaysOff);
        }
      })
      .catch((err) => {
        console.error("Error loading month availability:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsMonthLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    data.slug,
    calendarYear,
    calendarMonth,
    state.staffId,
    state.serviceId,
    state.resourceId,
    state.locationId,
  ]);

  // Load available slots when entering or viewing "time" step
  useEffect(() => {
    if (currentStep === "time" && state.date) {
      setSlotsLoading(true);
      setSlotsError(null);
      getAvailableSlots(
        data.slug,
        new Date(`${state.date}T12:00:00`),
        state.staffId,
        state.serviceId,
        state.resourceId,
        state.locationId
      )
        .then((res) => {
          if ("error" in res) {
            setSlotsError(res.error);
            setSlots([]);
          } else {
            setSlots(res.slots);
          }
        })
        .catch(() => {
          setSlotsError("Error al cargar horarios disponibles.");
          setSlots([]);
        })
        .finally(() => {
          setSlotsLoading(false);
        });
    }
  }, [
    currentStep,
    state.date,
    state.staffId,
    state.serviceId,
    state.resourceId,
    state.locationId,
    data.slug,
  ]);

  const handleSelectTime = (time: string) => {
    setState((prev) => ({ ...prev, time }));
    goToNextStep();
  };

  const handleBookingCreated = (appointmentId: string) => {
    setState((prev) => ({
      ...prev,
      createdAppointmentId: appointmentId,
    }));
    goToNextStep();
  };

  const handlePaymentProofUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !state.createdAppointmentId) return;

    setUploadError(null);
    setIsUploadingProof(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const res = await uploadPaymentProofAction(
        state.createdAppointmentId!,
        base64
      );
      if (res.error) {
        setUploadError(res.error);
      } else {
        setState((prev) => ({
          ...prev,
          paymentProofUrl: base64,
          paymentStatus: "PENDIENTE",
        }));
      }
      setIsUploadingProof(false);
    };
    reader.onerror = () => {
      setUploadError("Error al procesar el archivo. Intenta de nuevo.");
      setIsUploadingProof(false);
    };
    reader.readAsDataURL(file);
  };

  const resetBooking = () => {
    setState(createInitialBookingState(data, requirements));
    setCurrentStepIndex(0);
  };

  // Stepper UI Labels Map
  const stepTitles: Record<BookingStepId, string> = {
    service: "Servicio",
    resource_first: labels.resourceBadge || "Cancha / Espacio",
    modality: "Modalidad",
    location: labels.location || "Sede",
    staff: labels.staff || "Especialista",
    resource: labels.resourceBadge || "Recurso",
    date: "Fecha",
    time: "Horario",
    form: "Datos",
    payment: "Pago",
    done: "Confirmación",
  };

  // Initials for avatar fallback
  const initials = data.businessName
    ? data.businessName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AP";

  // Render Confirmation Screen
  if (currentStep === "done") {
    let googleUrl = "";
    let appleUrl = "";
    let whatsappUrl = "";

    if (state.date && state.time) {
      const { startTime, endTime } = buildAppointmentRange(
        state.date,
        state.time,
        effectiveDuration
      );
      const startStr =
        startTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const endStr =
        endTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const nowStr =
        new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const details = `Tu ${labels.appointment.toLowerCase()} (${selectedService ? selectedService.name : "Servicio"}) con ${data.businessName} está confirmada para el día ${state.date} a las ${state.time}. Duración: ${effectiveDuration} minutos.`;

      googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${labels.appointment}: ${selectedService?.name || data.businessName}`)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}`;

      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//MyAppointment//NONSGML Client//EN",
        "BEGIN:VEVENT",
        `UID:${nowStr}@my-appointment`,
        `DTSTAMP:${nowStr}`,
        `DTSTART:${startStr}`,
        `DTEND:${endStr}`,
        `SUMMARY:${labels.appointment}: ${selectedService?.name || data.businessName}`,
        `DESCRIPTION:${details}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");
      appleUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
    }

    if (data.config.whatsappNumber && state.date && state.time) {
      const cleanPhone = data.config.whatsappNumber.replace(/[\s\-()+]/g, "");
      const msg = `Hola! Acabo de agendar una ${labels.appointment.toLowerCase()} para ${selectedService ? selectedService.name : "servicio"} el ${state.date} a las ${state.time} hs. Quedo al pendiente.`;
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    }

    return (
      <div className="mx-auto max-w-xl animate-in zoom-in-95 fade-in duration-300">
        <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-2xl">
          {/* Subtle Apple light ambient glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#34C759]/10 blur-3xl" />

          {/* Success Check Badge */}
          <div className="mb-6 flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#34C759]/10 border border-[#34C759]/20 shadow-sm">
              <svg
                className="h-10 w-10 text-[#34C759]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold tracking-tight text-[#1D1D1F]">
            ¡{labels.appointment} Confirmada!
          </h2>
          <p className="mt-1.5 text-center text-sm text-[#86868B]">
            Tu reservación con{" "}
            <strong className="font-semibold text-[#1D1D1F]">
              {data.businessName}
            </strong>{" "}
            ha sido registrada exitosamente.
          </p>

          {/* Appointment Summary Box */}
          <div className="mt-6 rounded-2xl border border-[#E5E5EA] bg-[#FBFBFD] p-5 space-y-4">
            {selectedService && (
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                    Servicio
                  </span>
                  <p className="text-sm font-bold text-[#007AFF]">
                    {selectedService.name}
                  </p>
                </div>
                {selectedService.price > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                      Precio
                    </span>
                    <p className="text-sm font-bold text-[#1D1D1F]">
                      ${selectedService.price} {selectedService.currency}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                  Fecha
                </span>
                <p className="text-sm font-semibold text-[#1D1D1F]">
                  {state.date ? formatDateLabel(state.date) : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                  Horario
                </span>
                <p className="text-sm font-semibold text-[#1D1D1F]">
                  {state.time} ({effectiveDuration} min)
                </p>
              </div>
            </div>

            {selectedStaff && (
              <div className="pt-3 border-t border-[#E5E5EA]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                  {labels.staff}
                </span>
                <p className="text-sm font-semibold text-[#1D1D1F]">
                  {selectedStaff.name}
                </p>
              </div>
            )}

            {selectedResource && (
              <div className="pt-3 border-t border-[#E5E5EA]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                  {labels.resourceBadge || "Recurso"}
                </span>
                <p className="text-sm font-semibold text-[#1D1D1F]">
                  {selectedResource.name}
                </p>
              </div>
            )}

            {selectedLocation && (
              <div className="pt-3 border-t border-[#E5E5EA]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                  {labels.location}
                </span>
                <p className="text-sm font-semibold text-[#1D1D1F]">
                  {selectedLocation.name}
                </p>
                {selectedLocation.address && (
                  <p className="text-xs text-[#86868B] mt-0.5">
                    {selectedLocation.address}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bank Transfer Instructions & Receipt Upload if applicable */}
          {data.config.acceptBankTransfer && (
            <div className="mt-6 rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/5 p-5 text-left space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🏦</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#007AFF]">
                  Pago por Transferencia Bancaria
                </h4>
              </div>
              <p className="text-xs text-[#48484A] leading-relaxed">
                Por favor realiza la transferencia a la siguiente cuenta y sube
                tu comprobante para acelerar la validación:
              </p>
              <div className="space-y-1.5 rounded-xl bg-white p-3 text-xs border border-[#E5E5EA]">
                {data.config.bankName && (
                  <div className="flex justify-between">
                    <span className="text-[#86868B]">Banco:</span>
                    <span className="font-bold text-[#1D1D1F]">
                      {data.config.bankName}
                    </span>
                  </div>
                )}
                {data.config.bankClabe && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#86868B]">CLABE:</span>
                    <span className="font-mono font-bold text-[#1D1D1F] bg-[#F2F2F7] px-1.5 py-0.5 rounded select-all">
                      {data.config.bankClabe}
                    </span>
                  </div>
                )}
                {data.config.bankHolder && (
                  <div className="flex justify-between">
                    <span className="text-[#86868B]">Titular:</span>
                    <span className="font-bold text-[#1D1D1F]">
                      {data.config.bankHolder}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload input */}
              <div className="pt-2">
                {state.paymentProofUrl ? (
                  <div className="flex items-center justify-between rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 px-3 py-2 text-xs font-semibold text-[#34C759]">
                    <span>✓ Comprobante cargado exitosamente</span>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="proof-file"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#007AFF]/40 bg-white py-2.5 text-xs font-bold text-[#007AFF] hover:bg-[#007AFF]/5 cursor-pointer transition-colors active:scale-[0.98]"
                    >
                      {isUploadingProof ? "Subiendo…" : "Subir Comprobante (JPG / PNG)"}
                    </label>
                    <input
                      id="proof-file"
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentProofUpload}
                      disabled={isUploadingProof}
                      className="hidden"
                    />
                    {uploadError && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold text-center">
                        {uploadError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendar Actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {googleUrl && (
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E5EA] bg-white py-3 text-xs font-semibold text-[#1D1D1F] hover:bg-[#F2F2F7] active:scale-[0.98] transition-all shadow-2xs"
              >
                <svg className="h-4 w-4 text-[#007AFF]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.5 3h-1.5V1.5A1.5 1.5 0 0016.5 0h-9A1.5 1.5 0 006 1.5V3H4.5A4.5 4.5 0 000 7.5v12A4.5 4.5 0 004.5 24h15a4.5 4.5 0 004.5-4.5v-12A4.5 4.5 0 0019.5 3zM7.5 1.5h9V3h-9V1.5zm15 18A3 3 0 0119.5 22.5h-15A3 3 0 011.5 19.5V10.5h21v9zm0-10.5h-21V7.5A3 3 0 014.5 4.5H6v1.5a1.5 1.5 0 003 0V4.5h6v1.5a1.5 1.5 0 003 0V4.5h1.5A3 3 0 0122.5 7.5V9z"/>
                </svg>
                Google Calendar
              </a>
            )}
            {appleUrl && (
              <a
                href={appleUrl}
                download={`cita-${state.date}.ics`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E5EA] bg-white py-3 text-xs font-semibold text-[#1D1D1F] hover:bg-[#F2F2F7] active:scale-[0.98] transition-all shadow-2xs"
              >
                <svg className="h-4 w-4 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Apple Calendar
              </a>
            )}
          </div>

          {/* WhatsApp Action */}
          {whatsappUrl && (
            <div className="mt-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-xs font-bold text-white hover:bg-[#20bd5a] active:scale-[0.98] transition-all shadow-sm"
              >
                <span>💬</span> Confirmar por WhatsApp
              </a>
            </div>
          )}

          {/* Reset Link */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={resetBooking}
              className="text-xs font-semibold text-[#007AFF] hover:underline cursor-pointer"
            >
              Agendar otra {labels.appointment.toLowerCase()}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active steps excluding 'done' for stepper pill indicator
  const stepperSteps = steps.filter((s) => s !== "done");

  return (
    <div className="mx-auto max-w-xl">
      {/* Apple Studio Header Card */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-black/[0.06] bg-white/85 p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-all">
        {/* Apple subtle ambient tint */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-[#007AFF]/12 via-[#5856D6]/8 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gradient-to-tr from-[#34C759]/10 to-transparent blur-3xl" />

        {/* Cover Photo / Banner if provided */}
        {data.config.coverUrl && (
          <div
            className="h-36 sm:h-44 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-4 relative overflow-hidden transition-all"
            style={{
              background: data.config.coverUrl.startsWith("data:") || data.config.coverUrl.startsWith("http")
                ? `url('${data.config.coverUrl}') center/cover no-repeat`
                : data.config.coverUrl,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            {data.config.modality && (
              <div className="absolute top-3 right-3 backdrop-blur-md bg-black/40 text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20 shadow-xs">
                {data.config.modality === "ONLINE"
                  ? "🌐 100% En Línea"
                  : data.config.modality === "IN_PERSON"
                  ? "🏥 Presencial"
                  : "🔄 Modalidad Híbrida"}
              </div>
            )}
          </div>
        )}

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Dual-ring Apple Avatar */}
            <div className={`relative shrink-0 ${data.config.coverUrl ? "-mt-10 sm:-mt-12 z-10" : ""}`}>
              {data.config.avatarUrl ? (
                <img
                  src={data.config.avatarUrl}
                  alt={data.businessName}
                  className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl object-cover ring-4 ring-white shadow-md border border-black/[0.04] bg-white"
                />
              ) : (
                <div
                  className="flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-2xl text-xl font-bold text-white ring-4 ring-white shadow-md bg-gradient-to-br from-[#007AFF] via-[#0062CC] to-[#004B99]"
                  style={data.config.themeColor ? { background: data.config.themeColor } : undefined}
                >
                  {initials}
                </div>
              )}
              {/* Online pulse indicator */}
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34C759] opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-[#34C759]" />
              </span>
            </div>

            {/* Business Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] truncate">
                  {data.businessName}
                </h1>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: data.config.themeColor ? `${data.config.themeColor}15` : "rgba(0,122,255,0.1)",
                    color: data.config.themeColor || "#007AFF",
                  }}
                >
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verificado
                </span>
                {!data.config.coverUrl && data.config.modality && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[#1D1D1F]">
                    {data.config.modality === "ONLINE"
                      ? "🌐 En Línea"
                      : data.config.modality === "IN_PERSON"
                      ? "🏥 Presencial"
                      : "🔄 Híbrida"}
                  </span>
                )}
              </div>

              {data.config.description && (
                <p className="text-xs text-[#86868B] line-clamp-2 mt-0.5">
                  {data.config.description}
                </p>
              )}

              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap text-xs text-[#86868B]">
                <span className="inline-flex items-center gap-1 font-medium text-[#34C759]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
                  Portal Oficial de Reservas
                </span>
                {data.rubro && (
                  <>
                    <span className="text-[#86868B]/40">·</span>
                    <span className="font-medium capitalize text-[#48484A]">
                      {data.rubro}
                    </span>
                  </>
                )}
              </div>

              {/* Location and Phone in booking header */}
              {(data.config.location || data.config.phone) && (
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[#86868B]">
                  {data.config.location && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {data.config.location}
                    </span>
                  )}
                  {data.config.phone && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {data.config.phone}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-1.5 text-xs font-semibold text-[#1D1D1F]">
              <span className="text-[#34C759]">🔒</span> Reserva Segura
            </span>
          </div>
        </div>

        {/* Selected Service and Staff Summary Pill */}
        {selectedService && (
          <div className="mt-4 pt-3.5 border-t border-black/[0.06] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-1 rounded-lg">
                {selectedService.name}
              </span>
              <span className="text-[#86868B] flex items-center gap-1">
                ⏱ {effectiveDuration} min
              </span>
              {selectedService.price > 0 && (
                <span className="font-bold text-[#1D1D1F] bg-black/[0.04] px-2 py-0.5 rounded-md">
                  ${selectedService.price} {selectedService.currency}
                </span>
              )}
              {selectedStaff && (
                <span className="text-[#48484A] font-medium">
                  · con <strong className="text-[#1D1D1F]">{selectedStaff.name}</strong>
                </span>
              )}
            </div>
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(0)}
                className="text-[11px] font-semibold text-[#007AFF] hover:underline cursor-pointer"
              >
                Cambiar servicio
              </button>
            )}
          </div>
        )}
      </div>

      {/* Apple Fluid Stepper with Continuous Progress Bar */}
      {stepperSteps.length > 1 && (
        <div className="mb-6 space-y-2.5">
          {/* Continuous Micro-Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.04] p-0.5">
            <div
              className="h-full rounded-full bg-[#007AFF] transition-all duration-300 ease-out shadow-xs"
              style={{
                width: `${Math.max(10, ((currentStepIndex + 1) / stepperSteps.length) * 100)}%`,
                backgroundColor: data.config.themeColor || "#007AFF",
              }}
            />
          </div>

          {/* Segmented Step Buttons */}
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
            {stepperSteps.map((stepId, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <button
                  key={stepId}
                  type="button"
                  onClick={() => {
                    if (idx < currentStepIndex) {
                      setCurrentStepIndex(idx);
                    }
                  }}
                  disabled={idx > currentStepIndex}
                  style={isCurrent && data.config.themeColor ? { backgroundColor: data.config.themeColor } : undefined}
                  className={`
                    flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200
                    ${
                      isCurrent
                        ? "bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/25 scale-102 ring-2 ring-[#007AFF]/20"
                        : isCompleted
                          ? "bg-white border border-black/[0.08] text-[#1D1D1F] hover:bg-[#F2F2F7] cursor-pointer active:scale-95 shadow-2xs"
                          : "bg-transparent text-[#86868B]/60 opacity-60 cursor-not-allowed"
                    }
                  `}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCurrent
                        ? "bg-white text-[#007AFF]"
                        : isCompleted
                          ? "bg-[#34C759] text-white"
                          : "bg-black/[0.06] text-[#86868B]"
                    }`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </span>
                  <span>{stepTitles[stepId] || stepId}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Master Step Card Container */}
      <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white/95 p-6 sm:p-8 shadow-[0_12px_44px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-all duration-300">
        {/* Step: Service Selection */}
        {currentStep === "service" && (
          <ServiceSelector
            services={data.services}
            selectedServiceId={state.serviceId}
            onSelectService={handleSelectService}
          />
        )}

        {/* Step: Space-First Court/Resource Selection (Padel/Sports) */}
        {currentStep === "resource_first" && (
          <ResourceSelector
            resources={compatibleResources}
            selectedResourceId={state.resourceId}
            onSelectResource={handleSelectResource}
            title={labels.resourceStepTitle || "Elige tu cancha o espacio"}
            badgeLabel={labels.resourceBadge || "Cancha / Espacio"}
            isSpaceFirst={true}
          />
        )}

        {/* Step: Modality Selection */}
        {currentStep === "modality" && (
          <ModalitySelector
            selectedModality={state.modality}
            onSelectModality={handleSelectModality}
          />
        )}

        {/* Step: Location Selection */}
        {currentStep === "location" && (
          <LocationSelector
            locations={data.locations}
            selectedLocationId={state.locationId}
            onSelectLocation={handleSelectLocation}
            title={labels.locationStepTitle || "Elige tu sucursal o sede"}
          />
        )}

        {/* Step: Staff Selection */}
        {currentStep === "staff" && (
          <StaffSelector
            staff={compatibleStaff}
            selectedStaffId={state.staffId}
            onSelectStaff={handleSelectStaff}
            title={labels.staffStepTitle || `Elige tu ${labels.staff.toLowerCase()}`}
            allowAnyStaff={true}
          />
        )}

        {/* Step: Resource Selection */}
        {currentStep === "resource" && (
          <ResourceSelector
            resources={compatibleResources}
            selectedResourceId={state.resourceId}
            onSelectResource={handleSelectResource}
            title={labels.resourceStepTitle || "Selecciona un recurso o espacio"}
            badgeLabel={labels.resourceBadge || "Recurso"}
            isSpaceFirst={false}
          />
        )}

        {/* Step: Date Calendar Selection */}
        {currentStep === "date" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B]">
                Paso {currentStepIndex + 1} de {stepperSteps.length}
              </span>
              <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                Elige la fecha de tu {labels.appointment.toLowerCase()}
              </h3>
              <p className="text-xs text-[#86868B] mt-0.5">
                Los días con horarios disponibles están identificados con un punto verde.
              </p>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-[#FBFBFD] p-5 shadow-inner">
              <MonthCalendar
                selectedDate={state.date}
                onSelectDate={handleSelectDate}
                availableDates={availableDates}
                businessDaysOff={businessDaysOff}
                isLoading={isMonthLoading}
                onMonthChange={(y, m) => {
                  setCalendarYear(y);
                  setCalendarMonth(m);
                }}
              />
            </div>
          </div>
        )}

        {/* Step: Time Slot Selection */}
        {currentStep === "time" && (
          <div className="space-y-4">
            <TimeSlotSelector
              slots={slots}
              selectedTime={state.time}
              isLoading={slotsLoading}
              error={slotsError}
              onSelectTime={handleSelectTime}
              dateLabel={state.date ? formatDateLabel(state.date) : ""}
              onBackDate={goToPrevStep}
            />
          </div>
        )}

        {/* Step: Dynamic Booking Client Form */}
        {currentStep === "form" && state.date && state.time && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B]">
                Último paso
              </span>
              <h3 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                Completa tus datos de contacto
              </h3>
            </div>
            <DynamicBookingForm
              slug={data.slug}
              date={state.date}
              time={state.time}
              slotDuration={effectiveDuration}
              formFields={data.config.formFields}
              onSuccess={handleBookingCreated}
              onBack={goToPrevStep}
              serviceId={state.serviceId}
              serviceName={selectedService?.name || null}
              servicePrice={selectedService?.price || null}
              serviceCurrency={selectedService?.currency || "USD"}
              staffId={state.staffId}
              locationId={state.locationId}
              resourceId={state.resourceId}
            />
          </div>
        )}

        {/* Step: Upfront Payment */}
        {currentStep === "payment" && (
          <div className="space-y-5 animate-in fade-in duration-200 text-left">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B]">
                Pago Anticipado
              </span>
              <h3 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                Confirma tu pago para asegurar tu lugar
              </h3>
            </div>

            <div className="rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/5 p-5 space-y-3">
              <p className="text-xs text-[#48484A] leading-relaxed">
                Este servicio requiere comprobante de pago previo para confirmar la cita.
              </p>
              <div className="space-y-2 rounded-xl bg-white p-3 text-xs border border-[#E5E5EA]">
                {data.config.bankName && (
                  <div className="flex justify-between">
                    <span className="text-[#86868B]">Banco:</span>
                    <span className="font-bold">{data.config.bankName}</span>
                  </div>
                )}
                {data.config.bankClabe && (
                  <div className="flex justify-between">
                    <span className="text-[#86868B]">CLABE:</span>
                    <span className="font-mono font-bold select-all bg-[#F2F2F7] px-1 rounded">
                      {data.config.bankClabe}
                    </span>
                  </div>
                )}
                {data.config.bankHolder && (
                  <div className="flex justify-between">
                    <span className="text-[#86868B]">Titular:</span>
                    <span className="font-bold">{data.config.bankHolder}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="upfront-proof"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#007AFF] bg-[#007AFF]/5 py-3 text-xs font-bold text-[#007AFF] hover:bg-[#007AFF]/10 cursor-pointer transition-colors active:scale-[0.98]"
              >
                {isUploadingProof ? "Subiendo comprobante…" : "Subir comprobante de pago"}
              </label>
              <input
                id="upfront-proof"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  await handlePaymentProofUpload(e);
                  goToNextStep();
                }}
                disabled={isUploadingProof}
                className="hidden"
              />
              <button
                type="button"
                onClick={goToNextStep}
                className="w-full py-2.5 text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              >
                Subir comprobante más tarde
              </button>
            </div>
          </div>
        )}

        {/* Global Back Button (for steps other than 'form') */}
        {currentStepIndex > 0 && currentStep !== "form" && (
          <div className="mt-6 pt-4 border-t border-[#E5E5EA] flex justify-start">
            <button
              type="button"
              onClick={goToPrevStep}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer active:scale-95"
            >
              ← Volver al paso anterior
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
