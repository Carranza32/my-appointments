"use client";

import React, { useState } from "react";
import { confirmAppointmentByClient } from "@/actions/appointments";
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Phone,
  Building2,
  CalendarPlus,
  Video,
} from "lucide-react";

interface ConfirmWidgetProps {
  appointmentId: string;
  clientName: string;
  businessName: string;
  businessSlug: string;
  businessPhone?: string | null;
  serviceName: string;
  serviceDuration: number;
  staffName?: string | null;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  status: string;
  price?: number;
  meetingUrl?: string | null;
}

export function ConfirmAppointmentWidget({
  appointmentId,
  clientName,
  businessName,
  businessSlug,
  businessPhone,
  serviceName,
  serviceDuration,
  staffName,
  startTime,
  endTime,
  status: initialStatus,
  price,
  meetingUrl,
}: ConfirmWidgetProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = status === "CONFIRMADA";
  const isCancelled = status === "CANCELADA";

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const formattedDate = startDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const formattedStartTime = startDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  const formattedEndTime = endDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await confirmAppointmentByClient(appointmentId);
      if (res.success) {
        setStatus("CONFIRMADA");
      } else {
        setError(res.error || "No se pudo confirmar la cita.");
      }
    } catch {
      setError("Ocurrió un error inesperado al confirmar.");
    } finally {
      setLoading(false);
    }
  };

  const getGoogleCalendarUrl = () => {
    try {
      const year = startDate.getUTCFullYear();
      const month = String(startDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(startDate.getUTCDate()).padStart(2, "0");
      const startH = String(startDate.getUTCHours()).padStart(2, "0");
      const startM = String(startDate.getUTCMinutes()).padStart(2, "0");
      const endH = String(endDate.getUTCHours()).padStart(2, "0");
      const endM = String(endDate.getUTCMinutes()).padStart(2, "0");

      const startIso = `${year}${month}${day}T${startH}${startM}00Z`;
      const endIso = `${year}${month}${day}T${endH}${endM}00Z`;

      const title = encodeURIComponent(`${serviceName} - ${businessName}`);
      const details = encodeURIComponent(
        `Cita confirmada con ${businessName}.\nServicio: ${serviceName}\nPaciente/Cliente: ${clientName}${staffName ? `\nAtendido por: ${staffName}` : ""}`
      );
      const location = encodeURIComponent(businessName);

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
    } catch {
      return "#";
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-[28px] border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300">
      {/* Top Brand Header */}
      <div className="p-8 pb-6 border-b border-black/[0.04] bg-gradient-to-b from-black/[0.015] to-transparent text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/[0.03] border border-black/[0.05] text-[#1D1D1F] mb-4 shadow-sm">
          <Building2 className="w-7 h-7 text-[#1D1D1F]" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
          {businessName}
        </h2>
        <p className="text-xs font-medium text-black/50 mt-1 uppercase tracking-wider">
          Confirmación de Asistencia
        </p>
      </div>

      {/* Main Body */}
      <div className="p-8 space-y-6">
        {/* Status Pill Badge */}
        <div className="flex items-center justify-center">
          {isConfirmed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#34C759]/10 border border-[#34C759]/25 text-[#248A3D] text-sm font-semibold tracking-tight animate-in fade-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
              <span>Cita Confirmada con Éxito</span>
            </div>
          ) : isCancelled ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/25 text-[#FF3B30] text-sm font-semibold tracking-tight">
              <AlertCircle className="w-4 h-4" />
              <span>Cita Cancelada</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF9500]/10 border border-[#FF9500]/25 text-[#D97706] text-sm font-semibold tracking-tight">
              <span className="w-2 h-2 rounded-full bg-[#FF9500] animate-pulse" />
              <span>Pendiente de Confirmación</span>
            </div>
          )}
        </div>

        {/* Appointment Details Card */}
        <div className="bg-[#F5F5F7]/80 rounded-2xl p-5 border border-black/[0.04] space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-black/[0.05]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
                Servicio
              </span>
              <h3 className="text-base font-semibold text-[#1D1D1F] mt-0.5">
                {serviceName}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
                Duración
              </span>
              <p className="text-sm font-medium text-[#1D1D1F] mt-0.5">
                {serviceDuration} min
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-black/70">
              <Calendar className="w-4 h-4 text-black/40 flex-shrink-0" />
              <span className="capitalize font-medium text-[#1D1D1F]">
                {formattedDate}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-black/70">
              <Clock className="w-4 h-4 text-black/40 flex-shrink-0" />
              <span className="font-medium text-[#1D1D1F]">
                {formattedStartTime} - {formattedEndTime} hs
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-black/70">
              <User className="w-4 h-4 text-black/40 flex-shrink-0" />
              <span className="truncate">{clientName}</span>
            </div>
            {price !== undefined && price > 0 && (
              <div className="flex items-center gap-2.5 text-black/70">
                <span className="text-xs font-semibold text-black/40">$</span>
                <span className="font-medium text-[#1D1D1F]">${price}</span>
              </div>
            )}
          </div>

          {/* If Session is Online and meeting link is provided */}
          {meetingUrl && (
            <div className="pt-2 border-t border-black/[0.04]">
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-500/20 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#007AFF]">
                  <Video className="w-4 h-4" />
                  <span>Sesión Online por Videollamada</span>
                </div>
                <p className="text-xs text-black/60">
                  {meetingUrl.includes("meet.google")
                    ? "Tu cita se realizará por Google Meet."
                    : meetingUrl.includes("zoom")
                    ? "Tu cita se realizará por Zoom Meeting."
                    : "Tu cita se realizará por videollamada online."}
                </p>
                <a
                  href={meetingUrl.startsWith("http") ? meetingUrl : `https://${meetingUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Unirse a la Videollamada</span>
                  <ExternalLink className="w-3 h-3 text-white/80 ml-0.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Action Area */}
        {isConfirmed ? (
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-[#34C759]/5 border border-[#34C759]/20 text-center">
              <p className="text-sm text-[#1D1D1F] font-medium">
                ¡Gracias! Tu asistencia ha sido confirmada en el consultorio.
              </p>
              <p className="text-xs text-black/50 mt-1">
                Te esperamos puntualmente el día y la hora de tu cita.
              </p>
            </div>

            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] font-medium text-sm transition-colors border border-black/[0.04]"
            >
              <CalendarPlus className="w-4 h-4 text-black/60" />
              <span>Añadir a Google Calendar</span>
              <ExternalLink className="w-3.5 h-3.5 text-black/40 ml-0.5" />
            </a>
          </div>
        ) : isCancelled ? (
          <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.05] text-center text-sm text-black/60">
            Esta cita ha sido cancelada. Si necesitas reprogramarla, comunícate directamente con el consultorio.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full relative group overflow-hidden inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.99] text-white font-semibold text-base shadow-[0_10px_25px_rgba(0,122,255,0.25)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Confirmando cita...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>✓ Confirmar Mi Asistencia</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-black/40">
              Al confirmar, tu profesional reservará tu espacio de forma definitiva en el calendario.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Footer Support Info */}
      <div className="p-6 bg-black/[0.02] border-t border-black/[0.04] text-xs text-black/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Gestión de Citas Inteligente</span>
        </div>
        {businessPhone && (
          <a
            href={`https://wa.me/${businessPhone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#007AFF] hover:underline font-medium inline-flex items-center gap-1"
          >
            <Phone className="w-3 h-3" />
            <span>Contactar al consultorio</span>
          </a>
        )}
      </div>
    </div>
  );
}
