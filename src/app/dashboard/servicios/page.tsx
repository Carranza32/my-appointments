import { getServicesList } from "@/actions/services";
import { getStaffList } from "@/actions/personal";
import { ServicesTable } from "@/components/dashboard/services-table";
import { getProfessional } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ServicesPage() {
  const professional = await getProfessional();
  if (!professional) {
    redirect("/login");
  }

  const [services, staff] = await Promise.all([
    getServicesList(),
    getStaffList().catch(() => []),
  ]);

  return (
    <div className="relative mx-auto max-w-7xl pb-12">
      {/* Background Decorative Glows */}
      <div className="absolute top-10 right-10 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 -z-10 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

      <ServicesTable
        initialServices={services}
        staffList={staff}
        currencySymbol="$"
        defaultCurrency={services[0]?.currency || "USD"}
      />
    </div>
  );
}
