"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { checkSlugAvailability } from "@/actions/slug";
import {
  completeOnboarding,
  type OnboardingInput,
} from "@/actions/onboarding";
import { normalizeSlug } from "@/lib/slug";

const RUBROS: { value: string; label: string }[] = [
  { value: "SALUD", label: "Salud y Medicina" },
  { value: "BELLEZA", label: "Belleza y Estética" },
  { value: "CONSULTORIA", label: "Consultoría y Coaching" },
  { value: "FITNESS", label: "Fitness y Deporte" },
  { value: "EDUCACION", label: "Educación y Tutorías" },
  { value: "VETERINARIA", label: "Veterinaria" },
  { value: "LEGAL", label: "Servicios Legales" },
  { value: "GENERAL", label: "General / Otro" },
];

export function OnboardingForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rubro, setRubro] = useState("SALUD");
  const [slugInput, setSlugInput] = useState("");
  const [slugStatus, setSlugStatus] = useState<{
    slug: string;
    available: boolean;
    valid: boolean;
    message: string;
  } | null>(null);

  const checkSlug = useCallback(async (value: string) => {
    const normalized = normalizeSlug(value);
    if (!normalized) {
      setSlugStatus(null);
      return;
    }
    const result = await checkSlugAvailability(normalized);
    setSlugStatus(result);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (slugInput.trim()) checkSlug(slugInput);
      else setSlugStatus(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [slugInput, checkSlug]);

  function handleSlugChange(value: string) {
    setSlugInput(normalizeSlug(value));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!slugStatus?.available || !slugStatus.valid) {
      setError("Elige un slug disponible antes de continuar.");
      return;
    }

    const payload: OnboardingInput = {
      name,
      rubro,
      slug: slugStatus.slug,
    };

    startTransition(async () => {
      const result = await completeOnboarding(payload);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Nombre profesional o negocio
        </label>
        <input
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          placeholder="Ej. Clínica Dental Sonrisa"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Rubro
        </label>
        <select
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          {RUBROS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          URL pública (slug)
        </label>
        <div className="flex items-center rounded-lg border border-zinc-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <span className="pl-3 text-sm text-zinc-400">myappointment.app/</span>
          <input
            required
            value={slugInput}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="flex-1 border-0 bg-transparent py-2 pr-3 outline-none"
            placeholder="clinica-dental"
          />
        </div>
        {slugStatus && (
          <p
            className={`mt-1.5 text-sm ${
              slugStatus.available && slugStatus.valid
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {slugStatus.message}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={
          pending ||
          !name.trim() ||
          !slugStatus?.available ||
          !slugStatus?.valid
        }
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Continuar a horarios"}
      </button>
    </form>
  );
}
