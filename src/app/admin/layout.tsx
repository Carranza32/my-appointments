import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    // Redirect normal tenants or guests back to standard dashboard
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F5F5F7] font-sans antialiased">
      <DashboardNavbar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
