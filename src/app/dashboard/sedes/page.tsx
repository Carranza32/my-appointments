import { getLocationsList } from "@/actions/sedes";
import { LocationTable } from "@/components/dashboard/location-table";

export default async function SedesPage() {
  const locations = await getLocationsList();

  return (
    <div className="relative mx-auto max-w-7xl pb-12">
      {/* Decorative Glows in Background */}
      <div className="absolute top-10 right-10 -z-10 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/5 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 -z-10 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5 animate-float-delayed pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-heading tracking-tight text-slate-800 dark:text-slate-100">
            Sedes y Sucursales
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Gestiona las ubicaciones físicas y sucursales donde prestas tus servicios.
          </p>
        </div>
      </div>

      {/* Locations list panel */}
      <div className="mt-6">
        <LocationTable initialLocations={locations} />
      </div>
    </div>
  );
}
