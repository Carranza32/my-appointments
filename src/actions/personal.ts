"use server";

import { revalidatePath } from "next/cache";
import { getProfessional, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type StaffDTO = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string | null;
  avatarUrl: string | null;
  weeklyHours: any;
  createdAt: string;
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
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return [];

  const rows = await prisma.staff.findMany({
    where: { userId: professional.id },
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
  }));
}

export async function createStaff(input: {
  name: string;
  email: string;
  phone?: string;
  description?: string;
  avatarUrl?: string;
}) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

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

  const staff = await prisma.staff.create({
    data: {
      userId: professional.id,
      name,
      email,
      phone,
      description,
      avatarUrl,
      weeklyHours: DEFAULT_WEEKLY_HOURS,
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
  }
) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

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

  const existing = await prisma.staff.findFirst({
    where: { id, userId: professional.id },
  });

  if (!existing) {
    return { error: "Personal no encontrado." };
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
    },
  });

  revalidatePath("/dashboard/personal");
  return { success: true };
}

export async function deleteStaff(id: string) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

  const existing = await prisma.staff.findFirst({
    where: { id, userId: professional.id },
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
