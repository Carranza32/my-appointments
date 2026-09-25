import { getLocationsList } from "@/actions/sedes";
import { LocationTable } from "@/components/dashboard/location-table";
import { getProfessional } from "@/lib/auth";

import { getLabels } from "@/lib/labels";

export default async function SedesPage() {
  const locations = await getLocationsList();
  const professional = await getProfessional();
  const labels = getLabels(professional?.rubro ?? "GENERAL");

  return (
    <div className="relative mx-auto max-w-7xl pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            {labels.locations} y Espacios de Atención
          </h2>
          <p className="mt-1 text-sm text-[#86868B]">
            {professional?.rubro === "PSICOLOGIA"
              ? "Gestiona los consultorios físicos y salas virtuales donde brindas tus sesiones."
              : "Gestiona las ubicaciones físicas y sucursales donde prestas tus servicios."}
          </p>
        </div>
      </div>

      {/* Locations list panel */}
      <div className="mt-6">
        <LocationTable initialLocations={locations} planTier={professional?.planTier ?? "FREE"} />
      </div>
    </div>
  );
}

