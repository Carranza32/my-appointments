import { getAdminTenantDetail } from "@/actions/admin";
import { TenantPlanToggle } from "@/components/admin/tenant-plan-toggle";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Users2,
  MapPin,
  UserCheck,
  Clock,
  Globe,
  Settings,
  ShieldCheck,
  Activity,
  ExternalLink,
} from "lucide-react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params;
  
  let tenant;
  try {
    tenant = await getAdminTenantDetail(id);
  } catch (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h3 className="text-lg font-semibold text-[#1D1D1F]">
          Inquilino no encontrado
        </h3>
        <p className="mt-2 text-xs text-[#86868B]">
          El inquilino especificado no existe o fue removido del sistema.
        </p>
        <Link
          href="/admin/tenants"
          className="mt-6 inline-flex items-center gap-2 bg-[#007AFF] hover:bg-[#0062cc] text-white px-4 py-2 rounded-xl text-xs font-medium active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al directorio</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-5xl pb-12 space-y-6">
      {/* Back to list button */}
      <div>
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Directorio</span>
        </Link>
      </div>

      {/* Tenant Header Panel */}
      <div className="p-6 md:p-8 rounded-2xl border border-black/[0.06] bg-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-block rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-[#1D1D1F] uppercase tracking-wider">
                Rubro: {tenant.rubro}
              </span>
              {tenant.planTier === "PRO" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF9500]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#FF9500]">
                  🏅 PRO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[#86868B]">
                  FREE
                </span>
              )}
            </div>
            
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              {tenant.name}
            </h2>
            <p className="mt-1 text-xs text-[#86868B]">
              {tenant.email} · Slug portal: <span className="font-mono text-[#007AFF] font-medium">{tenant.slug}</span>
            </p>
            
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#86868B]">
              <span>Registrado el: {new Date(tenant.createdAt).toLocaleDateString("es-ES", { dateStyle: "long" })}</span>
              <span>•</span>
              <a
                href={`https://${tenant.slug}.localhost:3000`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#007AFF] hover:underline cursor-pointer"
              >
                <span>Visitar Portal de Citas</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2 cols wide): Metrics and configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Total Citas */}
            <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-2xl flex items-center gap-4">
              <div className="h-10 w-10 bg-[#007AFF]/10 text-[#007AFF] rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                  Citas Totales
                </div>
                <div className="text-xl font-semibold text-[#1D1D1F] mt-0.5">
                  {tenant.appointmentsCount}
                </div>
              </div>
            </div>

            {/* Total Clientes */}
            <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-2xl flex items-center gap-4">
              <div className="h-10 w-10 bg-[#5856D6]/10 text-[#5856D6] rounded-xl flex items-center justify-center shrink-0">
                <Users2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                  Clientes
                </div>
                <div className="text-xl font-semibold text-[#1D1D1F] mt-0.5">
                  {tenant.clientsCount}
                </div>
              </div>
            </div>

            {/* Total Sedes */}
            <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-2xl flex items-center gap-4">
              <div className="h-10 w-10 bg-[#AF52DE]/10 text-[#AF52DE] rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                  Sedes / Ubicaciones
                </div>
                <div className="text-xl font-semibold text-[#1D1D1F] mt-0.5">
                  {tenant.locationsCount}
                </div>
              </div>
            </div>

            {/* Total Staff */}
            <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-2xl flex items-center gap-4">
              <div className="h-10 w-10 bg-[#34C759]/10 text-[#34C759] rounded-xl flex items-center justify-center shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                  Personal (Staff)
                </div>
                <div className="text-xl font-semibold text-[#1D1D1F] mt-0.5">
                  {tenant.staffCount}
                </div>
              </div>
            </div>

          </div>

          {/* Business Configuration Details */}
          <div className="p-6 rounded-2xl border border-black/[0.06] bg-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-2xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#86868B]" />
              <span>Configuración y Preferencias</span>
            </h3>
            
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#86868B]" />
                  <div>
                    <div className="text-[11px] text-[#86868B]">
                      Duración del Intervalo
                    </div>
                    <div className="font-medium text-[#1D1D1F] mt-0.5">
                      {tenant.config?.slotDuration ?? 30} minutos
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#86868B]" />
                  <div>
                    <div className="text-[11px] text-[#86868B]">
                      Tiempo de Holgura (Buffer)
                    </div>
                    <div className="font-medium text-[#1D1D1F] mt-0.5">
                      {tenant.config?.bufferTime ?? 0} minutos
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-[#86868B]" />
                  <div>
                    <div className="text-[11px] text-[#86868B]">
                      Zona Horaria
                    </div>
                    <div className="font-medium text-[#1D1D1F] mt-0.5">
                      {tenant.config?.timezone ?? "America/El_Salvador"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-[#86868B]" />
                  <div>
                    <div className="text-[11px] text-[#86868B]">
                      Google Calendar Sincronizado
                    </div>
                    <div className="font-medium text-[#1D1D1F] mt-0.5 flex items-center gap-1.5">
                      {tenant.googleConnected ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-[#34C759]"></span>
                          <span className="text-[#34C759]">Conectado y Activo</span>
                        </>
                      ) : (
                        <span className="text-[#86868B]">No Conectado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-6 pt-5 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#86868B]" />
                <div>
                  <span className="font-medium text-[#1D1D1F]">Remover Marca del SaaS (White-labeling)</span>
                  <p className="text-[11px] text-[#86868B]">Solo disponible en el plan PRO.</p>
                </div>
              </div>
              <div>
                {tenant.config?.removeBranding ? (
                  <span className="rounded-full bg-[#34C759]/10 text-[#34C759] px-2.5 py-0.5 font-medium text-[11px]">
                    Activo
                  </span>
                ) : (
                  <span className="rounded-full bg-black/[0.04] text-[#86868B] px-2.5 py-0.5 font-medium text-[11px]">
                    Inactivo
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right column (1 col wide): Administrative Panel */}
        <div>
          <TenantPlanToggle tenantId={tenant.id} initialPlanTier={tenant.planTier} />
        </div>

      </div>
    </div>
  );
}
