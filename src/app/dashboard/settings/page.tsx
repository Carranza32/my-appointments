import { Suspense } from "react";
import { SettingsContainer } from "@/components/settings/settings-container";
import { getProfessional } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weeklyHoursFromJson } from "@/lib/weekly-hours";

export default async function SettingsPage() {
  const professional = await getProfessional();
  const initialHours = weeklyHoursFromJson(professional?.config?.weeklyHours);
  const initialTimezone = professional?.config?.timezone ?? "America/El_Salvador";
  const initialDescription = professional?.config?.description ?? "";
  const initialAvatarUrl = professional?.config?.avatarUrl ?? "";
  const config = professional?.config;

  const firstService = professional?.id
    ? await prisma.service.findFirst({
        where: { userId: professional.id },
        select: { currency: true },
      })
    : null;
  const initialCurrency = firstService?.currency ?? "USD";

  // Extract branding metadata from formFields if present
  const formFieldsRaw = config?.formFields;
  const brandingEntry = Array.isArray(formFieldsRaw)
    ? (formFieldsRaw.find((f: any) => f?.name === "__portal_branding__") as any)
    : null;

  const initialCoverUrl = brandingEntry?.coverUrl ?? null;
  const initialPhone = brandingEntry?.phone ?? config?.whatsappNumber ?? "";
  const initialLocation = brandingEntry?.location ?? "";
  const initialThemeColor = brandingEntry?.themeColor ?? "#007AFF";
  const initialModality = brandingEntry?.modality ?? "BOTH";

  return (
    <div className="relative mx-auto max-w-6xl pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
          Configuración
        </h2>
        <p className="mt-1 text-sm text-[#86868B]">
          Administra la información de tu cuenta, horarios de disponibilidad e integraciones.
        </p>
      </div>

      <Suspense fallback={<div className="text-xs font-medium text-[#86868B]">Cargando configuraciones...</div>}>
        <SettingsContainer
          initialName={professional?.name ?? ""}
          initialSlug={professional?.slug ?? ""}
          initialAvatarUrl={initialAvatarUrl}
          initialDescription={initialDescription}
          initialTimezone={initialTimezone}
          initialCurrency={initialCurrency}
          initialCoverUrl={initialCoverUrl}
          initialPhone={initialPhone}
          initialLocation={initialLocation}
          initialThemeColor={initialThemeColor}
          initialModality={initialModality}
          rubro={professional?.rubro ?? "GENERAL"}
          initialHours={initialHours}
          googleConnected={Boolean(professional?.googleAccount)}
          googleLinkedAt={professional?.googleAccount?.createdAt.toISOString()}
          initialEnableWhatsApp={professional?.config?.enableWhatsApp ?? false}
          initialWhatsappNumber={config?.whatsappNumber ?? ""}
          planTier={professional?.planTier ?? "FREE"}
          initialAcceptBankTransfer={config?.acceptBankTransfer ?? false}
          initialBankName={config?.bankName ?? ""}
          initialBankClabe={config?.bankClabe ?? ""}
          initialBankHolder={config?.bankHolder ?? ""}
          initialBankInstructions={config?.bankInstructions ?? ""}
        />
      </Suspense>
    </div>
  );
}
