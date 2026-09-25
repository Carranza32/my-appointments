import { getClients } from "@/actions/clients";
import { ClientsTable } from "@/components/dashboard/clients-table";
import { getProfessional } from "@/lib/auth";
import { getLabels } from "@/lib/labels";

export default async function ClientesPage() {
  const [clients, professional] = await Promise.all([
    getClients(),
    getProfessional(),
  ]);

  const rubro = professional?.rubro ?? "GENERAL";
  const labels = getLabels(rubro);

  return (
    <div className="relative mx-auto max-w-7xl pb-12">
      {/* Ambient subtle lighting */}
      <div className="absolute top-0 right-10 -z-10 h-72 w-72 rounded-full bg-[#007AFF]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 -z-10 h-80 w-80 rounded-full bg-[#5856D6]/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-3xl text-[#1D1D1F] tracking-tight leading-tight">
            Directorio de {labels.clients}
          </h2>
          <p className="mt-1 text-sm font-medium text-[#86868B]">
            Administra, edita, busca y organiza los datos de contacto y observaciones de tus {labels.clients.toLowerCase()}.
          </p>
        </div>
      </div>

      {/* Client List Datatable area */}
      <div className="mt-6">
        <ClientsTable initialClients={clients} rubro={rubro} />
      </div>
    </div>
  );
}
