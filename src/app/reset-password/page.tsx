"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-64 w-64 rounded-full bg-primary-400/10 blur-3xl pointer-events-none"></div>

      <div className="rounded-3xl border border-slate-200/80 bg-white/98 p-8 shadow-frost dark:border-slate-800/80 dark:bg-slate-900/98 dark:shadow-frost-dark backdrop-blur-md transition-all duration-300">
        <h1 className="text-2xl font-black font-heading tracking-tight text-slate-800 dark:text-slate-100">
          Nueva Contraseña
        </h1>
        <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Ingresa y confirma tu nueva contraseña de acceso.
        </p>

        {success ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 text-center">
              ✓ Contraseña actualizada correctamente. Redirigiéndote al inicio de sesión…
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-550">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-205 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-hidden focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-550">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-205 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-hidden focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/20 dark:text-red-300 border border-red-100 dark:border-red-900/30">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 py-2.5 text-xs font-extrabold text-white shadow-md shadow-primary-500/10 hover:bg-primary-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Actualizando..." : "Restablecer Contraseña"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
