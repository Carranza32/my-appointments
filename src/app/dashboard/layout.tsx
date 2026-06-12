import { redirect } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getProfessional } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const professional = await getProfessional();
  if (!professional) redirect("/onboarding");

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gradient-to-br from-white to-[#E8EFFE] dark:from-slate-950 dark:to-slate-900 font-sans">
      <DashboardNavbar />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar planTier={professional?.planTier ?? "FREE"} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
