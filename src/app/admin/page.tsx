import { getAdminDashboardStats } from "@/actions/admin";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="relative mx-auto max-w-7xl pb-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Métricas Globales del SaaS
          </h2>
          <p className="mt-1 text-xs text-[#86868B]">
            Información centralizada sobre el estado de registros, citas y facturación.
          </p>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Tenants */}
        <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
            Clientes Registrados
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#1D1D1F]">
            {stats.totalTenants}
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            {stats.freeTenants} FREE · {stats.proTenants} PRO
          </p>
        </div>

        {/* Citas de Hoy */}
        <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
            Citas Agendadas Hoy
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#1D1D1F]">
            {stats.todayAppointments}
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            Total histórico: {stats.totalAppointments} citas
          </p>
        </div>

        {/* Clientes CRM */}
        <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
            Contactos en CRM
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#1D1D1F]">
            {stats.totalClients}
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            Clientes finales en todo el SaaS
          </p>
        </div>

        {/* Estimated MRR */}
        <div className="p-5 rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] font-semibold text-[#FF9500] uppercase tracking-wider">
            Ingresos Estimados (MRR)
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#FF9500]">
            ${stats.mrr}.00 USD
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            Calculado a $15.00/mes por PRO
          </p>
        </div>

      </div>

      {/* Recent Registrations Card */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1D1D1F]">
            Últimos 6 Inquilinos Registrados
          </h3>
          <Link
            href="/admin/tenants"
            className="text-xs font-medium text-[#007AFF] hover:underline cursor-pointer"
          >
            Ver todos los clientes
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01] text-[11px] font-medium text-[#86868B]">
                <th className="px-6 py-3.5">Profesional / Negocio</th>
                <th className="px-6 py-3.5">Correo Electrónico</th>
                <th className="px-6 py-3.5">Rubro Comercial</th>
                <th className="px-6 py-3.5 text-center">Nivel del Plan</th>
                <th className="px-6 py-3.5 text-right">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] font-normal text-[#1D1D1F]">
              {stats.recentTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#86868B]">
                    No hay inquilinos registrados.
                  </td>
                </tr>
              ) : (
                stats.recentTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-[#1D1D1F]">
                      {tenant.name}
                    </td>
                    <td className="px-6 py-3.5 text-[#86868B]">
                      {tenant.email}
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
                    <td className="px-6 py-3.5 text-right text-[#86868B]">
                      {new Date(tenant.createdAt).toLocaleDateString("es")}
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
