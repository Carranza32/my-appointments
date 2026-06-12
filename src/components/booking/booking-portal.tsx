"use client";

import { useState, useTransition } from "react";
import { getAvailableSlots } from "@/actions/availability";
import { MonthCalendar } from "@/components/booking/month-calendar";
import { DynamicBookingForm } from "@/components/booking/dynamic-booking-form";
import type { FormFieldDef } from "@/lib/form-fields";
import { formatDateLabel, buildAppointmentRange } from "@/lib/booking";
import { Rubro } from "@prisma/client";

const RUBRO_LABELS: Record<Rubro, string> = {
  SALUD: "Salud y Bienestar",
  BELLEZA: "Estética y Belleza",
  CONSULTORIA: "Consultoría y Asesoría",
};

const COMMON_TIMEZONES = [
  { value: "America/Mexico_City", label: "CDMX / México (GMT-6)" },
  { value: "America/Bogota", label: "Bogotá / Colombia (GMT-5)" },
  { value: "America/Lima", label: "Lima / Perú (GMT-5)" },
  { value: "America/Caracas", label: "Caracas / Venezuela (GMT-4)" },
  { value: "America/Santiago", label: "Santiago / Chile (GMT-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires / Argentina (GMT-3)" },
  { value: "Europe/Madrid", label: "Madrid / España (GMT+1)" },
  { value: "America/New_York", label: "Nueva York / EE.UU. (GMT-5)" },
];

type Props = {
  slug: string;
  businessName: string;
  rubro: Rubro;
  formFields: FormFieldDef[];
  slotDuration: number;
  avatarUrl?: string | null;
  description?: string | null;
  timezone?: string | null;
  initialLocations?: { id: string; name: string; address: string; phone: string | null }[];
  initialStaff?: { id: string; name: string; email: string; phone: string | null; description: string | null; avatarUrl: string | null; weeklyHours: any }[];
};

