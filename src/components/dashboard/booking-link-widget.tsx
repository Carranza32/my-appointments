"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

type Props = {
  url: string;
  slug: string;
};

export function BookingLinkWidget({ url, slug }: Props) {
  const [copied, setCopied] = useState(false);

  // Clean display string without protocol, e.g. "localhost:3000/mente-sana"
  const cleanDisplayUrl = url.replace(/^https?:\/\//, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <div className="flex flex-col h-full justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs text-[#1D1D1F]">
            Enlace de Reservas
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#34C759]/10 px-2 py-0.5 text-[9px] font-medium text-[#34C759] uppercase tracking-wider">
            Activo
          </span>
        </div>
        <p className="mt-1 text-xs text-[#86868B] leading-relaxed font-normal">
          Comparte tu enlace personalizado para que tus pacientes agenden directamente.
        </p>

        {/* Link container */}
        <div className="mt-3 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.06]">
          <span className="font-mono text-xs text-[#007AFF] truncate select-all">
            {cleanDisplayUrl}
          </span>
          <button
            onClick={handleCopy}
            type="button"
            className="p-1 rounded-lg hover:bg-black/[0.05] text-[#86868B] hover:text-[#007AFF] transition-all cursor-pointer active:scale-95 shrink-0"
            title="Copiar enlace"
          >
            {copied ? (
              <Check className="h-4 w-4 text-[#34C759]" />
            ) : (
              <Copy className="h-4 w-4 text-[#86868B]" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] bg-white py-2 text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.03] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          <span>Abrir Portal</span>
          <ExternalLink className="h-3.5 w-3.5 text-[#86868B]" />
        </a>
        <Link
          href="/dashboard/settings?tab=schedule"
          className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#007AFF] hover:bg-[#0062cc] py-2 text-xs font-medium text-white active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          Editar Horarios
        </Link>
      </div>
    </div>
  );
}

