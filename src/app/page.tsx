import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser, getProfessional } from "@/lib/auth";
import { ParticleBackground } from "@/components/auth/particle-background";

export default async function HomePage() {
  const authUser = await getAuthUser();
  if (authUser) {
    const professional = await getProfessional();
    redirect(professional ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="relative min-h-screen w-screen overflow-hidden flex flex-col justify-center items-center px-6 py-20 font-sans bg-[#F5F5F7]">
      
      {/* 1. Interactive Canvas Particle Background */}
      <ParticleBackground />

      {/* 2. Top-Left Brand Logo */}
      <header className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 bg-[#007AFF] rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 border border-white/20 transition-transform active:scale-[0.98] group-hover:scale-105">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="font-semibold text-[#1D1D1F] text-base tracking-tight select-none">
            My Appointment
          </span>
        </div>
      </header>

      {/* 3. Centered Frost Glass Card */}
      <main className="relative z-10 w-full max-w-[420px] bg-white/80 border border-black/[0.06] p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-[#007AFF]/10 to-transparent blur-2xl pointer-events-none rounded-2xl"></div>
        
        {/* Brand Header */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF]/60 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007AFF]"></span>
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#007AFF]">
            My Appointment
          </p>
        </div>

        {/* Headline */}
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#1D1D1F] leading-tight">
          Agenda citas <br />
          <span className="text-[#007AFF]">
            sin fricción
          </span>
        </h1>

        <p className="mt-3 text-xs leading-relaxed text-[#86868B] font-normal">
          Configura tu perfil profesional, define tus horarios hábiles de atención y empieza a recibir reservas automáticas directamente en tu página pública.
        </p>

        {/* Action Button Grid */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#007AFF] hover:bg-[#0062cc] py-3 text-xs font-medium text-white shadow-sm active:scale-[0.98] transition-all cursor-pointer select-none"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="flex-1 inline-flex items-center justify-center rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] py-3 text-xs font-medium text-[#1D1D1F] active:scale-[0.98] transition-all cursor-pointer select-none"
          >
            Iniciar sesión
          </Link>
        </div>
      </main>

      {/* 4. Bottom Footer links */}
      <footer className="absolute bottom-8 left-0 right-0 z-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-[#86868B] font-normal select-none text-[11px]">
        <span>© 2026 My Appointment. Todos los derechos reservados.</span>
      </footer>

    </div>
  );
}
