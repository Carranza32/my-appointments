"use client";

import React, { useState, useTransition } from "react";
import { getAvailableSlots } from "@/actions/availability";
import { uploadPaymentProofAction } from "@/actions/appointments";
import { MonthCalendar } from "@/components/booking/month-calendar";
import { DynamicBookingForm } from "@/components/booking/dynamic-booking-form";
import type { FormFieldDef } from "@/lib/form-fields";
import { formatDateLabel, buildAppointmentRange } from "@/lib/booking";
import { getLabels } from "@/lib/labels";
import { getRubroConfig } from "@/lib/rubros";
import { SUPPORTED_TIMEZONES } from "@/lib/regional";

const COMMON_TIMEZONES = SUPPORTED_TIMEZONES;

export type ServiceBookingItem = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  bufferTime: number;
  price: number;
  currency: string;
  staffIds: string[];
};

type Props = {
  slug: string;
  businessName: string;
  rubro: string;
  formFields: FormFieldDef[];
  slotDuration: number;
  avatarUrl?: string | null;
  description?: string | null;
  timezone?: string | null;
  initialLocations?: { id: string; name: string; address: string; phone: string | null }[];
  initialStaff?: { id: string; name: string; email: string; phone: string | null; description: string | null; avatarUrl: string | null; weeklyHours: any }[];
  initialServices?: ServiceBookingItem[];
  acceptBankTransfer?: boolean;
  bankName?: string | null;
  bankClabe?: string | null;
  bankHolder?: string | null;
  bankInstructions?: string | null;
  whatsappNumber?: string | null;
  enableWhatsApp?: boolean;
};

type Step = "location" | "service" | "staff" | "date" | "time" | "form" | "done";

// ── Icons ─────────────────────────────────────────────────────────────────
function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="3" ry="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="12 7 12 12 15 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function SparklesIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function CheckIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function GoogleCalIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.5 3h-1.5V1.5A1.5 1.5 0 0016.5 0h-9A1.5 1.5 0 006 1.5V3H4.5A4.5 4.5 0 000 7.5v12A4.5 4.5 0 004.5 24h15a4.5 4.5 0 004.5-4.5v-12A4.5 4.5 0 0019.5 3zM7.5 1.5h9V3h-9V1.5zm15 18A3 3 0 0119.5 22.5h-15A3 3 0 011.5 19.5V10.5h21v9zm0-10.5h-21V7.5A3 3 0 014.5 4.5H6v1.5a1.5 1.5 0 003 0V4.5h6v1.5a1.5 1.5 0 003 0V4.5h1.5A3 3 0 0122.5 7.5V9z"/>
    </svg>
  );
}

