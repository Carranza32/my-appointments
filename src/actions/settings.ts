"use server";

import { revalidatePath } from "next/cache";
import { getProfessional, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWeeklyHours } from "@/lib/weekly-hours";
import { isValidSlug, normalizeSlug } from "@/lib/slug";
import type { WeeklyHours } from "@/types/business";

export async function saveWeeklyHours(weeklyHours: WeeklyHours) {
  await requireAuth();
  const professional = await getProfessional();

  if (!professional?.config) {
    return { error: "Completa el onboarding antes de guardar horarios." };
  }

  const parsed = parseWeeklyHours(weeklyHours);
  if (!parsed) {
    return { error: "Formato de horarios inválido." };
  }

  await prisma.businessConfig.update({
    where: { id: professional.config.id },
    data: { weeklyHours: parsed },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function saveGeneralSettings(data: {
  description?: string | null;
  avatarUrl?: string | null;
  timezone: string;
}) {
  await requireAuth();
  const professional = await getProfessional();

  if (!professional?.config) {
    return { error: "Completa el onboarding antes de guardar configuraciones." };
  }

  await prisma.businessConfig.update({
    where: { id: professional.config.id },
    data: {
      description: data.description,
      avatarUrl: data.avatarUrl,
      timezone: data.timezone,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/${professional.slug}`);
  return { success: true };
}

export async function saveProfileSettings(data: {
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  timezone: string;
}) {
  await requireAuth();
  const professional = await getProfessional();

  if (!professional) {
    return { error: "No autorizado." };
  }

  const normalized = normalizeSlug(data.slug);
  if (!normalized || !isValidSlug(normalized)) {
    return { error: "Slug inválido. Usa solo letras minúsculas, números y guiones." };
  }

  const existing = await prisma.user.findUnique({ where: { slug: normalized } });
  if (existing && existing.id !== professional.id) {
    return { error: "El slug ya está en uso." };
  }

  await prisma.user.update({
    where: { id: professional.id },
    data: {
      name: data.name,
      slug: normalized,
    },
  });

  if (professional.config) {
    await prisma.businessConfig.update({
      where: { id: professional.config.id },
      data: {
        description: data.description,
        avatarUrl: data.avatarUrl,
        timezone: data.timezone,
      },
    });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/${normalized}`);
  return { success: true };
}

export async function saveIntegrationSettings(data: {
  enableWhatsApp: boolean;
}) {
  await requireAuth();
  const professional = await getProfessional();

  if (!professional?.config) {
    return { error: "Completa el onboarding antes de guardar integraciones." };
  }

  await prisma.businessConfig.update({
    where: { id: professional.config.id },
    data: {
      enableWhatsApp: data.enableWhatsApp,
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

