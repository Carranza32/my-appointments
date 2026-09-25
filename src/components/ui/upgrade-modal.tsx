"use client";

import Link from "next/link";

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  featureName: string;
  description?: string;
};

export function UpgradeModal({
  isOpen,
  onClose,
  title = "Función Premium 🏅",
  featureName,
  description,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Modal content box */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden border border-black/[0.08] bg-white/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)] backdrop-blur-2xl rounded-[28px] animate-in zoom-in-95 duration-200 text-center flex flex-col items-center"
      >
        {/* Crown/Gold badge icon */}
        <div className="h-12 w-12 rounded-2xl bg-[#FF9500]/10 flex items-center justify-center mb-4 text-2xl shadow-xs">
          ⭐
        </div>

        <h3 className="text-base font-bold text-[#1D1D1F] font-heading">
          {title}
        </h3>
        
        <p className="mt-2 text-xs leading-relaxed text-[#86868B] font-medium">
          {description || (
            <>
              La opción de <strong className="text-[#1D1D1F] font-semibold">{featureName}</strong> está disponible únicamente en el plan <strong className="text-[#FF9500] font-semibold">PRO</strong>. Actualiza tu suscripción para desbloquear esta y otras herramientas avanzadas.
            </>
          )}
        </p>

        <div className="mt-6 flex items-center gap-2.5 w-full">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 text-center rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] py-2.5 text-xs font-semibold text-[#1D1D1F] active:scale-[0.98] transition-all cursor-pointer"
          >
            Cerrar
          </button>
          <Link
            href="/dashboard/settings?tab=plan"
            onClick={onClose}
            className="flex-1 text-center rounded-xl bg-[#007AFF] hover:bg-[#0062cc] py-2.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] active:scale-[0.98] transition-all cursor-pointer"
          >
            Ver Planes
          </Link>
        </div>
      </div>
    </div>
  );
}
