import { GoogleCalendarConnect } from "@/components/dashboard/google-calendar-connect";
import { getProfessional } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ google?: string; message?: string }>;
};

export default async function IntegrationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const professional = await getProfessional();
  const googleAccount = professional?.googleAccount;

  return (
    <div className="relative mx-auto max-w-5xl pb-12">
      {/* Decorative Glows in Background */}
      <div className="absolute top-10 right-10 -z-10 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/5 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 -z-10 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5 animate-float-delayed pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-heading tracking-tight text-slate-800 dark:text-slate-100">
            Integraciones
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Las integraciones son opcionales. Tu agenda principal vive en{" "}
            <span className="text-primary-600 dark:text-primary-400 font-bold">Mis citas</span>; Google Calendar añade sincronización bidireccional extra.
          </p>
        </div>
      </div>

      {params.google === "connected" && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/98 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/30 dark:bg-emerald-950/98 dark:text-emerald-300 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-lg">✓</span>
          <span>Google Calendar conectado correctamente.</span>
        </div>
      )}

      {params.google === "error" && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200/60 bg-red-50/98 px-4 py-3 text-sm text-red-800 dark:border-red-800/30 dark:bg-red-950/98 dark:text-red-300 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-lg">⚠️</span>
          <span>Error al conectar: {params.message ?? "Intenta de nuevo."}</span>
        </div>
      )}

      <div className="mt-8 max-w-2xl">
        <GoogleCalendarConnect
          connected={Boolean(googleAccount)}
          linkedAt={googleAccount?.createdAt.toISOString()}
        />
      </div>
    </div>
  );
}
