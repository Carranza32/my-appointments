import { redirect } from "next/navigation";
import { getProfessional } from "@/lib/auth";
import { getClients } from "@/actions/clients";
import { getAllClinicalRecords } from "@/actions/crm";
import { ClinicalRecordsView } from "@/components/dashboard/clinical-records-view";
import { getLabels } from "@/lib/labels";

export default async function ExpedientesPage() {
  const professional = await getProfessional();
  if (!professional) redirect("/onboarding");

  const labels = getLabels(professional.rubro);
  if (!labels.enableClinicalRecords) {
    redirect("/dashboard");
  }

  const [records, clients] = await Promise.all([
    getAllClinicalRecords(),
    getClients(),
  ]);

  return (
    <div className="relative mx-auto max-w-7xl pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Expedientes Clínicos y Notas de Sesión
          </h2>
          <p className="mt-1 text-xs text-[#86868B]">
            Gestiona la evolución médica, historial y notas estructuradas en formato SOAP con asistencia de IA para tus {labels.clients.toLowerCase()}.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-6">
        <ClinicalRecordsView
          initialRecords={records}
          clients={clients.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
          }))}
          rubro={professional.rubro}
        />
      </div>
    </div>
  );
}
