import { getAdminRevenueStats } from "@/actions/admin";
import Link from "next/link";
import { DollarSign, Users, Award, TrendingUp, ArrowUpRight, Eye } from "lucide-react";

export default async function AdminRevenuePage() {
  const stats = await getAdminRevenueStats();

  return (
    <div className="relative mx-auto max-w-7xl pb-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Métricas de Ingresos (Wompi)
          </h2>
          <p className="mt-1 text-xs text-[#86868B]">
            Seguimiento de suscripciones PRO activas y estimación de ingresos mensuales (MRR).
          </p>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Estimated MRR */}
        <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#FF9500] uppercase tracking-wider">
              MRR Estimado
            </span>
            <div className="h-7 w-7 bg-[#FF9500]/10 rounded-lg flex items-center justify-center text-[#FF9500]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-semibold text-[#FF9500]">
            ${stats.mrr}.00 USD
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            Ingresos mensuales recurrentes estimados
          </p>
        </div>

        {/* Active Subscribers */}
        <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Suscripciones PRO
            </span>
            <div className="h-7 w-7 bg-black/[0.04] rounded-lg flex items-center justify-center text-[#1D1D1F]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-semibold text-[#1D1D1F]">
            {stats.proTenants}
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            De un total de {stats.totalTenants} inquilinos
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Tasa de Conversión
            </span>
            <div className="h-7 w-7 bg-black/[0.04] rounded-lg flex items-center justify-center text-[#1D1D1F]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-semibold text-[#1D1D1F]">
            {stats.conversionRate}%
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            Porcentaje de clientes FREE a PRO
          </p>
        </div>

        {/* Price Per Subscription */}
        <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Precio de Suscripción
            </span>
            <div className="h-7 w-7 bg-black/[0.04] rounded-lg flex items-center justify-center text-[#1D1D1F]">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-semibold text-[#1D1D1F]">
            $15.00 USD
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            Precio fijo mensual por PRO (Wompi)
          </p>
        </div>

      </div>

      {/* Info Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white/80 p-5 text-xs text-[#86868B] backdrop-blur-2xl leading-relaxed shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <span className="text-base select-none">ℹ️</span>
        <div>
          <span className="font-semibold text-[#1D1D1F] block mb-0.5">Nota sobre Integración con Wompi</span>
          El MRR y las suscripciones PRO activas listadas abajo reflejan a los inquilinos que tienen habilitado el plan <span className="font-medium text-[#1D1D1F]">PRO</span> en nuestra base de datos. Wompi procesa el cobro del enlace de pago y envía un Webhook seguro a la plataforma para habilitar el acceso. Las anulaciones de planes se realizan de forma manual o tras no recibir el pago mensual.
        </div>
      </div>

      {/* PRO Subscribers Table Card */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1D1D1F]">
            Suscriptores PRO Activos ({stats.proUsers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01] text-[11px] font-medium text-[#86868B]">
                <th className="px-6 py-3.5">Profesional / Negocio</th>
                <th className="px-6 py-3.5">Correo Electrónico</th>
                <th className="px-6 py-3.5">Dominio/Slug</th>
                <th className="px-6 py-3.5 text-center">Contribución Mensual</th>
                <th className="px-6 py-3.5 text-center">Fecha Registro</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] font-normal text-[#1D1D1F]">
              {stats.proUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#86868B]">
                    No hay suscriptores PRO activos en este momento.
                  </td>
                </tr>
              ) : (
                stats.proUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-[#1D1D1F]">
                      {user.name}
                    </td>
                    <td className="px-6 py-3.5 text-[#86868B]">
                      {user.email}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-[#86868B]">
                      {user.slug}
                    </td>
                    <td className="px-6 py-3.5 text-center text-[#34C759] font-semibold">
                      $15.00 USD
                    </td>
                    <td className="px-6 py-3.5 text-center text-[#86868B]">
                      {new Date(user.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/admin/tenants/${user.id}`}
                        className="inline-flex items-center gap-1 bg-black/[0.04] hover:bg-black/[0.08] active:scale-[0.98] px-3 py-1.5 rounded-xl text-xs font-medium text-[#1D1D1F] transition-all cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#86868B]" />
                        <span>Detalles</span>
                      </Link>
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
