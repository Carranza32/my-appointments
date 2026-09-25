import { getAdminTenantsList } from "@/actions/admin";
import { TenantsFilters } from "@/components/admin/tenants-filters";
import Link from "next/link";
import { Eye, ExternalLink } from "lucide-react";

type Props = {
  searchParams: Promise<{
    search?: string;
    plan?: string;
  }>;
};

export default async function TenantsDirectoryPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search || "";
  const plan = (resolvedSearchParams.plan as "FREE" | "PRO" | "ALL") || "ALL";

  const tenants = await getAdminTenantsList({ search, plan });

  return (
    <div className="relative mx-auto max-w-7xl pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Directorio de Inquilinos (Tenants)
          </h2>
          <p className="mt-1 text-xs text-[#86868B]">
            Listado global de profesionales y empresas registradas en la plataforma.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div>
        <TenantsFilters initialSearch={search} initialPlan={plan} />
      </div>

      {/* Tenants Table Card */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1D1D1F]">
            Todos los Clientes ({tenants.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01] text-[11px] font-medium text-[#86868B]">
                <th className="px-6 py-3.5">Negocio / Profesional</th>
                <th className="px-6 py-3.5">Rubro</th>
                <th className="px-6 py-3.5 text-center">Plan</th>
                <th className="px-6 py-3.5 text-center">Ubicaciones / Staff</th>
                <th className="px-6 py-3.5 text-center">Citas / Clientes</th>
                <th className="px-6 py-3.5 text-center">Fecha Registro</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] font-normal text-[#1D1D1F]">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#86868B]">
                    No se encontraron inquilinos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-[#1D1D1F]">
                        {tenant.name}
                      </div>
                      <div className="text-[11px] text-[#86868B] mt-0.5">
                        {tenant.email} · <span className="font-mono">{tenant.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-block rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-[#1D1D1F] uppercase">
                        {tenant.rubro}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {tenant.planTier === "PRO" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF9500]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#FF9500]">
                          🏅 PRO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[#86868B]">
                          FREE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono text-xs">
                      <span className="text-[#1D1D1F] font-medium">{tenant.locationsCount}</span>
                      <span className="text-[#86868B] mx-1">/</span>
                      <span className="text-[#86868B]">{tenant.staffCount}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono text-xs">
                      <span className="text-[#1D1D1F] font-medium">{tenant.appointmentsCount}</span>
                      <span className="text-[#86868B] mx-1">/</span>
                      <span className="text-[#86868B]">{tenant.clientsCount}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center text-[#86868B]">
                      {new Date(tenant.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Live portal link */}
                        <a
                          href={`https://${tenant.slug}.localhost:3000`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Visitar Portal Público"
                          className="p-1.5 rounded-xl border border-black/[0.08] bg-white text-[#86868B] hover:text-[#007AFF] hover:border-[#007AFF]/30 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        {/* Detail Link */}
                        <Link
                          href={`/admin/tenants/${tenant.id}`}
                          title="Ver Detalle / Editar Plan"
                          className="inline-flex items-center gap-1 bg-black/[0.04] hover:bg-black/[0.08] active:scale-[0.98] px-3 py-1.5 rounded-xl text-xs font-medium text-[#1D1D1F] transition-all cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#86868B]" />
                          <span>Detalles</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
