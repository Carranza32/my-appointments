"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  ArrowLeft,
} from "lucide-react";

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const links: SidebarLink[] = [
  {
    href: "/admin",
    label: "Métricas Globales",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/tenants",
    label: "Clientes (Tenants)",
    icon: Users,
  },
  {
    href: "/admin/revenue",
    label: "Ingresos (Wompi)",
    icon: DollarSign,
  },
];

export function AdminSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="relative flex w-full flex-col border-b border-black/[0.06] bg-white/80 text-[#1D1D1F] md:w-64 md:border-b-0 md:border-r md:h-full shrink-0 z-10 backdrop-blur-2xl">
      {/* Navigation Links Area */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden pt-4">
        <div>
          {/* Header indicator */}
          <div className="px-5 py-2">
            <span className="text-[11px] font-semibold text-[#FF9500] bg-[#FF9500]/10 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
              <span>👑</span>
              <span>Panel Admin SaaS</span>
            </span>
          </div>

          <nav className="flex flex-row md:flex-col gap-1 p-3 md:py-3 overflow-x-auto md:overflow-x-visible scrollbar-none">
            {links.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href ||
                (link.href !== "/admin" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    active
                      ? "bg-[#007AFF] text-white shadow-xs"
                      : "text-[#1D1D1F] hover:bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-white" : "text-[#86868B] group-hover:text-[#1D1D1F]"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Back to SaaS portal */}
        <div className="p-3 border-t border-black/[0.06]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium rounded-xl text-[#86868B] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition-all cursor-pointer active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Volver al SaaS</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
