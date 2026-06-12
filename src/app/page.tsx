import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser, getProfessional } from "@/lib/auth";

export default async function HomePage() {
  const authUser = await getAuthUser();
  if (authUser) {
    const professional = await getProfessional();
    redirect(professional ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center px-4 py-16 overflow-hidden">
      {/* Premium Decorative Ambient Glows in Background */}
      <div className="absolute top-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/5 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5 animate-float-delayed pointer-events-none"></div>

      {/* Main Frosted Container */}
      <main className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/50 bg-frost-light/75 p-8 md:p-10 shadow-frost backdrop-blur-xl dark:border-slate-800/40 dark:bg-frost-dark/85 dark:shadow-frost-dark transition-all duration-300">
        <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-primary-500/10 to-transparent blur-2xl pointer-events-none"></div>
        
        {/* Brand Header */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600 dark:bg-primary-500"></span>
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            My Appointment
          </p>
        </div>

        {/* Headline */}
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 sm:text-4xl leading-tight">
          Agenda citas <br />
          <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent dark:from-primary-450 dark:to-indigo-400">
            sin fricción
          </span>
        </h1>

        <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
          Configura tu perfil profesional, define tus horarios hábiles de atención y empieza a recibir reservas automáticas directamente en tu página pública.
        </p>

        {/* Action Button Grid */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="flex-1 rounded-xl bg-primary-600 px-5 py-3 text-center text-sm font-bold text-white shadow-md shadow-primary-600/10 hover:bg-primary-700 hover:scale-102 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded-xl border border-slate-200/80 bg-white/40 px-5 py-3 text-center text-sm font-bold text-slate-700 backdrop-blur-md shadow-sm hover:bg-white/60 hover:scale-102 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-900/60 transition-all duration-300 cursor-pointer"
          >
            Iniciar sesión
          </Link>
        </div>
      </main>
    </div>
  );
}
