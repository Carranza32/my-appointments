"use client";

import { useState, useTransition } from "react";
import { createAppointment } from "@/actions/appointments";
import type { FormFieldDef } from "@/lib/form-fields";
import { formatDateLabel } from "@/lib/booking";

type Props = {
  slug: string;
  date: string;
  time: string;
  slotDuration: number;
  formFields: FormFieldDef[];
  onSuccess: () => void;
  onBack: () => void;
  staffId?: string | null;
  locationId?: string | null;
};

export function DynamicBookingForm({
  slug,
  date,
  time,
  slotDuration,
  formFields,
  onSuccess,
  onBack,
  staffId,
  locationId,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  function setMetaField(name: string, value: string) {
    setMetadata((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createAppointment({
        slug,
        date,
        time,
        clientName,
        clientEmail,
        clientPhone,
        clientMetadata: metadata,
        staffId: staffId || null,
        locationId: locationId || null,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Selected Slot Summary Banner */}
      <div className="rounded-xl border border-primary-100/50 bg-primary-50 px-4 py-3 text-sm text-primary-850 dark:border-primary-900/30 dark:bg-primary-950/40 dark:text-primary-300 flex items-start gap-3 shadow-2xs">
        <div className="text-xl mt-0.5 shrink-0 select-none">📅</div>
        <div>
          <p className="font-extrabold">{formatDateLabel(date)}</p>
          <p className="text-xs font-semibold mt-0.5 opacity-90">
            ⏱️ {time} · ({slotDuration} minutos de duración)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Nombre completo <span className="text-red-500 font-black">*</span>
          </label>
          <input
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/60 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Email de contacto <span className="text-red-500 font-black">*</span>
          </label>
          <input
            type="email"
            required
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/60 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Teléfono celular <span className="text-red-500 font-black">*</span>
          </label>
          <input
            type="tel"
            required
            minLength={8}
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/60 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-primary-500/20"
          />
        </div>

        {formFields.map((field) => (
          <div key={field.name}>
            <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {field.label}
              {field.required ? <span className="text-red-500 font-black"> *</span> : ""}
            </label>
            {field.type === "textarea" ? (
              <textarea
                required={field.required}
                rows={3}
                value={metadata[field.name] ?? ""}
                onChange={(e) => setMetaField(field.name, e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/60 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-primary-500/20 resize-none"
              />
            ) : field.type === "select" ? (
              <select
                required={field.required}
                value={metadata[field.name] ?? ""}
                onChange={(e) => setMetaField(field.name, e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/60 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-primary-500/20 appearance-none cursor-pointer"
              >
                <option value="">Selecciona una opción…</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required={field.required}
                value={metadata[field.name] ?? ""}
                onChange={(e) => setMetaField(field.name, e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/60 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-primary-500/20"
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200/60 bg-red-50/98 p-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/40 dark:text-red-300 animate-in fade-in duration-200">
          <span className="shrink-0 text-base leading-none select-none">⚠️</span>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-200 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-350 dark:hover:bg-slate-800 cursor-pointer active:scale-[0.98] transition-all"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary-600 py-3 text-sm font-extrabold text-white hover:bg-primary-700 disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-all shadow-md shadow-primary-500/10"
        >
          {pending ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Reservando…
            </>
          ) : (
            "Confirmar cita"
          )}
        </button>
      </div>
    </form>
  );
}
