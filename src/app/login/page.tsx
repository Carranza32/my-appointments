import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { ParticleBackground } from "@/components/auth/particle-background";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-screen overflow-hidden flex flex-col justify-center items-center px-6 py-20 font-sans bg-[#F5F5F7]">
      
      {/* 1. Interactive Canvas Particle Background */}
      <ParticleBackground />

      {/* 2. Top-Left Brand Logo */}
      <header className="absolute top-8 left-8 z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
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
        </Link>
      </header>

      {/* 3. Centered Frost Glass Card */}
      <main className="relative z-10 w-full max-w-[400px] bg-white/80 border border-black/[0.06] p-7 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-[#007AFF]/10 to-transparent blur-2xl pointer-events-none rounded-2xl"></div>
        
        {/* Render AuthForm in Login mode */}
        <AuthForm mode="login" />

        {/* Development & Testing Links */}
        <div className="mt-6 pt-4 border-t border-black/[0.06] text-center select-none">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868B] block">
            Acceso Rápido para Pruebas
          </span>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs font-medium text-[#007AFF]">
            <Link href="/signup" className="hover:underline">Crear Cuenta Nueva</Link>
            <span className="text-[#86868B]/40">|</span>
            <Link href="/onboarding?reset=true" className="hover:underline">Probar Smart Onboarding 2.0</Link>
          </div>
        </div>
      </main>

      {/* 4. Bottom Footer links */}
      <footer className="absolute bottom-8 left-0 right-0 z-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-[#86868B] font-normal select-none text-[11px]">
        <span>© 2026 My Appointment. Todos los derechos reservados.</span>
      </footer>

    </div>
  );
}
