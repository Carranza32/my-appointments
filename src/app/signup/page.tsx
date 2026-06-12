import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { ParticleBackground } from "@/components/auth/particle-background";

export default function SignupPage() {
  return (
    <div className="relative min-h-screen w-screen overflow-hidden flex flex-col justify-center items-center px-6 py-20 font-sans">
      
      {/* 1. Interactive Canvas Particle Background */}
      <ParticleBackground />

      {/* 2. Top-Left Brand Logo */}
      <header className="absolute top-8 left-8 z-10">
        <Link href="/" className="flex items-center gap-2 group">
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
      </header>

      {/* 3. Centered Frost Glass Card */}
      <main className="relative z-10 w-full max-w-[420px] bg-frost-glass border border-white/20 p-8 rounded-3xl dark:bg-slate-900/45 dark:border-white/5 shadow-frost backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-blue-500/10 to-transparent blur-2xl pointer-events-none"></div>
        
        {/* Render AuthForm in Signup mode */}
        <AuthForm mode="signup" />
      </main>

      {/* 4. Bottom Footer links */}
      <footer className="absolute bottom-8 left-0 right-0 z-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-400 dark:text-slate-500 font-semibold select-none text-[10px] sm:text-xs">
        <span>© 2026 My Appointment. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-slate-650 dark:hover:text-slate-350 hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-650 dark:hover:text-slate-350 hover:underline">Terms of Service</Link>
          <Link href="/support" className="hover:text-slate-650 dark:hover:text-slate-350 hover:underline">Contact Support</Link>
        </div>
      </footer>

    </div>
  );
}
