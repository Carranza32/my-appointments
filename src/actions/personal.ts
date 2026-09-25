"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { canCreateStaff } from "@/lib/plan-guard";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

export type StaffDTO = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string | null;
  avatarUrl: string | null;
  weeklyHours: any;
  createdAt: string;
  slug: string | null;
  isActive: boolean;
  serviceIds?: string[];
};

const DEFAULT_WEEKLY_HOURS = {
  monday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  tuesday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  thursday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  friday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  saturday: { enabled: false, ranges: [{ start: "09:00", end: "13:00" }] },
  sunday: { enabled: false, ranges: [{ start: "09:00", end: "13:00" }] },
};

export async function getStaffList(): Promise<StaffDTO[]> {
  const tenant = await withTenant();

  const rows = await prisma.staff.findMany({
    where: { userId: tenant.userId },
    include: {
      staffServices: {
        select: { serviceId: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    description: s.description,
    avatarUrl: s.avatarUrl,
    weeklyHours: s.weeklyHours,
    createdAt: s.createdAt.toISOString(),
    slug: s.slug,
    isActive: s.isActive,
    serviceIds: s.staffServices.map((ss) => ss.serviceId),
  }));
}

export async function createStaff(input: {
  name: string;
  email: string;
  phone?: string;
  description?: string;
  avatarUrl?: string;
  slug?: string;
}) {
  const tenant = await withTenant();

  const planCheck = await canCreateStaff(tenant.userId, tenant.planTier);
  if (!planCheck.allowed) {
    return { error: planCheck.reason };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const description = input.description?.trim() || null;
  const avatarUrl = input.avatarUrl?.trim() || null;

  if (!name || name.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El correo electrónico es inválido." };
  }

  let normalizedSlug: string | null = null;
  if (input.slug && input.slug.trim()) {
    normalizedSlug = normalizeSlug(input.slug);
    if (!isValidSlug(normalizedSlug)) {
      return { error: "El slug del staff no es válido." };
    }

    const existingSlug = await prisma.staff.findFirst({
      where: { userId: tenant.userId, slug: normalizedSlug },
    });
    if (existingSlug) {
      return { error: "Este slug ya está asignado a otro integrante de tu equipo." };
    }
  }

  const staff = await prisma.staff.create({
    data: {
      userId: tenant.userId,
      name,
      email,
      phone,
      description,
      avatarUrl,
      weeklyHours: DEFAULT_WEEKLY_HOURS,
      slug: normalizedSlug,
      isActive: true,
    },
  });

  revalidatePath("/dashboard/personal");
  return { success: true, staffId: staff.id };
}

export async function updateStaff(
  id: string,
  input: {
    name: string;
    email: string;
    phone?: string;
    description?: string;
    avatarUrl?: string;
    weeklyHours?: any;
    slug?: string;
    isActive?: boolean;
  }
) {
  const tenant = await withTenant();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const description = input.description?.trim() || null;
  const avatarUrl = input.avatarUrl?.trim() || null;
  const isActive = input.isActive !== undefined ? input.isActive : true;

  if (!name || name.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El correo electrónico es inválido." };
  }

  const existing = await prisma.staff.findFirst({
    where: { id, userId: tenant.userId },
  });

  if (!existing) {
    return { error: "Personal no encontrado." };
  }

  let normalizedSlug: string | null = null;
  if (input.slug && input.slug.trim()) {
    normalizedSlug = normalizeSlug(input.slug);
    if (!isValidSlug(normalizedSlug)) {
      return { error: "El slug del staff no es válido." };
    }

    const existingSlug = await prisma.staff.findFirst({
      where: {
        userId: tenant.userId,
        slug: normalizedSlug,
        NOT: { id },
      },
    });
    if (existingSlug) {
      return { error: "Este slug ya está asignado a otro integrante de tu equipo." };
    }
  }

  await prisma.staff.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      description,
      avatarUrl,
      weeklyHours: input.weeklyHours || existing.weeklyHours,
      slug: normalizedSlug,
      isActive,
    },
  });

  revalidatePath("/dashboard/personal");
  return { success: true };
}

export async function deleteStaff(id: string) {
  const tenant = await withTenant();

  const existing = await prisma.staff.findFirst({
    where: { id, userId: tenant.userId },
  });

  if (!existing) {
    return { error: "Personal no encontrado." };
  }

  await prisma.staff.delete({
    where: { id },
  });

  revalidatePath("/dashboard/personal");
  return { success: true };
}
