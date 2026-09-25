"use client";

import { useState, useTransition } from "react";
import { updateTenantPlanManual } from "@/actions/admin";
import { Loader2, CheckCircle2, ShieldAlert } from "lucide-react";

type TenantPlanToggleProps = {
  tenantId: string;
  initialPlanTier: "FREE" | "PRO";
};

export function TenantPlanToggle({ tenantId, initialPlanTier }: TenantPlanToggleProps) {
  const [plan, setPlan] = useState<"FREE" | "PRO">(initialPlanTier);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePlanChange = (newTier: "FREE" | "PRO") => {
    if (newTier === plan) return;

    setMessage(null);
    startTransition(async () => {
      try {
        const res = await updateTenantPlanManual(tenantId, newTier);
        if (res.success) {
          setPlan(newTier);
          setMessage({ type: "success", text: `El plan ha sido cambiado exitosamente a ${newTier}.` });
        } else {
          setMessage({ type: "error", text: "Ocurrió un error al actualizar el plan." });
        }
      } catch (err) {
        setMessage({ type: "error", text: "Error de servidor al intentar actualizar el plan." });
      }
    });
  };

  return (
    <div className="bg-white/80 p-6 rounded-2xl border border-black/[0.06] backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
        Control Administrativo de Plan
      </h3>
      <p className="mt-2 text-xs text-[#86868B] leading-relaxed">
        Cambia manualmente el nivel de suscripción de este inquilino. Esto anula o establece el plan sin necesidad de pasar por la pasarela de pagos.
      </p>

      {/* Button controls */}
      <div className="mt-5 flex items-center gap-2.5 p-1 bg-black/[0.04] rounded-xl border border-black/[0.04]">
        <button
          onClick={() => handlePlanChange("FREE")}
          disabled={isPending}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer select-none text-center active:scale-[0.98] ${
            plan === "FREE"
              ? "bg-white text-[#1D1D1F] shadow-sm"
              : "text-[#86868B] hover:text-[#1D1D1F]"
          } ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          FREE
        </button>

        <button
          onClick={() => handlePlanChange("PRO")}
          disabled={isPending}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer select-none text-center flex items-center justify-center gap-1.5 active:scale-[0.98] ${
            plan === "PRO"
              ? "bg-[#FF9500] text-white shadow-xs"
              : "text-[#FF9500] hover:bg-black/[0.04]"
          } ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isPending && plan !== "PRO" && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
          <span>🏅 PRO</span>
        </button>
      </div>

      {isPending && (
        <div className="mt-4 flex items-center gap-2 text-xs text-[#86868B]">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#007AFF]" />
          <span>Guardando cambios en la base de datos...</span>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs backdrop-blur-md animate-in fade-in duration-200 ${
            message.type === "success"
              ? "border-[#34C759]/20 bg-[#34C759]/10 text-[#34C759]"
              : "border-[#FF3B30]/20 bg-[#FF3B30]/10 text-[#FF3B30]"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34C759] mt-0.5" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0 text-[#FF3B30] mt-0.5" />
          )}
          <span className="font-medium text-[#1D1D1F]">{message.text}</span>
        </div>
      )}
    </div>
  );
}