export function BookingPortal({
  slug,
  businessName,
  rubro,
  formFields,
  slotDuration,
  avatarUrl,
  description,
  timezone,
  initialLocations = [],
  initialStaff = [],
  initialServices = [],
  acceptBankTransfer = false,
  bankName = "",
  bankClabe = "",
  bankHolder = "",
  bankInstructions = "",
  whatsappNumber = "",
  enableWhatsApp = false,
}: Props) {
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const labels = getLabels(rubro);
  const rubroConfig = getRubroConfig(rubro);
  
  const showLocationsStep = initialLocations && initialLocations.length > 1;
  const showServicesStep = initialServices && initialServices.length > 1;

  // Payments / upload state
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<any>(() => {
    if (initialLocations && initialLocations.length === 1) return initialLocations[0];
    return null;
  });

  const [selectedService, setSelectedService] = useState<ServiceBookingItem | null>(() => {
    if (initialServices && initialServices.length === 1) return initialServices[0];
    return null;
  });

  const [selectedStaff, setSelectedStaff] = useState<any>(() => {
    if (initialStaff && initialStaff.length === 1) return initialStaff[0];
    return null;
  });

  // Filter available staff based on selected service
  const availableStaffForService = React.useMemo(() => {
    if (!initialStaff || initialStaff.length === 0) return [];
    if (!selectedService || !selectedService.staffIds || selectedService.staffIds.length === 0) {
      return initialStaff;
    }
    return initialStaff.filter((st) => selectedService.staffIds.includes(st.id));
  }, [initialStaff, selectedService]);

  const showStaffStep = availableStaffForService.length > 1;

  const [step, setStep] = useState<Step>(() => {
    if (showLocationsStep) return "location";
    if (showServicesStep) return "service";
    if (initialStaff && initialStaff.length > 1) return "staff";
    return "date";
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tzLabel = COMMON_TIMEZONES.find((t) => t.value === timezone)?.label || timezone || "🇸🇻 El Salvador (GMT-6)";

  const initials = businessName
    ? businessName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "AP";

  const effectiveSlotDuration = selectedService?.duration || slotDuration || 30;

  function selectLocation(loc: any) {
    setSelectedLocation(loc);
    if (showServicesStep) setStep("service");
    else if (showStaffStep) setStep("staff");
    else setStep("date");
  }

  function selectService(srv: ServiceBookingItem) {
    setSelectedService(srv);
    const matchingStaff = (!srv.staffIds || srv.staffIds.length === 0)
      ? initialStaff
      : initialStaff.filter((st) => srv.staffIds.includes(st.id));

    if (matchingStaff.length === 1) {
      setSelectedStaff(matchingStaff[0]);
      setStep("date");
    } else if (matchingStaff.length > 1) {
      setStep("staff");
    } else {
      setSelectedStaff(null);
      setStep("date");
    }
  }

  function selectStaff(member: any) {
    setSelectedStaff(member);
    setStep("date");
  }

  function loadSlots(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
    setSlots([]);
    setSlotsError(null);
    setStep("time");

    startTransition(async () => {
      const result = await getAvailableSlots(
        slug,
        new Date(`${date}T12:00:00`),
        selectedStaff?.id,
        selectedService?.id
      );
      if ("error" in result) { setSlotsError(result.error); return; }
      setSlots(result.slots);
    });
  }

  function selectTime(time: string) {
    setSelectedTime(time);
    setStep("form");
  }

  function resetBooking() {
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    setSlotsError(null);
    if (showLocationsStep) setStep("location");
    else if (showServicesStep) setStep("service");
    else if (showStaffStep) setStep("staff");
    else setStep("date");
  }

  // ── STEPPER DEFINITION ────────────────────────────────────────────────
  const stepDefs: { key: Step[]; label: string; icon: React.ReactNode }[] = [
    ...(showLocationsStep ? [{ key: ["location" as Step], label: "Seleccionar sede", icon: <PinIcon /> }] : []),
    ...(showServicesStep ? [{ key: ["service" as Step], label: "Seleccionar servicio", icon: <SparklesIcon /> }] : []),
    ...(showStaffStep ? [{ key: ["staff" as Step], label: "Seleccionar especialista", icon: <UserIcon /> }] : []),
    { key: ["date", "time"] as Step[], label: "Seleccionar fecha", icon: <CalendarIcon /> },
    { key: ["form"] as Step[], label: "Tus datos", icon: <ClockIcon /> },
    { key: ["done"] as Step[], label: "Confirmación", icon: <CheckIcon className="h-4 w-4" /> },
  ];

  // ── DONE SCREEN ───────────────────────────────────────────────────────
  if (step === "done") {
    let googleUrl = "";
    let appleUrl = "";
    let whatsappUrl = "";
    if (whatsappNumber && selectedDate && selectedTime) {
      const cleanPhone = whatsappNumber.replace(/[\s\-()+]/g, "");
      const msg = `Hola! Acabo de agendar una ${labels.appointment.toLowerCase()} para ${selectedService ? selectedService.name : "servicio"} el ${selectedDate} a las ${selectedTime} hs. Quedo al pendiente.`;
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!createdAppointmentId) {
        setUploadError("Error: No se encontró la cita de referencia.");
        return;
      }

      setUploadError(null);
      setIsUploadingProof(true);

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const res = await uploadPaymentProofAction(createdAppointmentId, base64data);
          if (res.error) {
            setUploadError(res.error);
          } else {
            setPaymentProofUrl(base64data);
          }
          setIsUploadingProof(false);
        };
        reader.onerror = () => {
          setUploadError("Error al leer el archivo. Intenta de nuevo.");
          setIsUploadingProof(false);
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || "Error al procesar el archivo.");
        setIsUploadingProof(false);
      }
    };

    if (selectedDate && selectedTime) {
      const { startTime, endTime } = buildAppointmentRange(selectedDate, selectedTime, effectiveSlotDuration);
      const startStr = startTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const endStr = endTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const nowStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const details = `Tu ${labels.appointment.toLowerCase()} (${selectedService ? selectedService.name : ""}) con ${businessName} está agendada para el día ${selectedDate} a las ${selectedTime}. Duración: ${effectiveSlotDuration} minutos.`;

      googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${labels.appointment}: ${selectedService?.name || businessName}`)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}`;

      const icsContent = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MyAppointment//NONSGML Client//EN",
        "BEGIN:VEVENT",
        `UID:${nowStr}@my-appointment`,
        `DTSTAMP:${nowStr}`, `DTSTART:${startStr}`, `DTEND:${endStr}`,
        `SUMMARY:${labels.appointment}: ${selectedService?.name || businessName}`, `DESCRIPTION:${details}`,
        "END:VEVENT", "END:VCALENDAR",
      ].join("\r\n");
      appleUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden bg-booking-page">
        {/* Background orbs */}
        <div className="booking-orb-blue w-[500px] h-[500px] -top-32 -left-32 opacity-60" />
        <div className="booking-orb-lavender w-[450px] h-[450px] -bottom-20 -right-20 opacity-50" />

        {/* Main confirmation card */}
        <div className="relative z-10 w-full max-w-md bg-frost-card rounded-3xl p-8 animate-in zoom-in-95 fade-in duration-400">
          <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-green-400/8 to-transparent blur-2xl rounded-3xl pointer-events-none" />

          {/* Check icon */}
          <div className="flex justify-center mb-6">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white border border-green-200/60 animate-pulse-green shadow-sm">
              <div className="absolute inset-0 rounded-full bg-green-50 opacity-80" />
              <CheckIcon className="h-9 w-9 relative z-10 text-green-500" />
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-center text-2xl font-bold text-[#1b1c1c] mb-1"
            style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}
          >
            ¡{labels.appointment} confirmada!
          </h1>
          <p className="text-center text-sm text-[#414754] mb-7 leading-relaxed">
            Tu {labels.appointment.toLowerCase()} con <strong className="font-semibold text-[#1b1c1c]">{businessName}</strong> ha sido
            agendada con éxito.
          </p>

          {/* Appointment summary card */}
          <div className="rounded-2xl bg-[#f5f3f3]/80 border border-white/70 p-4 mb-6 backdrop-blur-sm shadow-2xs">
            {/* Service row if available */}
            {selectedService && (
              <div className="mb-3.5 pb-3 border-b border-[#e4e2e1]/60 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#727785] block">Servicio</span>
                  <span className="text-sm font-extrabold text-[#007AFF]">{selectedService.name}</span>
                </div>
                {selectedService.price > 0 && (
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#727785] block">Total</span>
                    <span className="text-sm font-extrabold text-emerald-700">${selectedService.price} {selectedService.currency}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <div className="h-12 w-12 rounded-2xl overflow-hidden border border-white/60 shadow-sm">
                    <img src={avatarUrl} alt={businessName} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#007AFF] flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {initials}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white block" />
              </div>

              {/* Name + specialist */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#727785] mb-0.5">Especialista</p>
                <p
                  className="text-sm font-bold text-[#1b1c1c] truncate"
                  style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}
                >
                  {selectedStaff ? selectedStaff.name : businessName}
                </p>
              </div>

              {/* CONFIRMED badge */}
              <span className="shrink-0 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700">
                Confirmada
              </span>
            </div>

            {/* Date + Time row */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e4e2e1]/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#727785] mb-1">Fecha</p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1b1c1c]">
                  <CalendarIcon className="h-3.5 w-3.5 text-[#007AFF]" />
                  <span>{selectedDate ? formatDateLabel(selectedDate) : "—"}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#727785] mb-1">Horario ({effectiveSlotDuration}m)</p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1b1c1c]">
                  <ClockIcon className="h-3.5 w-3.5 text-[#007AFF]" />
                  <span>{selectedTime ?? "—"}</span>
                </div>
              </div>
            </div>

            {/* Location if available */}
            {selectedLocation && (
              <div className="mt-3 pt-3 border-t border-[#e4e2e1]/60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#727785] mb-1">Sede</p>
                <div className="flex items-start gap-1.5 text-sm font-semibold text-[#1b1c1c]">
                  <PinIcon className="h-3.5 w-3.5 text-[#007AFF] shrink-0 mt-0.5" />
                  <span>{selectedLocation.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bank Transfer Instructions */}
          {acceptBankTransfer && (
            <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-5 mb-5 space-y-4 text-left">
              <div>
                <h4 className="text-xs font-semibold text-[#007AFF] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>🏦</span> Pago por Transferencia
                </h4>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Para confirmar tu {labels.appointment.toLowerCase()}, por favor realiza la transferencia bancaria y sube tu comprobante abajo:
                </p>
              </div>

              <div className="text-xs space-y-2 border-y border-black/[0.06] py-3 text-[#1D1D1F]">
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Banco:</span>
                  <span className="font-medium">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">CLABE:</span>
                  <span className="font-medium font-mono select-all bg-black/[0.04] px-1.5 py-0.5 rounded-md">{bankClabe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Titular:</span>
                  <span className="font-medium">{bankHolder}</span>
                </div>
              </div>

              {bankInstructions && (
                <div className="text-xs text-[#FF9500] bg-[#FF9500]/10 px-3 py-2.5 rounded-xl border border-[#FF9500]/20 leading-relaxed">
                  📢 <strong>Instrucciones:</strong> {bankInstructions}
                </div>
              )}

              {/* Receipt File Uploader */}
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                  Comprobante de Transferencia *
                </p>
                {paymentProofUrl ? (
                  <div className="rounded-xl border border-[#34C759]/20 bg-[#34C759]/10 px-3.5 py-3 flex items-center justify-between text-xs text-[#34C759] font-medium">
                    <span className="flex items-center gap-1.5">
                      <CheckIcon className="h-4 w-4 text-[#34C759] shrink-0" />
                      Comprobante subido con éxito
                    </span>
                    <button
                      type="button"
                      onClick={() => setPaymentProofUrl(null)}
                      className="text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      disabled={isUploadingProof}
                      id="payment-proof-input"
                      className="hidden"
                    />
                    <label
                      htmlFor="payment-proof-input"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-black/[0.08] hover:border-[#007AFF]/40 hover:bg-black/[0.01] rounded-2xl p-4 cursor-pointer transition-all text-center select-none active:scale-[0.98]"
                    >
                      {isUploadingProof ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#86868B]">
                          <svg className="animate-spin h-4 w-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Subiendo comprobante...</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-lg mb-1">📸</span>
                          <span className="text-xs font-medium text-[#1D1D1F]">Seleccionar Comprobante</span>
                          <span className="text-[11px] text-[#86868B] mt-0.5">Formatos: JPG, PNG (Max. 5MB)</span>
                        </>
                      )}
                    </label>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs font-medium text-[#FF3B30]">{uploadError}</p>
                )}
              </div>
            </div>
          )}

          {/* Calendar action buttons */}
          {selectedDate && selectedTime && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#e4e2e1] bg-white/80 px-4 py-3 text-xs font-semibold text-[#414754] hover:border-[#007AFF]/30 hover:bg-[#f0f4ff] transition-all duration-150 cursor-pointer"
              >
                <GoogleCalIcon className="h-4 w-4 text-[#007AFF]" />
                Agregar a Google
              </a>
              <a
                href={appleUrl}
                download={`cita-${selectedDate}.ics`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#e4e2e1] bg-white/80 px-4 py-3 text-xs font-semibold text-[#414754] hover:border-[#007AFF]/30 hover:bg-[#f0f4ff] transition-all duration-150 cursor-pointer"
              >
                <CalendarIcon className="h-4 w-4 text-[#414754]" />
                Agregar a Apple
              </a>
            </div>
          )}

          {/* WhatsApp Confirmation button */}
          {whatsappUrl && (
            <div className="mb-5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white px-5 py-3.5 text-sm font-bold shadow-md shadow-emerald-500/10 hover:bg-emerald-700 active:scale-[0.99] transition-all cursor-pointer text-center"
              >
                <svg className="h-4.5 w-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.077-1.331a9.907 9.907 0 004.93 1.306h.004c5.507 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.178-2.923-7.065C17.197 3.037 14.686 2 12.012 2zm5.726 14.127c-.246.696-1.427 1.285-1.961 1.344-.486.053-.984.095-3.136-.773-2.753-1.111-4.509-3.905-4.646-4.09-.138-.184-1.12-1.488-1.12-2.839 0-1.35.707-2.014.953-2.28.246-.265.541-.332.721-.332.18 0 .361.001.517.008.163.007.382-.062.597.457.22.533.75 1.83.815 1.962.065.132.109.286.022.459-.087.172-.131.28-.262.433-.131.152-.275.339-.393.455-.131.129-.268.27-.116.533.152.263.676 1.116 1.45 1.808.998.892 1.838 1.168 2.099 1.298.262.13.414.108.567-.068.152-.176.656-.762.831-1.022.175-.26.35-.217.59-.13.24.086 1.528.72 1.791.85.263.13.437.196.502.308.066.113.066.654-.18 1.35z"/>
                </svg>
                Confirmar Cita por WhatsApp 💬
              </a>
            </div>
          )}

          {/* Cancel link */}
          <div className="text-center">
            <button
              type="button"
              onClick={resetBooking}
              className="text-xs text-[#727785] hover:text-[#007AFF] underline-offset-2 hover:underline transition-colors cursor-pointer"
            >
              Agendar otra {labels.appointment.toLowerCase()}
            </button>
          </div>
        </div>

        {/* Bottom trust badges */}
        <div className="relative z-10 mt-6 flex items-center gap-5 text-[11px] font-semibold text-[#727785]">
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Reserva Segura
          </span>
          <span className="text-[#c1c6d6]">·</span>
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Soporte 24/7
          </span>
        </div>
      </div>
    );
  }

  // ── LOCATION SELECTION ────────────────────────────────────────────────
  if (step === "location") {
    return (
      <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-300">
        <div className="bg-frost-card rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <LeftPanel
              avatarUrl={avatarUrl}
              businessName={businessName}
              rubro={rubro}
              initials={initials}
              stepDefs={stepDefs}
              currentStep={step}
              selectedService={selectedService}
            />
            <div className="lg:col-span-8 p-7">
              <h2 className="text-xl font-bold text-[#1b1c1c] mb-1" style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}>
                Selecciona la sede
              </h2>
              <p className="text-sm text-[#414754] mb-6">Por favor selecciona la sucursal donde deseas tu {labels.appointment.toLowerCase()}.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {initialLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => selectLocation(loc)}
                    type="button"
                    className="flex flex-col text-left p-5 rounded-2xl border border-[#e4e2e1] bg-white/70 hover:border-[#007AFF]/50 hover:bg-[#f0f4ff]/60 transition-all duration-200 cursor-pointer group hover:shadow-sm"
                  >
                    <div className="h-10 w-10 rounded-xl bg-[#e8effe] flex items-center justify-center text-[#007AFF] mb-3 group-hover:scale-105 transition-transform">
                      <PinIcon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm text-[#1b1c1c]">{loc.name}</h3>
                    <p className="text-xs text-[#414754] mt-1">{loc.address}</p>
                    {loc.phone && (
                      <p className="text-[11px] text-[#727785] mt-2 pt-2 border-t border-[#e4e2e1] w-full">📞 {loc.phone}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SERVICE SELECTION ─────────────────────────────────────────────────
  if (step === "service") {
    return (
      <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-300">
        <div className="bg-frost-card rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <LeftPanel
              avatarUrl={avatarUrl}
              businessName={businessName}
              rubro={rubro}
              initials={initials}
              stepDefs={stepDefs}
              currentStep={step}
              selectedService={selectedService}
            />
            <div className="lg:col-span-8 p-7">
              <h2 className="text-xl font-bold text-[#1b1c1c] mb-1" style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}>
                Selecciona un servicio
              </h2>
              <p className="text-sm text-[#414754] mb-6">Elige el tipo de sesión o consulta que necesitas.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {initialServices.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => selectService(srv)}
                    type="button"
                    className="flex flex-col text-left p-5 rounded-2xl border border-[#e4e2e1] bg-white/75 hover:border-[#007AFF]/50 hover:bg-[#f0f4ff]/60 transition-all duration-200 cursor-pointer group hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="h-10 w-10 rounded-xl bg-[#e8effe] flex items-center justify-center text-[#007AFF] group-hover:scale-105 transition-transform">
                        <SparklesIcon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg px-2.5 py-1">
                        {srv.price > 0 ? `$${srv.price} ${srv.currency}` : "Gratis / Incluido"}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#1b1c1c] group-hover:text-[#007AFF] transition-colors">{srv.name}</h3>
                    {srv.description && (
                      <p className="text-xs text-[#414754] mt-1 line-clamp-2 leading-relaxed">{srv.description}</p>
                    )}
                    <div className="mt-3 pt-2.5 border-t border-[#e4e2e1]/70 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <ClockIcon className="h-3.5 w-3.5 text-[#007AFF]" />
                      <span>{srv.duration} minutos de duración</span>
                    </div>
                  </button>
                ))}
              </div>
              {showLocationsStep && (
                <button type="button" onClick={() => setStep("location")} className="mt-6 text-xs font-semibold text-[#727785] hover:text-[#007AFF] transition-colors flex items-center gap-1 cursor-pointer">
                  ← Volver a sedes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STAFF SELECTION ───────────────────────────────────────────────────
  if (step === "staff") {
    return (
      <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-300">
        <div className="bg-frost-card rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <LeftPanel
              avatarUrl={avatarUrl}
              businessName={businessName}
              rubro={rubro}
              initials={initials}
              stepDefs={stepDefs}
              currentStep={step}
              selectedService={selectedService}
            />
            <div className="lg:col-span-8 p-7">
              <h2 className="text-xl font-bold text-[#1b1c1c] mb-1" style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}>
                Selecciona tu especialista
              </h2>
              <p className="text-sm text-[#414754] mb-6">Selecciona el profesional que te atenderá.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => selectStaff(null)}
                  type="button"
                  className="flex flex-col text-left p-5 rounded-2xl border border-[#e4e2e1] bg-white/70 hover:border-[#007AFF]/50 hover:bg-[#f0f4ff]/60 transition-all duration-200 cursor-pointer group hover:shadow-sm"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#e8effe] flex items-center justify-center text-[#007AFF] mb-3 group-hover:scale-105 transition-transform">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-[#1b1c1c]">Sin preferencia</h3>
                  <p className="text-xs text-[#414754] mt-1">Asignar automáticamente según disponibilidad.</p>
                </button>
                {availableStaffForService.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => selectStaff(member)}
                    type="button"
                    className="flex flex-col text-left p-5 rounded-2xl border border-[#e4e2e1] bg-white/70 hover:border-[#007AFF]/50 hover:bg-[#f0f4ff]/60 transition-all duration-200 cursor-pointer group hover:shadow-sm"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#e8effe] to-[#dce3f2] flex items-center justify-center overflow-hidden mb-3 group-hover:scale-105 transition-transform border border-white/60">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-[#007AFF]">
                          {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-[#1b1c1c]">{member.name}</h3>
                    <p className="text-xs text-[#414754] mt-1 line-clamp-2">{member.description || "Especialista disponible."}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-4">
                {showServicesStep && (
                  <button type="button" onClick={() => setStep("service")} className="text-xs font-semibold text-[#727785] hover:text-[#007AFF] transition-colors flex items-center gap-1 cursor-pointer">
                    ← Volver a servicios
                  </button>
                )}
                {showLocationsStep && !showServicesStep && (
                  <button type="button" onClick={() => setStep("location")} className="text-xs font-semibold text-[#727785] hover:text-[#007AFF] transition-colors flex items-center gap-1 cursor-pointer">
                    ← Volver a sedes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DATE / TIME SELECTION (main booking view) ─────────────────────────
  if (step === "date" || step === "time") {
    return (
      <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-300">
        <div className="bg-frost-card rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            {/* ── Left: Profile + Stepper ─────────────────────────── */}
            <LeftPanel
              avatarUrl={avatarUrl}
              businessName={businessName}
              rubro={rubro}
              initials={initials}
              stepDefs={stepDefs}
              currentStep={step}
              selectedService={selectedService}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              slotDuration={effectiveSlotDuration}
              tzLabel={tzLabel}
            />

            {/* ── Right: Calendar + Slots ─────────────────────────── */}
            <div className="lg:col-span-8 p-7 flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2
                    className="text-2xl font-bold text-[#1b1c1c] leading-tight"
                    style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}
                  >
                    Programa tu visita
                  </h2>
                  {selectedService && (
                    <span className="text-xs font-bold text-[#007AFF] bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                      {selectedService.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#414754]">Elige la fecha y hora que mejor se adapte a tu horario.</p>
              </div>

              {/* Calendar */}
              <div className="mb-6">
                <MonthCalendar selectedDate={selectedDate} onSelectDate={loadSlots} />
              </div>

              {/* Slots section */}
              <div className="flex-1">
                {selectedDate && (
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-3.5 w-3.5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="5" />
                      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#414754]">
                      Horarios disponibles para el {formatDateLabel(selectedDate)}
                    </p>
                  </div>
                )}

                {/* Loading state */}
                {pending && (
                  <div className="flex items-center gap-3 py-6">
                    <svg className="h-5 w-5 animate-spin text-[#007AFF]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm text-[#414754]">Cargando horarios disponibles…</span>
                  </div>
                )}

                {/* Empty state (no date selected) */}
                {!pending && !selectedDate && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-[#727785]">
                    <CalendarIcon className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Selecciona una fecha en el calendario</p>
                  </div>
                )}

                {/* Slots error */}
                {!pending && slotsError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                    {slotsError}
                  </div>
                )}

                {/* No slots available */}
                {!pending && selectedDate && !slotsError && slots.length === 0 && step === "time" && (
                  <p className="text-sm text-[#727785] py-4 text-center">
                    ⚠️ No hay horarios disponibles para este día. Por favor intenta con otra fecha.
                  </p>
                )}

                {/* Slots grid */}
                {!pending && slots.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => selectTime(slot)}
                        className={`slot-chip text-center ${selectedTime === slot ? "slot-chip-selected" : ""}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer: Next available + CTA */}
              <div className="mt-6 flex items-center justify-between gap-4 pt-5 border-t border-[#e4e2e1]/60">
                <div className="flex items-center gap-2 text-xs text-[#414754] bg-[#f0f4ff] rounded-full px-3 py-2 border border-[#e8effe]">
                  <svg className="h-3.5 w-3.5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                  </svg>
                  <span className="font-semibold">
                    {selectedDate && selectedTime
                      ? `Seleccionado: ${selectedTime}`
                      : "Selecciona un horario"}
                  </span>
                </div>

                {selectedTime && (
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/10 hover:bg-[#005cbf] active:scale-[0.97] transition-all duration-150 cursor-pointer"
                  >
                    Continuar
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM STEP ─────────────────────────────────────────────────────────
  if (step === "form" && selectedDate && selectedTime) {
    return (
      <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-350">
        <div className="bg-frost-card rounded-3xl overflow-hidden">
          {/* Header strip */}
          <div className="flex items-center gap-3 px-7 py-5 border-b border-[#e4e2e1]/60">
            {avatarUrl ? (
              <div className="h-11 w-11 rounded-xl overflow-hidden border border-white/60 shadow-sm shrink-0">
                <img src={avatarUrl} alt={businessName} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#007AFF] flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1
                className="text-sm font-bold text-[#1b1c1c] truncate"
                style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}
              >
                {businessName}
              </h1>
              <p className="text-[11px] font-semibold text-[#727785] uppercase tracking-wider">{rubroConfig.label}</p>
            </div>
            {/* Appointment summary chip */}
            <div className="hidden sm:flex items-center gap-2 bg-[#f0f4ff] rounded-full px-3 py-1.5 text-xs font-semibold text-[#414754] border border-[#e8effe] shrink-0">
              <CalendarIcon className="h-3.5 w-3.5 text-[#007AFF]" />
              <span>{formatDateLabel(selectedDate)}</span>
              <span className="text-[#c1c6d6]">·</span>
              <ClockIcon className="h-3.5 w-3.5 text-[#007AFF]" />
              <span>{selectedTime}</span>
            </div>
          </div>

          <div className="p-7">
            <h2
              className="text-xl font-bold text-[#1b1c1c] mb-1"
              style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}
            >
              Completa tus datos
            </h2>
            <p className="text-sm text-[#414754] mb-6">
              Por favor ingresa los datos solicitados para confirmar tu {labels.appointment.toLowerCase()}.
            </p>

            <DynamicBookingForm
              slug={slug}
              date={selectedDate}
              time={selectedTime}
              slotDuration={effectiveSlotDuration}
              serviceId={selectedService?.id}
              serviceName={selectedService?.name}
              servicePrice={selectedService?.price}
              serviceCurrency={selectedService?.currency}
              formFields={formFields}
              onSuccess={(appointmentId) => {
                setCreatedAppointmentId(appointmentId);
                setStep("done");
              }}
              onBack={() => setStep("time")}
              staffId={selectedStaff?.id}
              locationId={selectedLocation?.id}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Left Panel (shared across steps) ─────────────────────────────────────
interface LeftPanelProps {
  avatarUrl?: string | null;
  businessName: string;
  rubro: string;
  initials: string;
  stepDefs: { key: Step[]; label: string; icon: React.ReactNode }[];
  currentStep: Step;
  selectedService?: ServiceBookingItem | null;
  selectedDate?: string | null;
  selectedTime?: string | null;
  slotDuration?: number;
  tzLabel?: string;
}

function LeftPanel({
  avatarUrl,
  businessName,
  rubro,
  initials,
  stepDefs,
  currentStep,
  selectedService,
  selectedDate,
  selectedTime,
  slotDuration,
  tzLabel,
}: LeftPanelProps) {
  const order: Step[] = ["location", "service", "staff", "date", "time", "form", "done"];
  const currentIdx = order.indexOf(currentStep);
  const labels = getLabels(rubro);
  const rubroConfig = getRubroConfig(rubro);

  return (
    <div className="lg:col-span-4 p-7 flex flex-col items-center lg:items-start border-b lg:border-b-0 lg:border-r border-[#e4e2e1]/50">
      {/* Doctor / Business avatar */}
      <div className="relative mb-4">
        {avatarUrl ? (
          <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-white shadow-sm shadow-blue-500/10">
            <img src={avatarUrl} alt={businessName} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#007AFF] flex items-center justify-center text-white text-2xl font-bold shadow-sm shadow-blue-500/10">
            {initials}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white block shadow-sm" />
      </div>

      {/* Name + specialty */}
      <h2
        className="text-lg font-bold text-[#1b1c1c] text-center lg:text-left leading-tight"
        style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}
      >
        {businessName}
      </h2>
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#727785] mt-0.5 text-center lg:text-left">
        {rubroConfig.label}
      </p>

      {/* Service badge if selected */}
      {selectedService && (
        <div className="mt-4 p-3 bg-blue-50/80 border border-blue-100 rounded-2xl w-full hidden lg:block">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#007AFF]">{selectedService.name}</span>
            {selectedService.price > 0 && (
              <span className="font-bold text-emerald-700">${selectedService.price} {selectedService.currency}</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold">⏱️ {selectedService.duration} min</p>
        </div>
      )}

      {/* Details */}
      {(selectedDate || selectedTime || slotDuration || tzLabel) && (
        <div className="mt-4 w-full space-y-2.5 hidden lg:block">
          {slotDuration && (
            <div className="flex items-center gap-2 text-xs text-[#414754]">
              <div className="h-6 w-6 rounded-lg bg-[#f0f4ff] flex items-center justify-center text-[#007AFF] shrink-0">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" /></svg>
              </div>
              <span>Duración: <strong>{slotDuration} min</strong></span>
            </div>
          )}
          {tzLabel && (
            <div className="flex items-center gap-2 text-xs text-[#414754]">
              <div className="h-6 w-6 rounded-lg bg-[#f0f4ff] flex items-center justify-center text-[#007AFF] shrink-0">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>
              </div>
              <span className="truncate">{tzLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* Stepper */}
      <div className="mt-6 w-full space-y-0 hidden lg:block pt-5 border-t border-[#e4e2e1]/50">
        {stepDefs.map((s, i) => {
          const isActive = s.key.includes(currentStep);
          const maxKeyIdx = Math.max(...s.key.map((k) => order.indexOf(k)));
          const isDone = currentIdx > maxKeyIdx;
          const isLast = i === stepDefs.length - 1;

          return (
            <div key={i} className="relative flex items-start gap-3 pb-5">
              {!isLast && (
                <div className="absolute left-3.5 top-7 bottom-0 w-[1px] bg-gradient-to-b from-[#c7d8f8] to-transparent" />
              )}

              <div
                className={`
                  shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200
                  ${isDone
                    ? "bg-[#007AFF] text-white shadow-sm shadow-blue-500/10"
                    : isActive
                      ? "bg-[#007AFF] text-white shadow-sm shadow-blue-500/10"
                      : "bg-[#f5f3f3] text-[#c1c6d6] border border-[#e4e2e1]"}
                `}
              >
                {isDone ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`${isActive ? "text-white" : "text-[#c1c6d6]"}`}>
                    {React.isValidElement(s.icon)
                      ? React.cloneElement(s.icon as React.ReactElement<{ className?: string }>, { className: "h-3.5 w-3.5" })
                      : s.icon}
                  </span>
                )}
              </div>

              <div className="pt-0.5">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? "text-[#007AFF]" : isDone ? "text-[#414754]" : "text-[#c1c6d6]"}`}>
                  Step {String(i + 1).padStart(2, "0")}
                </p>
                <p className={`text-xs font-semibold leading-tight ${isActive ? "text-[#1b1c1c]" : isDone ? "text-[#414754]" : "text-[#c1c6d6]"}`}>
                  {s.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
