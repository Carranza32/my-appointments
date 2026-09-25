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
    <div 
      className="relative flex flex-col h-screen w-screen overflow-hidden bg-[#F5F5F7] text-[#1C1C1E] font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      {/* Liquid Glass background blobs */}
      <div className="absolute top-[10%] left-[25%] -z-10 h-80 w-80 rounded-full bg-[#007AFF]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] -z-10 h-96 w-96 rounded-full bg-[#5856D6]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-[50%] left-[10%] -z-10 h-72 w-72 rounded-full bg-[#FF2D55]/6 blur-3xl pointer-events-none" />

      <DashboardNavbar />
      <div className="flex flex-1 overflow-hidden z-0">
        <DashboardSidebar planTier={professional?.planTier ?? "FREE"} rubro={professional?.rubro ?? "GENERAL"} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
