"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ParticleBackground } from "@/components/auth/particle-background";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  }

  return (
    <div className="relative min-h-screen w-screen overflow-hidden flex flex-col justify-center items-center px-6 py-20 font-sans bg-[#F5F5F7]">
      
      {/* 1. Interactive Canvas Particle Background */}
      <ParticleBackground />

      {/* 2. Top-Left Brand Logo */}
      <header className="absolute top-8 left-8 z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 bg-[#007AFF] rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <svg
              className="h-4 w-4 text-white"
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

        <h1 className="text-xl font-semibold text-[#1D1D1F] tracking-tight leading-tight text-center">
          Nueva Contraseña
        </h1>
        <p className="mt-2 text-xs text-[#86868B] text-center leading-normal font-normal">
          Ingresa y confirma tu nueva contraseña de acceso.
        </p>

        {success ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl bg-[#34C759]/10 px-3.5 py-2.5 text-xs font-medium text-[#34C759] border border-[#34C759]/20 text-center">
              ✓ Contraseña actualizada correctamente. Redirigiéndote al inicio de sesión…
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-normal bg-black/[0.03] border border-black/[0.08] rounded-xl focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-[#1D1D1F] placeholder:text-[#86868B] transition-all"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-normal bg-black/[0.03] border border-black/[0.08] rounded-xl focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-[#1D1D1F] placeholder:text-[#86868B] transition-all"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-[#FF3B30]/10 px-3.5 py-2.5 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-xl bg-[#007AFF] hover:bg-[#0062cc] py-2.5 text-xs font-medium text-white shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer select-none"
            >
              {loading ? "Actualizando..." : "Restablecer Contraseña"}
            </button>
          </form>
        )}
      </main>

      {/* 4. Bottom Footer links */}
      <footer className="absolute bottom-8 left-0 right-0 z-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-[#86868B] font-normal select-none text-[11px]">
        <span>© 2026 My Appointment. Todos los derechos reservados.</span>
      </footer>

    </div>
  );
}