type Step = "location" | "staff" | "date" | "time" | "form" | "done";

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
}: Props) {
  // Determine if steps are shown
  const showLocationsStep = initialLocations && initialLocations.length > 1;
  const showStaffStep = initialStaff && initialStaff.length > 1;

  const [step, setStep] = useState<Step>(() => {
    if (showLocationsStep) return "location";
    if (showStaffStep) return "staff";
    return "date";
  });

  const [selectedLocation, setSelectedLocation] = useState<any>(() => {
    if (initialLocations && initialLocations.length === 1) {
      return initialLocations[0];
    }
    return null;
  });

  const [selectedStaff, setSelectedStaff] = useState<any>(() => {
    if (initialStaff && initialStaff.length === 1) {
      return initialStaff[0];
    }
    return null;
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tzLabel = COMMON_TIMEZONES.find((t) => t.value === timezone)?.label || timezone || "CDMX / México (GMT-6)";

  function selectLocation(loc: any) {
    setSelectedLocation(loc);
    if (showStaffStep) {
      setStep("staff");
    } else {
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
      const result = await getAvailableSlots(slug, new Date(`${date}T12:00:00`), selectedStaff?.id);
      if ("error" in result) {
        setSlotsError(result.error);
        return;
      }
      setSlots(result.slots);
    });
  }

  function selectTime(time: string) {
    setSelectedTime(time);
    setStep("form");
  }

  const initials = businessName
    ? businessName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AP";

  function resetBooking() {
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    setSlotsError(null);
    
    if (showLocationsStep) {
      setStep("location");
    } else if (showStaffStep) {
      setStep("staff");
    } else {
      setStep("date");
    }
  }

  if (step === "done") {
    let googleUrl = "";
    let outlookUrl = "";
    let icsDataUri = "";

    if (selectedDate && selectedTime) {
      const { startTime, endTime } = buildAppointmentRange(
        selectedDate,
        selectedTime,
        slotDuration
      );

      const startStr = startTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const endStr = endTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const nowStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      const details = `Tu cita con ${businessName} está agendada para el día ${selectedDate} a las ${selectedTime}. Duración: ${slotDuration} minutos.`;

      googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        `Cita con ${businessName}`
      )}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}`;

      outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(
        `Cita con ${businessName}`
      )}&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&body=${encodeURIComponent(details)}`;

      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//MyAppointment//NONSGML Client//EN",
        "BEGIN:VEVENT",
        `UID:${nowStr}@my-appointment`,
        `DTSTAMP:${nowStr}`,
        `DTSTART:${startStr}`,
        `DTEND:${endStr}`,
        `SUMMARY:Cita con ${businessName}`,
        `DESCRIPTION:${details}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      icsDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
    }

    return (
      <div className="max-w-md mx-auto rounded-3xl border border-slate-200/80 bg-white/98 p-8 text-center shadow-frost dark:border-slate-800/80 dark:bg-slate-900/98 dark:shadow-frost-dark backdrop-blur-md animate-in zoom-in-95 duration-300">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl font-bold shadow-md shadow-emerald-500/20 animate-bounce">
          ✓
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          ¡Cita Reservada!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-650 dark:text-slate-400">
          Tu cita ha quedado registrada correctamente. <strong className="text-slate-800 dark:text-slate-200">{businessName}</strong> ya puede gestionarla desde su panel y se comunicará contigo si es necesario.
        </p>
        
        <div className="my-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-850 text-left space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>RESUMEN DE RESERVA</span>
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            📅 {selectedDate ? formatDateLabel(selectedDate) : ""}
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            ⏱️ {selectedTime} · ({slotDuration} minutos)
          </p>
          {selectedLocation && (
            <p className="text-xs font-semibold text-slate-650 dark:text-slate-350 flex items-start gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-2">
              📍 <span className="font-bold">{selectedLocation.name}</span> ({selectedLocation.address})
            </p>
          )}
          {selectedStaff && (
            <p className="text-xs font-semibold text-slate-650 dark:text-slate-355 flex items-center gap-2">
              👤 <span className="font-bold">{selectedStaff.name}</span>
            </p>
          )}
        </div>

        {selectedDate && selectedTime && (
          <div className="my-6 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 text-left">
              Añadir a tu calendario:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-3xs font-extrabold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                <span>Google</span>
              </a>
              <a
                href={outlookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-3xs font-extrabold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                <span>Outlook</span>
              </a>
              <a
                href={icsDataUri}
                download={`cita-${selectedDate}-${selectedTime.replace(":", "")}.ics`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-3xs font-extrabold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                <span>iCal / ICS</span>
              </a>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Si el negocio tiene sincronizado Google Calendar, también recibirás una invitación por correo electrónico.
        </p>

        <div className="mt-8">
          <button
            type="button"
            onClick={resetBooking}
            className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 py-3 text-sm font-extrabold text-white hover:bg-primary-700 active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary-500/10 cursor-pointer"
          >
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full transition-all duration-300">
      {/* 2-Column Responsive Layout for Selection */}
      {(step === "location" || step === "staff" || step === "date" || step === "time") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-4xl mx-auto items-start">
          
          {/* Left Column: Business Profile */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white/98 p-6 shadow-frost dark:border-slate-800/80 dark:bg-slate-900/98 dark:shadow-frost-dark backdrop-blur-md animate-in fade-in duration-300 flex flex-col items-center text-center lg:items-start lg:text-left">
            {avatarUrl ? (
              <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-md shadow-primary-500/20 border-2 border-primary-100/50 dark:border-slate-800 relative">
                <img
                  src={avatarUrl}
                  alt={businessName}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white text-2xl font-black shadow-md shadow-primary-500/20">
                {initials}
              </div>
            )}
            
            <h1 className="mt-4 text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              {businessName}
            </h1>
            
            <div className="mt-1.5 inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 border border-primary-100/50 dark:border-primary-900/30">
              {RUBRO_LABELS[rubro]}
            </div>

            {description && (
              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                {description}
              </p>
            )}

            <p className="mt-4 text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Detalles del Servicio
            </p>

            <div className="mt-2 w-full space-y-2.5 text-sm text-slate-650 dark:text-slate-400">
              <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-base shrink-0">⏱️</span>
                <span>Cita de <strong>{slotDuration} minutos</strong></span>
              </div>
              <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-base shrink-0">🌐</span>
                <span>Zona Horaria: <strong className="text-slate-750 dark:text-slate-355 text-xs">{tzLabel}</strong></span>
              </div>
              {selectedLocation && (
                <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-base shrink-0">📍</span>
                  <div>
                    <p className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Sede</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedLocation.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{selectedLocation.address}</p>
                  </div>
                </div>
              )}
              {selectedStaff && (
                <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-base shrink-0">👤</span>
                  <div>
                    <p className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Especialista</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedStaff.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper progress info */}
            <div className="mt-6 w-full space-y-4 pt-4 border-t border-slate-150 dark:border-slate-800/80 hidden lg:block">
              {showLocationsStep && (
                <div className={`flex items-center gap-3 ${step === "location" ? "text-primary-600 font-bold" : "opacity-45"}`}>
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-extrabold ${step === "location" ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
                    1
                  </div>
                  <span className="text-xs">Selecciona Sede</span>
                </div>
              )}
              {showStaffStep && (
                <div className={`flex items-center gap-3 ${step === "staff" ? "text-primary-600 font-bold" : "opacity-45"}`}>
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-extrabold ${step === "staff" ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {showLocationsStep ? 2 : 1}
                  </div>
                  <span className="text-xs">Selecciona Especialista</span>
                </div>
              )}
              <div className={`flex items-center gap-3 ${(step === "date" || step === "time") ? "text-primary-600 font-bold" : "opacity-45"}`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-extrabold ${(step === "date" || step === "time") ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {1 + (showLocationsStep ? 1 : 0) + (showStaffStep ? 1 : 0)}
                </div>
                <span className="text-xs">Fecha y Hora</span>
              </div>
              <div className={`flex items-center gap-3 ${(step as string) === "form" ? "text-primary-600 font-bold" : "opacity-45"}`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-extrabold ${(step as string) === "form" ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {2 + (showLocationsStep ? 1 : 0) + (showStaffStep ? 1 : 0)}
                </div>
                <span className="text-xs">Tus Datos</span>
              </div>
              <div className={`flex items-center gap-3 ${(step as string) === "done" ? "text-primary-600 font-bold" : "opacity-45"}`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-extrabold ${(step as string) === "done" ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {3 + (showLocationsStep ? 1 : 0) + (showStaffStep ? 1 : 0)}
                </div>
                <span className="text-xs">Confirmación</span>
              </div>
            </div>
          </div>

          {/* Right Column: Active Interactive Selector */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white/98 p-6 shadow-frost dark:border-slate-800/80 dark:bg-slate-900/98 dark:shadow-frost-dark backdrop-blur-md animate-in fade-in duration-300">
            {step === "location" && (
              <>
                <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-50 flex items-center gap-2">
                  📍 Selecciona Sede / Sucursal
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-450">
                  Por favor elige la ubicación donde deseas agendar tu cita.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {initialLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => selectLocation(loc)}
                      type="button"
                      className="flex flex-col text-left p-4.5 rounded-2xl border border-slate-200 bg-white hover:border-primary-500 hover:bg-primary-50/10 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:border-primary-500 transition-all cursor-pointer shadow-xs hover:scale-102 group"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 mb-3 group-hover:scale-110 transition-transform">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{loc.name}</h3>
                      <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 mt-1 flex-1">{loc.address}</p>
                      {loc.phone && (
                        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-3 flex items-center gap-1 border-t border-slate-100 dark:border-slate-850 pt-2 w-full">
                          <span>📞</span> {loc.phone}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "staff" && (
              <>
                <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-50 flex items-center gap-2">
                  👤 Selecciona Especialista
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-450">
                  Por favor elige el especialista que te atenderá.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option: Any specialist */}
                  <button
                    onClick={() => selectStaff(null)}
                    type="button"
                    className="flex flex-col text-left p-4.5 rounded-2xl border border-slate-200 bg-white hover:border-primary-500 hover:bg-primary-50/10 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:border-primary-500 transition-all cursor-pointer shadow-xs hover:scale-102 group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Sin Preferencia</h3>
                    <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 mt-1 flex-1">
                      Asignar automáticamente según disponibilidad general.
                    </p>
                  </button>

                  {initialStaff.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => selectStaff(member)}
                      type="button"
                      className="flex flex-col text-left p-4.5 rounded-2xl border border-slate-200 bg-white hover:border-primary-500 hover:bg-primary-50/10 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:border-primary-500 transition-all cursor-pointer shadow-xs hover:scale-102 group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-800 dark:to-slate-850 overflow-hidden shadow-inner border border-primary-100/30 dark:border-slate-800 mb-3 group-hover:scale-110 transition-transform">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-black text-primary-750 dark:text-primary-300">
                            {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{member.name}</h3>
                      <p className="text-xs font-semibold text-slate-555 dark:text-slate-400 mt-1 flex-1 line-clamp-2">
                        {member.description || "Especialista disponible."}
                      </p>
                    </button>
                  ))}
                </div>

                {showLocationsStep && (
                  <button
                    type="button"
                    onClick={() => setStep("location")}
                    className="mt-6 text-xs font-semibold text-slate-450 hover:text-primary-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    ← Volver a Sedes
                  </button>
                )}
              </>
            )}

            {step === "date" && (
              <>
                <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-50 flex items-center gap-2">
                  📅 Selecciona Fecha y Hora
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-455">
                  Escoge el día de tu preferencia en el calendario y luego selecciona una franja horaria disponible.
                </p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-7">
                    <MonthCalendar
                      selectedDate={selectedDate}
                      onSelectDate={loadSlots}
                    />
                  </div>

                  <div className="md:col-span-5 flex flex-col h-full">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-900/40 flex-1 flex flex-col min-h-[300px]">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                        ⏱️ Horas Disponibles
                      </h3>

                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <div className="h-10 w-10 text-slate-350 dark:text-slate-500 mb-2 animate-pulse">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-xs text-slate-505 dark:text-slate-450 leading-relaxed font-medium">
                          Elige una fecha del calendario para cargar las horas disponibles.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {(showStaffStep || showLocationsStep) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (showStaffStep) setStep("staff");
                      else if (showLocationsStep) setStep("location");
                    }}
                    className="mt-6 text-xs font-semibold text-slate-455 hover:text-primary-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    ← Volver al paso anterior
                  </button>
                )}
              </>
            )}

            {step === "time" && (
              <>
                <h2 className="text-lg font-extrabold text-slate-855 dark:text-slate-50 flex items-center gap-2">
                  📅 Selecciona Fecha y Hora
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-455">
                  Escoge el día de tu preferencia en el calendario y luego selecciona una franja horaria disponible.
                </p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-7">
                    <MonthCalendar
                      selectedDate={selectedDate}
                      onSelectDate={loadSlots}
                    />
                  </div>

                  <div className="md:col-span-5 flex flex-col h-full">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-900/40 flex-1 flex flex-col min-h-[300px]">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                        ⏱️ Horas Disponibles
                      </h3>

                      {pending && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                          <svg className="h-7 w-7 animate-spin text-primary-600 mb-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <p className="text-xs text-slate-500 dark:text-slate-455 font-medium">
                            Cargando horarios…
                          </p>
                        </div>
                      )}

                      {!pending && selectedDate && (
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="mb-4">
                            <span className="inline-block rounded-lg bg-primary-50 px-2 py-1 text-2xs font-extrabold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 mb-3 border border-primary-100/30">
                              {formatDateLabel(selectedDate)}
                            </span>

                            {slotsError && (
                              <p className="rounded-lg bg-red-50/98 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-150">
                                {slotsError}
                              </p>
                            )}

                            {!slotsError && slots.length === 0 && (
                              <p className="text-xs text-slate-500 dark:text-slate-450 text-center py-8 font-semibold">
                                ⚠️ No hay horarios libres para este día. Prueba otra fecha.
                              </p>
                            )}

                            {!slotsError && slots.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                                {slots.map((slot) => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => selectTime(slot)}
                                    className={`rounded-xl border py-2 text-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                                      selectedTime === slot
                                        ? "border-primary-600 bg-primary-600 text-white shadow-md shadow-primary-500/10"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700 dark:border-slate-750 dark:bg-slate-805 dark:text-slate-200 dark:hover:border-primary-800 dark:hover:bg-primary-950/20 dark:hover:text-primary-300"
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={resetBooking}
                            className="mt-2 text-left text-xs font-semibold text-slate-450 hover:text-primary-600 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            ← Cambiar fecha
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Form for Client Data */}
      {step === "form" && selectedDate && selectedTime && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200/80 bg-white/98 shadow-frost dark:border-slate-800/80 dark:bg-slate-900/98 dark:shadow-frost-dark backdrop-blur-md animate-in slide-in-from-bottom-4 duration-350">
          
          {/* Header Card Profile Compact */}
          <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-850">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white text-sm font-bold shadow-md shadow-primary-500/10">
              {initials}
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                {businessName}
              </h1>
              <p className="text-2xs font-semibold text-slate-450 uppercase tracking-wider leading-none mt-0.5">
                {RUBRO_LABELS[rubro]}
              </p>
            </div>
            
            {/* Stepper info mobile header */}
            <div className="ml-auto hidden sm:flex items-center gap-1 text-2xs font-bold text-slate-450">
              <span>Paso {1 + (showLocationsStep ? 1 : 0) + (showStaffStep ? 1 : 0)} de {2 + (showLocationsStep ? 1 : 0) + (showStaffStep ? 1 : 0)}</span>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              📝 Completa tus Datos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Por favor ingresa la información requerida por el profesional para agendar tu espacio de atención.
            </p>

            <DynamicBookingForm
              slug={slug}
              date={selectedDate}
              time={selectedTime}
              slotDuration={slotDuration}
              formFields={formFields}
              onSuccess={() => setStep("done")}
              onBack={() => setStep("time")}
              staffId={selectedStaff?.id}
              locationId={selectedLocation?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
