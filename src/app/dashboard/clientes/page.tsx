import { getClients } from "@/actions/clients";
import { ClientsTable } from "@/components/dashboard/clients-table";

export default async function ClientesPage() {
  const clients = await getClients();

  return (
    <div className="relative mx-auto max-w-7xl pb-12">
      {/* Decorative Glows in Background */}
      <div className="absolute top-10 right-10 -z-10 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/5 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 -z-10 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5 animate-float-delayed pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
            Directorio de Clientes
          </h2>
          <p className="mt-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Administra, edita, busca y organiza los datos de contacto y observaciones de tus clientes.
          </p>
        </div>
      </div>

      {/* Client List Datatable area */}
      <div className="mt-6">
        <ClientsTable initialClients={clients} />
      </div>
    </div>
  );
}
