import { Suspense } from "react";
import { SettingsContainer } from "@/components/settings/settings-container";
import { getProfessional } from "@/lib/auth";
import { weeklyHoursFromJson } from "@/lib/weekly-hours";

export default async function SettingsPage() {
  const professional = await getProfessional();
  const initialHours = weeklyHoursFromJson(professional?.config?.weeklyHours);
  const initialTimezone = professional?.config?.timezone ?? "America/Mexico_City";
  const initialDescription = professional?.config?.description ?? "";
  const initialAvatarUrl = professional?.config?.avatarUrl ?? "";

  return (
    <div className="relative mx-auto max-w-6xl pb-12">
      {/* Decorative Glows in Background */}
      <div className="absolute top-10 right-10 -z-10 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/5 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 -z-10 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5 animate-float-delayed pointer-events-none"></div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Settings
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
          Administra la información de tu cuenta, horarios de disponibilidad e integraciones.
        </p>
      </div>

      <Suspense fallback={<div className="text-sm font-semibold text-slate-500">Cargando configuraciones...</div>}>
        <SettingsContainer
          initialName={professional?.name ?? ""}
          initialSlug={professional?.slug ?? ""}
          initialAvatarUrl={initialAvatarUrl}
          initialDescription={initialDescription}
          initialTimezone={initialTimezone}
          initialHours={initialHours}
          googleConnected={Boolean(professional?.googleAccount)}
          googleLinkedAt={professional?.googleAccount?.createdAt.toISOString()}
          initialEnableWhatsApp={professional?.config?.enableWhatsApp ?? false}
          planTier={professional?.planTier ?? "FREE"}
        />
      </Suspense>
    </div>
  );
}
