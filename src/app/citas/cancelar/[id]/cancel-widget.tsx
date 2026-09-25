"use client";

import { useState, useTransition } from "react";
import { cancelAppointmentByClient } from "@/actions/appointments";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";

type Props = {
  appointmentId: string;
  clientName: string;
  businessName: string;
  startTime: string;
  status: string;
};

export function CancelAppointmentWidget({
  appointmentId,
  clientName,
  businessName,
  startTime,
  status,
}: Props) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const appointmentDate = new Date(startTime);
  const formattedDate = appointmentDate.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = appointmentDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointmentByClient(appointmentId);
      if (result?.error) {
        setError(result.error);
      } else {
        setCurrentStatus("CANCELADA");
      }
    });
  }

  if (currentStatus === "CANCELADA") {
    return (
      <div className="max-w-md w-full rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)] animate-in zoom-in-95 duration-200">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF3B30]/10 text-[#FF3B30]">
          <CheckCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
          Cita Cancelada
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#86868B]">
          Tu cita con <strong className="text-[#1D1D1F] font-medium">{businessName}</strong> el día <strong className="text-[#1D1D1F] font-medium">{formattedDate}</strong> a las <strong className="text-[#1D1D1F] font-medium">{formattedTime} hs</strong> ha sido cancelada correctamente.
        </p>
        <p className="mt-3 text-[11px] text-[#86868B]">
          Se ha enviado un correo electrónico de confirmación.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] animate-in zoom-in-95 duration-200 space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF9500]/10 text-[#FF9500]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
          ¿Cancelar cita?
        </h2>
        <p className="mt-1 text-xs text-[#86868B]">
          Hola {clientName}, ¿estás seguro de que deseas cancelar tu cita?
        </p>
      </div>

      <div className="rounded-xl bg-black/[0.02] p-4 border border-black/[0.06] space-y-2.5">
        <div className="flex items-center gap-2.5 text-xs text-[#1D1D1F]">
          <Calendar className="h-4 w-4 text-[#007AFF] shrink-0" />
          <span className="capitalize font-medium">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-[#1D1D1F]">
          <Clock className="h-4 w-4 text-[#007AFF] shrink-0" />
          <span className="font-medium">{formattedTime} hs</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-[#86868B] border-t border-black/[0.04] pt-2">
          <span className="text-[10px] uppercase tracking-wider font-medium">Negocio:</span>
          <span className="font-medium text-[#1D1D1F]">{businessName}</span>
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-[#FF3B30] bg-[#FF3B30]/10 border border-[#FF3B30]/20 p-3 rounded-xl">
          {error}
        </p>
      )}

      <div className="space-y-2 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={handleCancel}
          className="w-full inline-flex items-center justify-center rounded-xl bg-[#FF3B30] hover:bg-[#d9342b] active:scale-[0.98] transition-all py-3 text-xs font-medium text-white shadow-xs cursor-pointer disabled:opacity-50"
        >
          {pending ? "Cancelando cita..." : "Sí, cancelar cita"}
        </button>
      </div>
    </div>
  );
}
