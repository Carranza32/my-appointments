"use client";

import { useState, useTransition } from "react";
import { confirmBankTransferPayment, rejectBankTransferPayment } from "@/actions/payments";
import { X } from "lucide-react";

type AppointmentPaymentDTO = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  paymentStatus: string;
  paymentProofUrl?: string | null;
};

type Props = {
  initialAppointments: AppointmentPaymentDTO[];
};

export function PaymentsClient({ initialAppointments }: Props) {
  const [appointments, setAppointments] = useState<AppointmentPaymentDTO[]>(initialAppointments);
  const [selectedApt, setSelectedApt] = useState<AppointmentPaymentDTO | null>(null);
  const [confirmingApt, setConfirmingApt] = useState<AppointmentPaymentDTO | null>(null);
  const [sessionPrice, setSessionPrice] = useState<number>(600);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingApt) return;

    setError(null);
    startTransition(async () => {
      const res = await confirmBankTransferPayment(confirmingApt.id, sessionPrice);
      if (res.error) {
        setError(res.error);
      } else {
        setAppointments((prev) => prev.filter((a) => a.id !== confirmingApt.id));
        setConfirmingApt(null);
        setSelectedApt(null);
      }
    });
  };

  const handleRejectPayment = (aptId: string) => {
    if (!confirm("¿Estás seguro de que deseas rechazar este comprobante? Se le solicitará uno nuevo al paciente.")) return;

    setError(null);
    startTransition(async () => {
      const res = await rejectBankTransferPayment(aptId);
      if (res.error) {
        setError(res.error);
      } else {
        setAppointments((prev) => prev.filter((a) => a.id !== aptId));
        setSelectedApt(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 px-4 py-2.5 text-xs font-medium text-[#FF3B30]">
          {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#86868B] gap-3 rounded-2xl bg-white/80 backdrop-blur-2xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#34C759]/10 text-[#34C759] text-2xl">
            ✓
          </div>
          <p className="text-sm font-semibold text-[#1D1D1F]">Sin transferencias pendientes</p>
          <p className="text-xs text-[#86868B] text-center max-w-xs leading-relaxed">
            Todas las citas pagadas por transferencia bancaria están al día y confirmadas.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01] text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
                <th className="px-6 py-3.5">Paciente</th>
                <th className="px-6 py-3.5">Sesión / Horario</th>
                <th className="px-6 py-3.5 text-center">Comprobante</th>
                <th className="px-6 py-3.5 text-right">Monto Sugerido</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-black/[0.015] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#1D1D1F]">{apt.clientName}</p>
                    <p className="text-[11px] text-[#86868B] mt-0.5">{apt.clientEmail} · {apt.clientPhone}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#1D1D1F]">
                    {formatDate(apt.startTime)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {apt.paymentProofUrl ? (
                      <button
                        onClick={() => setSelectedApt(apt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-xs font-medium text-[#007AFF] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <span>📂</span>
                        <span>Ver Recibo</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FF9500]/10 text-[#FF9500]">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-[#1D1D1F]">
                    ${apt.price > 0 ? apt.price : 50} {(apt as any).currency || "USD"}
                  </td>
                  <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setConfirmingApt(apt);
                        setSessionPrice(apt.price > 0 ? apt.price : 50);
                      }}
                      className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] text-xs font-medium text-white shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleRejectPayment(apt.id)}
                      className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 text-[#FF3B30] text-xs font-medium cursor-pointer active:scale-[0.98] transition-all"
                    >
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW RECEIPT IMAGE MODAL (Responsive Apple Design 3-Tier Layout) */}
      {selectedApt && (
        <div 
          onClick={() => setSelectedApt(null)}
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
                  Comprobante: {selectedApt.clientName}
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5 font-medium">
                  {new Date(selectedApt.startTime).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} · {selectedApt.clientPhone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 2. SCROLLABLE BODY */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain flex justify-center items-center">
              {selectedApt.paymentProofUrl?.startsWith("data:") ? (
                <img
                  src={selectedApt.paymentProofUrl}
                  alt="Comprobante de transferencia bancaria"
                  className="max-w-full max-h-[60vh] object-contain rounded-2xl border border-black/[0.06] shadow-sm"
                ></img>
              ) : (
                <div className="py-12 flex flex-col items-center gap-2 text-[#86868B]">
                  <span className="text-3xl">📄</span>
                  <a
                    href={selectedApt.paymentProofUrl || ""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#007AFF] hover:underline"
                  >
                    Ver archivo PDF adjunto
                  </a>
                </div>
              )}
            </div>

            {/* 3. STICKY FOOTER */}
            <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-row gap-3 justify-end">
              <button
                onClick={() => setSelectedApt(null)}
                type="button"
                className="flex-1 sm:flex-none sm:min-w-[120px] rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] py-2.5 px-5 text-xs font-semibold text-[#1D1D1F] active:scale-[0.98] transition-all text-center cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setConfirmingApt(selectedApt);
                  setSessionPrice(selectedApt.price > 0 ? selectedApt.price : 600);
                }}
                className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl bg-[#007AFF] hover:bg-[#0062cc] py-2.5 px-6 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] cursor-pointer active:scale-[0.98] transition-all text-center"
              >
                Aprobar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION PRICE FORM MODAL (Apple Design System Inset Card) */}
      {confirmingApt && (
        <div 
          onClick={() => setConfirmingApt(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <form 
            onSubmit={handleConfirmPayment} 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden bg-white/95 backdrop-blur-2xl border border-black/[0.08] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)] rounded-[28px] space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] font-heading leading-tight">
                Confirmar Sesión y Pago
              </h3>
              <p className="text-xs text-[#86868B] leading-relaxed mt-1 font-medium">
                Ingresa el monto final cobrado por la sesión con <strong className="text-[#1D1D1F]">{confirmingApt.clientName}</strong> para guardarlo en tu historial.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-2">
              <label className="block text-xs font-semibold text-[#1D1D1F]">
                Monto cobrado ({(confirmingApt as any)?.currency || "USD"}) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={sessionPrice}
                onChange={(e) => setSessionPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
              />
            </div>

            <div className="flex flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingApt(null)}
                className="flex-1 rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] py-2.5 px-4 text-xs font-semibold text-[#1D1D1F] active:scale-[0.98] transition-all text-center cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] py-2.5 px-4 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] transition-all disabled:opacity-50 text-center cursor-pointer"
              >
                {pending ? "Confirmando..." : "Confirmar Pago"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
