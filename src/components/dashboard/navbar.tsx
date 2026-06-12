import { getProfessional } from "@/lib/auth";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Bell, Settings, Search, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export async function DashboardNavbar() {
  const professional = await getProfessional();
  const businessName = professional?.name ?? "Dr. García";
  
  // Use a nice avatar placeholder if none exists
  const avatarUrl = "/placeholder-avatar.jpg"; // Fallback placeholder path

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between border-b border-white/20 bg-white/60 px-6 md:px-8 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/60 shadow-sm transition-colors duration-300">
      
      {/* Left section: Logo and Brand */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="h-9 w-9 bg-[#1A73E8] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10 transition-transform group-hover:scale-105">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="font-heading font-extrabold text-[#1A73E8] text-lg tracking-tight select-none">
            My Appointment
          </span>
        </Link>

        {/* Search Input (Mock) */}
        <div className="relative hidden md:block w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search appointments..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-[#f1f3f4]/80 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border border-transparent rounded-full focus:outline-none focus:bg-white focus:border-[#1A73E8] dark:focus:bg-slate-900 focus:shadow-sm transition-all placeholder-slate-450 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Right section: Action Buttons & Avatar */}
      <div className="flex items-center gap-4">
        
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950"></span>
        </button>

        {/* Settings Icon */}
        <Link href="/dashboard/settings" className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer">
          <Settings className="h-5 w-5" />
        </Link>

        {/* New Appointment Button */}
        <Link
          href="/dashboard/citas"
          className="inline-flex items-center gap-1.5 bg-[#1A73E8] hover:bg-[#005bbf] text-white px-4 py-2 rounded-full text-xs font-extrabold shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20 active:scale-98 transition-all cursor-pointer select-none"
        >
          <span>New Appointment</span>
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-850"></div>

        {/* User Avatar */}
        <div className="relative group cursor-pointer flex items-center gap-2">
          <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-white/50 dark:border-slate-800 shadow-md">
            {/* Fallback back to standard avatar image or styled initials if preferred */}
            <div className="h-full w-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold font-heading">
              {businessName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
