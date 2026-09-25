"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getLabels } from "@/lib/labels";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  MapPin,
  Settings,
  LogOut,
  Link2,
  CreditCard,
  Sparkles,
  FileText,
} from "lucide-react";
import { UpgradeBadge } from "@/components/ui/upgrade-badge";

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Props = {
  planTier?: "FREE" | "PRO";
  rubro?: string;
};

export function DashboardSidebar({ planTier = "FREE", rubro = "GENERAL" }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const labels = getLabels(rubro);

  const dynamicLinks = [
    {
      href: "/dashboard",
      label: "Inicio",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/citas",
      label: labels.appointments,
      icon: Calendar,
    },
    {
      href: "/dashboard/servicios",
      label: "Servicios",
      icon: Sparkles,
    },
    {
      href: "/dashboard/clientes",
      label: labels.clients,
      icon: Users,
    },
    ...(labels.enableClinicalRecords
      ? [
          {
            href: "/dashboard/expedientes",
            label: "Expedientes",
            icon: FileText,
            isPremium: true,
          },
        ]
      : []),
    {
      href: "/dashboard/personal",
      label: labels.staffs,
      icon: UserCog,
      isPremium: true,
    },
    {
      href: "/dashboard/sedes",
      label: labels.locations,
      icon: MapPin,
    },
    {
      href: "/dashboard/integrations",
      label: "Integraciones",
      icon: Link2,
      isPremium: true,
    },
    {
      href: "/dashboard/pagos",
      label: "Verificar Pagos",
      icon: CreditCard,
    },
    {
      href: "/dashboard/settings",
      label: "Configuraciones",
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="relative flex w-full flex-col border-b border-[#E5E5EA] bg-white/80 text-[#1D1D1F] md:w-64 md:border-b-0 md:border-r md:h-full shrink-0 z-10 backdrop-blur-2xl">
      
      {/* Navigation Links Area */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden pt-4">
        <div>
          <nav className="flex flex-row md:flex-col gap-1 p-3 md:py-3 overflow-x-auto md:overflow-x-visible scrollbar-none">
            {dynamicLinks.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    active
                      ? "bg-[#007AFF] text-white shadow-sm shadow-[#007AFF]/20 font-bold"
                      : "text-[#48484A] hover:bg-[#F2F2F7] hover:text-[#1D1D1F]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[#86868B] group-hover:text-[#1D1D1F]"}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.isPremium && planTier === "FREE" && (
                    <UpgradeBadge />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Plan Status & Logout Card (Desktop only) */}
        <div className="hidden md:flex flex-col shrink-0">
          
          {/* Plan Status Card */}
          {planTier === "FREE" ? (
            <div className="mx-3.5 mb-3.5 p-4 rounded-2xl bg-[#FBFBFD] border border-[#E5E5EA] shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF]/60 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007AFF]"></span>
                </span>
                <span className="text-xs font-bold text-[#1D1D1F]">
                  Plan Gratuito
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#86868B] leading-normal">
                Sube a Pro para habilitar recordatorios automáticos e integraciones.
              </p>
              <Link
                href="/dashboard/settings?tab=plan"
                className="block w-full text-center rounded-xl bg-[#007AFF] hover:bg-[#0051A8] transition-all py-2 text-xs font-bold text-white shadow-2xs cursor-pointer active:scale-[0.98]"
              >
                Mejorar Plan
              </Link>
            </div>
          ) : (
            <div className="mx-3.5 mb-3.5 p-3.5 rounded-2xl bg-[#FBFBFD] border border-[#E5E5EA] shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#34C759]/15 text-[#34C759] font-bold text-xs">
                  ★
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#1D1D1F]">
                    Plan Pro
                  </h4>
                  <p className="text-[9px] font-bold text-[#34C759] uppercase tracking-wider">
                    Activo
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Section */}
          <div className="p-3.5 border-t border-[#E5E5EA]">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl text-[#FF3B30] hover:bg-[#FF3B30]/5 transition-all cursor-pointer active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </div>
    </aside>
  );
}
