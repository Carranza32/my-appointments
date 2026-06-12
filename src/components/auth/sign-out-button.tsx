"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/40 px-3 py-2 text-xs font-bold text-slate-600 backdrop-blur-md transition-all duration-300 hover:scale-102 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/20 cursor-pointer shadow-sm"
    >
      <span>Salir</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
    </button>
  );
}
