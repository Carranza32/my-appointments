"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AtSign } from "lucide-react";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email / Password Authentication
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      router.push("/onboarding");
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  // Google OAuth Authentication
  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during Google sign in.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full font-sans">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight leading-tight">
          {mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
        </h2>
        <p className="mt-1.5 text-xs text-[#86868B] font-normal">
          {mode === "login"
            ? "Ingresa tus credenciales para continuar"
            : "Registra tu correo y contraseña para comenzar"}
        </p>
      </div>

      {/* Google Sign-in Button */}
      <button
        onClick={handleGoogleSignIn}
        type="button"
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-xl border border-black/[0.08] bg-black/[0.02] hover:bg-black/[0.05] text-xs font-medium text-[#1D1D1F] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs select-none"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 14.97 1 12 1 7.35 1 3.37 3.68 1.48 7.58l3.96 3.07C6.38 7.37 8.96 5.04 12 5.04z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.11 2.73-2.36 3.58l3.66 2.84c2.14-1.98 3.37-4.89 3.37-8.57z"
          />
          <path
            fill="#FBBC05"
            d="M5.44 14.47A7.045 7.045 0 015 12c0-.87.15-1.7.44-2.47L1.48 6.46A11.956 11.956 0 000 12c0 2.05.52 4.02 1.48 5.54l3.96-3.07z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.95 1.09-3.04 0-5.62-2.33-6.54-5.61l-3.96 3.07C3.37 20.32 7.35 23 12 23z"
          />
        </svg>
        <span>Continuar con Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center my-5 gap-3 select-none">
        <div className="flex-1 h-px bg-black/[0.06]"></div>
        <span className="text-[10px] font-medium text-[#86868B] uppercase tracking-wider leading-none">
          o
        </span>
        <div className="flex-1 h-px bg-black/[0.06]"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Address */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
            Correo Electrónico
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2 text-xs font-normal bg-black/[0.03] border border-black/[0.08] rounded-xl focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-[#1D1D1F] placeholder:text-[#86868B] transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AtSign className="h-3.5 w-3.5 text-[#86868B]" />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
              Contraseña
            </label>
            {mode === "login" && (
              <Link
                href="/forgot-password"
                className="text-[11px] font-medium text-[#007AFF] hover:underline"
              >
                ¿La olvidaste?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2 text-xs font-normal bg-black/[0.03] border border-black/[0.08] rounded-xl focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] text-[#1D1D1F] placeholder:text-[#86868B] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-[#FF3B30]/10 px-3.5 py-2.5 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20">
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-xl bg-[#007AFF] hover:bg-[#0062cc] py-2.5 text-xs font-medium text-white shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer select-none"
        >
          {loading
            ? "Cargando…"
            : mode === "login"
              ? "Iniciar Sesión"
              : "Registrarse"}
        </button>

        {/* Footer text */}
        <p className="text-center text-xs text-[#86868B] mt-6 select-none font-normal">
          {mode === "login" ? (
            <>
              ¿No tienes una cuenta?{" "}
              <Link href="/signup" className="font-medium text-[#007AFF] hover:underline">
                Regístrate
              </Link>
            </>
          ) : (
            <>
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="font-medium text-[#007AFF] hover:underline">
                Inicia sesión
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
