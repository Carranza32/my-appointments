import { GoogleCalendarConnect } from "@/components/dashboard/google-calendar-connect";
import { getProfessional } from "@/lib/auth";
import { FeatureGate } from "@/components/ui/feature-gate";

type Props = {
  searchParams: Promise<{ google?: string; message?: string }>;
};

export default async function IntegrationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const professional = await getProfessional();
  const googleAccount = professional?.googleAccount;

  return (
    <div className="relative mx-auto max-w-5xl pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Integraciones
          </h2>
          <p className="mt-1 text-xs text-[#86868B]">
            Las integraciones son opcionales. Tu agenda principal vive en{" "}
            <span className="text-[#007AFF] font-medium">Mis citas</span>; Google Calendar añade sincronización bidireccional extra.
          </p>
        </div>
      </div>

      {params.google === "connected" && (
        <div className="flex items-center gap-2 rounded-xl border border-[#34C759]/20 bg-[#34C759]/10 px-4 py-3 text-xs text-[#34C759] backdrop-blur-2xl animate-in fade-in duration-200">
          <span className="text-sm">✓</span>
          <span className="font-medium text-[#1D1D1F]">Google Calendar conectado correctamente.</span>
        </div>
      )}

      {params.google === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 px-4 py-3 text-xs text-[#FF3B30] backdrop-blur-2xl animate-in fade-in duration-200">
          <span className="text-sm">⚠️</span>
          <span className="font-medium text-[#1D1D1F]">Error al conectar: {params.message ?? "Intenta de nuevo."}</span>
        </div>
      )}

      <div className="max-w-2xl">
        <FeatureGate
          planTier={professional?.planTier ?? "FREE"}
          requiredPlan="PRO"
          fallback={
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-black/[0.12] bg-white/80 p-6 backdrop-blur-2xl select-none">
              {/* Blurred dummy state */}
              <div className="opacity-20 blur-[1px] pointer-events-none select-none">
                <GoogleCalendarConnect
                  connected={false}
                />
              </div>
              
              {/* Premium locked overlay callout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/60 backdrop-blur-[2px]">
                <span className="rounded-full bg-[#FF9500]/10 text-[#FF9500] font-medium text-[11px] px-3 py-1 uppercase tracking-wider mb-3">
                  PRO FEATURE
                </span>
                <h4 className="text-base font-semibold tracking-tight text-[#1D1D1F]">
                  Sincronización Bidireccional
                </h4>
                <p className="mt-2 text-xs text-[#86868B] max-w-sm">
                  La integración y sincronización de citas con Google Calendar requiere una cuenta en el plan <strong className="text-[#1D1D1F] font-medium">PRO</strong>.
                </p>
                <a
                  href="/dashboard/settings?tab=plan"
                  className="mt-4 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] px-5 py-2.5 text-xs font-medium text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  Actualizar a PRO
                </a>
              </div>
            </div>
          }
        >
          <GoogleCalendarConnect
            connected={Boolean(googleAccount)}
            linkedAt={googleAccount?.createdAt.toISOString()}
          />
        </FeatureGate>
      </div>
    </div>
  );
}
