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
    <div className="rounded-2xl border border-slate-200/80 bg-white/98 p-6 shadow-frost dark:border-slate-800/80 dark:bg-slate-900/98 dark:shadow-frost-dark backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/20">
          <svg
            className="h-6 w-6"
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
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Google Calendar
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              opcional
            </span>
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-650 dark:text-slate-400">
            Sincroniza tus jornadas bidireccionalmente. Bloquea horas ocupadas de tu Google Calendar en tu agenda de reservas y envía invitaciones automáticas por correo a tus clientes. Sin esto, tus citas se guardan de forma local en <strong className="text-slate-800 dark:text-slate-200">My Appointment</strong>.
          </p>
          
          <div className="mt-3">
            {connected ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100/50 dark:border-emerald-900/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Conectado</span>
                {linkedAt && (
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    {" "}
                    · desde {new Date(linkedAt).toLocaleDateString("es")}
                  </span>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                <span>No conectado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200/60 bg-red-50/98 p-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/40 dark:text-red-300">
          <span className="shrink-0 text-base">⚠️</span>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800/80">
        <div>
          {connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 dark:border-slate-700 dark:bg-slate-805 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
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
              className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-primary-700 active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary-500/10 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
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

        <p className="text-[10px] leading-normal text-slate-400 dark:text-slate-500 max-w-xs sm:text-right">
          Permisos solicitados: lectura de eventos y creación/edición de reservas directamente en tu calendario.
        </p>
      </div>
    </div>
  );
}
