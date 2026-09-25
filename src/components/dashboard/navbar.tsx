import { getProfessional } from "@/lib/auth";
import { Bell, Settings, Search, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getLabels } from "@/lib/labels";

export async function DashboardNavbar() {
  const professional = await getProfessional();
  const businessName = professional?.name ?? "Negocio";
  const rubro = professional?.rubro ?? "GENERAL";
  const slug = professional?.slug ?? "";
  const labels = getLabels(rubro);

  const initials = businessName
    ? businessName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "AP";

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-between border-b border-[#E5E5EA] bg-white/80 px-4 sm:px-6 md:px-8 backdrop-blur-2xl">
      
      {/* Left section: Logo and Brand */}
      <div className="flex items-center gap-6 md:gap-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 bg-[#007AFF] rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-[1.02] active:scale-95">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="font-heading font-extrabold text-[#1D1D1F] text-base tracking-tight select-none">
            My Appointment
          </span>
        </Link>

        {/* Search Input (macOS look) */}
        <div className="relative hidden md:block w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-[#86868B]" />
          </div>
          <input
            type="text"
            placeholder={`Buscar ${labels.appointments.toLowerCase()} o ${labels.clients.toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-1.5 text-xs font-medium bg-[#F2F2F7] text-[#1D1D1F] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#007AFF]/40 focus:ring-2 focus:ring-[#007AFF]/10 transition-all placeholder-[#86868B]"
          />
        </div>
      </div>

      {/* Right section: Action Buttons & Avatar */}
      <div className="flex items-center gap-3">
        {/* Public portal direct preview */}
        {slug && (
          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E5EA] bg-white hover:bg-[#F2F2F7] text-xs font-semibold text-[#1D1D1F] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            title="Ver portal público de reservas"
          >
            <span>Ver Portal</span>
            <span className="text-[10px] text-[#007AFF]">↗</span>
          </Link>
        )}

        {/* Admin Panel Link */}
        {professional?.role === "ADMIN" && (
          <Link
            href="/admin"
            className="inline-flex items-center justify-center bg-[#FF9500] hover:bg-[#E08500] text-white px-3 py-1.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-all cursor-pointer select-none"
          >
            <span>👑 Admin</span>
          </Link>
        )}

        {/* New Appointment Button */}
        <Link
          href="/dashboard/citas"
          className="inline-flex items-center justify-center bg-[#007AFF] hover:bg-[#0051A8] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-all cursor-pointer select-none shadow-2xs"
        >
          <span>+ {labels.appointment}</span>
        </Link>

        {/* Settings Icon */}
        <Link
          href="/dashboard/settings"
          className="p-2 rounded-xl text-[#86868B] hover:bg-[#F2F2F7] hover:text-[#1D1D1F] transition-colors cursor-pointer active:scale-90"
          title="Configuraciones"
        >
          <Settings className="h-4 w-4" />
        </Link>

        {/* Divider */}
        <div className="h-4 w-px bg-[#E5E5EA]"></div>

        {/* User Avatar */}
        <Link href="/dashboard/settings" className="relative group cursor-pointer flex items-center gap-2" title={businessName}>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-[#E5E5EA] shadow-2xs bg-gradient-to-br from-[#007AFF] to-[#0051A8] flex items-center justify-center text-white text-[11px] font-bold">
            {initials}
          </div>
        </Link>

      </div>
    </header>
  );
}
