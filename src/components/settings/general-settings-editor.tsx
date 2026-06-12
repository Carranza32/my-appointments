"use client";

import { useState, useTransition, useEffect } from "react";
import { saveGeneralSettings } from "@/actions/settings";

type Props = {
  initialTimezone: string;
  initialDescription: string;
  initialAvatarUrl: string;
};

const COMMON_TIMEZONES = [
  { value: "America/Mexico_City", label: "CDMX / México (GMT-6)" },
  { value: "America/Bogota", label: "Bogotá / Colombia (GMT-5)" },
  { value: "America/Lima", label: "Lima / Perú (GMT-5)" },
  { value: "America/Caracas", label: "Caracas / Venezuela (GMT-4)" },
  { value: "America/Santiago", label: "Santiago / Chile (GMT-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires / Argentina (GMT-3)" },
  { value: "Europe/Madrid", label: "Madrid / España (GMT+1)" },
  { value: "America/New_York", label: "Nueva York / EE.UU. (GMT-5)" },
];

export function GeneralSettingsEditor({
  initialTimezone,
  initialDescription,
  initialAvatarUrl,
}: Props) {
  const [timezone, setTimezone] = useState(initialTimezone || "America/Mexico_City");
  const [description, setDescription] = useState(initialDescription || "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await saveGeneralSettings({
        timezone,
        description: description.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });

      if (result?.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        setMessage({ text: "Configuración general guardada correctamente.", type: "success" });
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {message && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-3 rounded-2xl border px-4.5 py-4 shadow-xl transition-all duration-300 ${
            message.type === "success"
              ? "border-emerald-250 bg-white text-emerald-800 dark:border-emerald-900/30 dark:bg-slate-900 dark:text-emerald-350"
              : "border-red-200 bg-white text-red-700 dark:border-red-900/30 dark:bg-slate-900 dark:text-red-400"
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${message.type === "success" ? "bg-emerald-400" : "bg-red-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${message.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}></span>
          </span>
          <p className="text-xs font-bold leading-none">{message.text}</p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200/80 bg-white/98 p-6 shadow-frost dark:border-slate-800/80 dark:bg-slate-900/98 dark:shadow-frost-dark backdrop-blur-md transition-colors duration-300 space-y-6">
        <h3 className="text-base font-extrabold font-heading text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          Información del Perfil Público
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar URL */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-550">
              URL de Foto de Perfil
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... o similar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-205 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-hidden focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Pega el enlace directo a una imagen tuya para que los clientes te identifiquen al reservar.
            </p>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-550">
              Zona Horaria
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl border border-slate-205 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-750 outline-hidden focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Determina cómo se procesan y muestran las horas de citas y disponibilidades a tus clientes.
            </p>
          </div>
        </div>

        {/* Bio Description */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-550">
            Biografía / Descripción Pública
          </label>
          <textarea
            rows={4}
            placeholder="Introduce una breve descripción sobre ti y tus servicios..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-205 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-hidden focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 resize-none"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Aparecerá en tu portal público de citas, justo debajo de tu nombre.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-primary-600/10 hover:bg-primary-700 hover:scale-102 transition-all duration-300 cursor-pointer disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar Configuración General"}
        </button>
      </div>
    </form>
  );
}
