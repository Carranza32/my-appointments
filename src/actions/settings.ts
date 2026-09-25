"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { parseWeeklyHours } from "@/lib/weekly-hours";
import { isValidSlug, normalizeSlug } from "@/lib/slug";
import type { WeeklyHours } from "@/types/business";

export async function saveWeeklyHours(weeklyHours: WeeklyHours) {
  try {
    const tenant = await withTenant();

    const parsed = parseWeeklyHours(weeklyHours);
    if (!parsed) {
      return { error: "Formato de horarios inválido." };
    }

    await prisma.businessConfig.update({
      where: { id: tenant.configId },
      data: { weeklyHours: parsed },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al guardar horarios." };
  }
}

export async function saveGeneralSettings(data: {
  description?: string | null;
  avatarUrl?: string | null;
  timezone: string;
}) {
  try {
    const tenant = await withTenant();

    await prisma.businessConfig.update({
      where: { id: tenant.configId },
      data: {
        description: data.description,
        avatarUrl: data.avatarUrl,
        timezone: data.timezone,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath(`/${tenant.slug}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al guardar configuraciones." };
  }
}

export async function saveProfileSettings(data: {
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  timezone: string;
  phone?: string | null;
  location?: string | null;
  coverUrl?: string | null;
  themeColor?: string | null;
  modality?: string | null;
}) {
  try {
    const tenant = await withTenant();

    const normalized = normalizeSlug(data.slug);
    if (!normalized || !isValidSlug(normalized)) {
      return { error: "Slug inválido. Usa solo letras minúsculas, números y guiones." };
    }

    const existing = await prisma.user.findUnique({ where: { slug: normalized } });
    if (existing && existing.id !== tenant.userId) {
      return { error: "El slug ya está en uso." };
    }

    await prisma.user.update({
      where: { id: tenant.userId },
      data: {
        name: data.name,
        slug: normalized,
      },
    });

    // Fetch existing config to preserve custom fields and merge branding metadata
    const currentConfig = await prisma.businessConfig.findUnique({
      where: { id: tenant.configId },
      select: { formFields: true, whatsappNumber: true },
    });

    const currentFields = Array.isArray(currentConfig?.formFields)
      ? (currentConfig.formFields as any[])
      : [];
    const restFields = currentFields.filter((f: any) => f?.name !== "__portal_branding__");

    const brandingEntry = {
      name: "__portal_branding__",
      label: "Portal Branding",
      type: "metadata",
      phone: data.phone ?? null,
      location: data.location ?? null,
      coverUrl: data.coverUrl ?? null,
      themeColor: data.themeColor ?? "#007AFF",
      modality: data.modality ?? "BOTH",
    };

    const updatedFields = [...restFields, brandingEntry];

    await prisma.businessConfig.update({
      where: { id: tenant.configId },
      data: {
        description: data.description,
        avatarUrl: data.avatarUrl,
        timezone: data.timezone,
        whatsappNumber: data.phone || currentConfig?.whatsappNumber,
        formFields: updatedFields,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath(`/${normalized}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar perfil." };
  }
}

export async function saveRegionalSettings(data: {
  timezone: string;
  currency?: string;
  updateServicesCurrency?: boolean;
}) {
  try {
    const tenant = await withTenant();

    await prisma.businessConfig.update({
      where: { id: tenant.configId },
      data: {
        timezone: data.timezone,
      },
    });

    if (data.currency && data.updateServicesCurrency) {
      await prisma.service.updateMany({
        where: { userId: tenant.userId },
        data: {
          currency: data.currency,
        },
      });
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/servicios");
    revalidatePath("/dashboard/citas");
    revalidatePath("/dashboard/pagos");
    revalidatePath(`/${tenant.slug}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al guardar configuración regional." };
  }
}

export async function saveIntegrationSettings(data: {
  enableWhatsApp: boolean;
  whatsappNumber?: string | null;
}) {
  try {
    const tenant = await withTenant();

    await prisma.businessConfig.update({
      where: { id: tenant.configId },
      data: {
        enableWhatsApp: data.enableWhatsApp,
        whatsappNumber: data.whatsappNumber,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al guardar integraciones." };
  }
}

export async function saveBankTransferSettings(data: {
  acceptBankTransfer: boolean;
  bankName: string | null;
  bankClabe: string | null;
  bankHolder: string | null;
  bankInstructions: string | null;
}) {
  try {
    const tenant = await withTenant();

    await prisma.businessConfig.update({
      where: { id: tenant.configId },
      data: {
        acceptBankTransfer: data.acceptBankTransfer,
        bankName: data.bankName,
        bankClabe: data.bankClabe,
        bankHolder: data.bankHolder,
        bankInstructions: data.bankInstructions,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al guardar datos de transferencia bancaria." };
  }
}

export async function deleteAccount() {
  try {
    const tenant = await withTenant();

    // Cascade delete in Prisma will remove all appointments, services, staff, locations, config, etc.
    await prisma.user.delete({
      where: { id: tenant.userId },
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar la cuenta de la base de datos." };
  }
}


