import { getStaffList } from "@/actions/personal";
import { StaffTable } from "@/components/dashboard/staff-table";
import { getProfessional } from "@/lib/auth";
import { getLabels } from "@/lib/labels";

export default async function PersonalPage() {
  const professional = await getProfessional();
  const planTier = professional?.planTier ?? "FREE";

  if (planTier !== "PRO") {
    return (
      <div className="relative mx-auto max-w-4xl pb-12 flex flex-col items-center justify-center min-h-[60vh]">
        {/* Apple styled lock screen */}
        <div className="relative overflow-hidden w-full max-w-lg p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.02)] text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center mb-5 text-xl font-bold">
            👥
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
            Gestión de Personal Multivendedor
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#86868B] max-w-sm">
            ¿Tienes un equipo, clínica o salón con múltiples colaboradores? El plan PRO te permite agregar personal ilimitado, cada uno con sus propios horarios, enlaces de reserva y sincronización independiente.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
            <a
              href="/dashboard"
              className="flex-1 text-center rounded-xl border border-black/[0.08] bg-white py-2.5 text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.03] active:scale-[0.98] transition-all"
            >
              Volver al Inicio
            </a>
            <a
              href="/dashboard/settings?tab=plan"
              className="flex-1 text-center rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] py-2.5 text-xs font-medium text-white shadow-xs transition-all"
            >
              Actualizar a PRO
            </a>
          </div>
        </div>
      </div>
    );
  }

  const staff = await getStaffList();
  const labels = getLabels(professional?.rubro ?? "GENERAL");

  return (
    <div className="relative mx-auto max-w-7xl pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            {labels.staffs} y Equipo Clínico
          </h2>
          <p className="mt-1 text-sm text-[#86868B]">
            {professional?.rubro === "PSICOLOGIA"
              ? "Gestiona los perfiles profesionales, horarios laborales individuales y especialidades de tus terapeutas."
              : "Gestiona los perfiles, horarios laborales individuales y datos de contacto de tu equipo."}
          </p>
        </div>
      </div>

      {/* Staff list panel */}
      <div className="mt-6">
        <StaffTable initialStaff={staff} />
      </div>
    </div>
  );
}

