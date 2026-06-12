"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  MapPin,
  Settings,
  LogOut
} from "lucide-react";

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const links: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/citas",
    label: "Citas",
    icon: Calendar,
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: Users,
  },
  {
    href: "/dashboard/personal",
    label: "Personal",
    icon: UserCog,
  },
  {
    href: "/dashboard/sedes",
    label: "Sedes",
    icon: MapPin,
  },
  {
    href: "/dashboard/settings",
    label: "Configuraciones",
    icon: Settings,
  },
];

type Props = {
  planTier?: "FREE" | "PRO";
};

export function DashboardSidebar({ planTier = "FREE" }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="relative flex w-full flex-col border-b border-white/20 bg-white/45 text-slate-700 md:w-64 md:border-b-0 md:border-r md:h-full shrink-0 z-10 backdrop-blur-xl dark:border-white/5 dark:bg-slate-955/40 dark:text-slate-350">
      
      {/* Decorative Glow */}
      <div className="absolute -left-12 -top-12 -z-10 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl pointer-events-none hidden md:block"></div>

      {/* Navigation Links Area */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden">
        <div>
          <nav className="flex flex-row md:flex-col gap-1 p-3 md:py-6 overflow-x-auto md:overflow-x-visible scrollbar-none">
            {links.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-blue-50/80 text-[#1A73E8] shadow-sm dark:bg-blue-955/20 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-100/50 hover:text-[#1A73E8] dark:text-slate-400 dark:hover:bg-slate-900/40 dark:hover:text-blue-400"
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${active ? "text-[#1A73E8] dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-[#1A73E8] dark:group-hover:text-blue-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Plan Status & Logout Card (Desktop only) */}
        <div className="hidden md:flex flex-col shrink-0">
          
          {/* Plan Status Card */}
          {planTier === "FREE" ? (
            <div className="mx-3.5 mb-3.5 p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-100/50 dark:from-slate-900/60 dark:to-blue-950/20 dark:border-slate-800/60 shadow-inner space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Plan Gratuito
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                Sube a Pro para habilitar recordatorios ilimitados e integraciones.
              </p>
              <Link
                href="/dashboard/settings?tab=plan"
                className="block w-full text-center rounded-xl bg-[#1A73E8] hover:bg-[#005bbf] transition-colors py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Upgrade Plan
              </Link>
            </div>
          ) : (
            <div className="mx-3.5 mb-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-100/50 dark:from-slate-900/60 dark:to-emerald-950/20 dark:border-slate-800/60 shadow-inner flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold shadow-xs text-xs">
                  🏅
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Pro Professional
                  </h4>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Plan Activo
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Section */}
          <div className="p-3.5 border-t border-slate-200/50 dark:border-slate-800/40">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl text-red-500 hover:bg-red-500/5 transition-all cursor-pointer"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </div>
    </aside>
  );
}
