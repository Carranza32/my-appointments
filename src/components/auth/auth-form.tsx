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
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="font-heading font-extrabold text-2xl text-slate-800 dark:text-white leading-none">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {mode === "login"
            ? "Please enter your details to continue"
            : "Enter your email and choose a password to get started"}
        </p>
      </div>

      {/* Google Sign-in Button (Generous Height py-3) */}
      <button
        onClick={handleGoogleSignIn}
        type="button"
        disabled={loading}
        className="w-full py-3.5 px-5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-sm font-extrabold text-slate-700 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs select-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-350 dark:hover:bg-slate-800"
      >
        {/* Google Colored Logo Icon */}
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
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center my-7 gap-3 select-none">
        <div className="flex-1 h-px bg-slate-200/50 dark:bg-slate-800/40"></div>
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
          OR
        </span>
        <div className="flex-1 h-px bg-slate-200/50 dark:bg-slate-800/40"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Address */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Email address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-4 pr-10 py-3 text-sm font-semibold bg-[#f1f3f4]/40 dark:bg-slate-950/40 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#1A73E8] dark:focus:bg-slate-950 dark:focus:border-blue-400 focus:shadow-sm text-slate-850 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <AtSign className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Password
            </label>
            {mode === "login" && (
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-[#1A73E8] dark:text-blue-400 hover:underline"
              >
                Forgot password?
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
              className="w-full pl-4 pr-10 py-3 text-sm font-semibold bg-[#f1f3f4]/40 dark:bg-slate-950/40 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-[#1A73E8] dark:focus:bg-slate-950 dark:focus:border-blue-400 focus:shadow-sm text-slate-850 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-450 hover:text-slate-650 dark:hover:text-slate-350 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700 dark:bg-red-950/20 dark:text-red-300 border border-red-100/30 dark:border-red-900/30">
            {error}
          </p>
        )}

        {/* Submit button (Generous Height py-3.5) */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-full bg-[#1A73E8] hover:bg-[#005bbf] py-3.5 text-sm font-extrabold text-white shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-98 transition-all disabled:opacity-50 cursor-pointer select-none"
        >
          {loading
            ? "Waiting…"
            : mode === "login"
              ? "Sign in"
              : "Sign up"}
        </button>

        {/* Footer text */}
        <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mt-8 select-none">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <Link href="/signup" className="font-extrabold text-[#1A73E8] dark:text-blue-400 hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-extrabold text-[#1A73E8] dark:text-blue-400 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
