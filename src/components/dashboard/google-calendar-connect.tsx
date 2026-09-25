"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { googleOAuthOptions } from "@/lib/google-oauth";
import { disconnectGoogleCalendar } from "@/actions/google-calendar";

type Props = {
  connected: boolean;
  linkedAt?: string;
};

export function GoogleCalendarConnect({ connected, linkedAt }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard/integrations`;

    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: "google",
      options: googleOAuthOptions(redirectTo),
    });

    if (linkError) {
      const msg = linkError.message.toLowerCase().includes("manual linking")
        ? "Activa «Allow manual linking» en Supabase → Authentication → Sign In / Providers → User Signups y pulsa Save changes. Luego vuelve a conectar."
        : linkError.message;
      setError(msg);
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    setError(null);

    try {
      await disconnectGoogleCalendar();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo desconectar");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#007AFF] text-white shadow-xs">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
            Google Calendar
            <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-normal text-[#86868B]">
              opcional
            </span>
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#86868B]">
            Sincroniza tus jornadas bidireccionalmente. Bloquea horas ocupadas de tu Google Calendar en tu agenda de reservas y envía invitaciones automáticas por correo a tus clientes. Sin esto, tus citas se guardan de forma local en <strong className="text-[#1D1D1F] font-medium">My Appointment</strong>.
          </p>
          
          <div className="mt-3">
            {connected ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#34C759]/10 px-2.5 py-1 text-[11px] font-medium text-[#34C759]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]"></span>
                <span>Conectado</span>
                {linkedAt && (
                  <span className="font-normal text-[#86868B]">
                    {" "}
                    · desde {new Date(linkedAt).toLocaleDateString("es")}
                  </span>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#86868B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#86868B]"></span>
                <span>No conectado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-3 text-xs text-[#FF3B30]">
          <span className="shrink-0 text-sm">⚠️</span>
          <span className="leading-relaxed font-medium text-[#1D1D1F]">{error}</span>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-black/[0.06] pt-5">
        <div>
          {connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-black/[0.08] bg-white px-4 py-2 text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.03] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <svg className="mr-2 h-3.5 w-3.5 animate-spin text-[#86868B]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Desconectando…
                </>
              ) : (
                "Desconectar"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-[#007AFF] px-4 py-2 text-xs font-medium text-white hover:bg-[#0062cc] active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="mr-2 h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirigiendo a Google…
                </>
              ) : (
                "Conectar Google Calendar"
              )}
            </button>
          )}
        </div>

        <p className="text-[11px] leading-normal text-[#86868B] max-w-xs sm:text-right">
          Permisos solicitados: lectura de eventos y creación/edición de reservas directamente en tu calendario.
        </p>
      </div>
    </div>
  );
}
