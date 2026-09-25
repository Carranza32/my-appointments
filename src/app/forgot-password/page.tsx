"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ParticleBackground } from "@/components/auth/particle-background";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const siteUrl = window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Se ha enviado un enlace de recuperación a tu correo electrónico.");
      setEmail("");
    }
  }

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

        <h1 className="text-xl font-semibold text-[#1D1D1F] tracking-tight leading-tight text-center">
          Recuperar Contraseña
        </h1>
        <p className="mt-2 text-xs text-[#86868B] text-center leading-normal font-normal">
          Ingresa tu dirección de correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
        </p>

        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-normal bg-black/[0.03] border border-black/[0.08] rounded-xl focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-[#1D1D1F] placeholder:text-[#86868B] transition-all"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-[#FF3B30]/10 px-3.5 py-2.5 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-xl bg-[#34C759]/10 px-3.5 py-2.5 text-xs font-medium text-[#34C759] border border-[#34C759]/20">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl bg-[#007AFF] hover:bg-[#0062cc] py-2.5 text-xs font-medium text-white shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer select-none"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[#86868B]">
          ¿Recordaste tu contraseña?{" "}
          <Link href="/login" className="font-medium text-[#007AFF] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </main>

      {/* 4. Bottom Footer links */}
      <footer className="absolute bottom-8 left-0 right-0 z-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-[#86868B] font-normal select-none text-[11px]">
        <span>© 2026 My Appointment. Todos los derechos reservados.</span>
      </footer>

    </div>
  );
}
