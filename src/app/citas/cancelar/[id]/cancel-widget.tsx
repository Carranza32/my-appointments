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
      <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white/98 p-8 text-center shadow-frost dark:border-slate-800/80 dark:bg-slate-900/98 dark:shadow-frost-dark backdrop-blur-md animate-in zoom-in-95 duration-300">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-650 dark:bg-red-950/40 dark:text-red-400 text-3xl font-bold shadow-md shadow-red-500/10">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Cita Cancelada
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-650 dark:text-slate-400">
          Tu cita con <strong className="text-slate-850 dark:text-slate-150">{businessName}</strong> el día <strong className="text-slate-850 dark:text-slate-150">{formattedDate}</strong> a las <strong className="text-slate-850 dark:text-slate-150">{formattedTime} hs</strong> ha sido cancelada correctamente.
        </p>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Se ha enviado un correo electrónico de confirmación.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white/98 p-8 shadow-frost dark:border-slate-800/80 dark:bg-slate-900/98 dark:shadow-frost-dark backdrop-blur-md animate-in zoom-in-95 duration-300 space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 shadow-md shadow-amber-500/5">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          ¿Cancelar cita?
        </h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Hola {clientName}, ¿estás seguro de que deseas cancelar tu cita?
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4.5 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-850 space-y-3">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-650 dark:text-slate-350">
          <Calendar className="h-4.5 w-4.5 text-primary-500 shrink-0" />
          <span className="capitalize">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-650 dark:text-slate-355">
          <Clock className="h-4.5 w-4.5 text-primary-500 shrink-0" />
          <span>{formattedTime} hs</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-650 dark:text-slate-355 border-t border-slate-200/40 dark:border-slate-800/50 pt-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500">Negocio:</span>
          <span className="font-extrabold text-slate-800 dark:text-slate-150">{businessName}</span>
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
          {error}
        </p>
      )}

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={handleCancel}
          className="w-full inline-flex items-center justify-center rounded-xl bg-red-650 hover:bg-red-700 active:scale-[0.98] transition-all duration-200 py-3.5 text-sm font-extrabold text-white shadow-md shadow-red-600/10 cursor-pointer disabled:opacity-50"
        >
          {pending ? "Cancelando cita..." : "Sí, cancelar cita"}
        </button>
      </div>
    </div>
  );
}
