"use server";

import { revalidatePath } from "next/cache";
import { getProfessional, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LocationDTO = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  createdAt: string;
};

export async function getLocationsList(): Promise<LocationDTO[]> {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return [];

  const rows = await prisma.location.findMany({
    where: { userId: professional.id },
    orderBy: { name: "asc" },
  });

  return rows.map((loc) => ({
    id: loc.id,
    name: loc.name,
    address: loc.address,
    phone: loc.phone,
    createdAt: loc.createdAt.toISOString(),
  }));
}

export async function createLocation(input: {
  name: string;
  address: string;
  phone?: string;
}) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

  const name = input.name.trim();
  const address = input.address.trim();
  const phone = input.phone?.trim() || null;

  if (!name || name.length < 2) {
    return { error: "El nombre de la sede debe tener al menos 2 caracteres." };
  }
  if (!address || address.length < 3) {
    return { error: "La dirección debe tener al menos 3 caracteres." };
  }

  const location = await prisma.location.create({
    data: {
      userId: professional.id,
      name,
      address,
      phone,
    },
  });

  revalidatePath("/dashboard/sedes");
  return { success: true, locationId: location.id };
}

export async function updateLocation(
  id: string,
  input: {
    name: string;
    address: string;
    phone?: string;
  }
) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

  const name = input.name.trim();
  const address = input.address.trim();
  const phone = input.phone?.trim() || null;

  if (!name || name.length < 2) {
    return { error: "El nombre de la sede debe tener al menos 2 caracteres." };
  }
  if (!address || address.length < 3) {
    return { error: "La dirección debe tener al menos 3 caracteres." };
  }

  const existing = await prisma.location.findFirst({
    where: { id, userId: professional.id },
  });

  if (!existing) {
    return { error: "Sede no encontrada." };
  }

  await prisma.location.update({
    where: { id },
    data: {
      name,
      address,
      phone,
    },
  });

  revalidatePath("/dashboard/sedes");
  return { success: true };
}

export async function deleteLocation(id: string) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

  const existing = await prisma.location.findFirst({
    where: { id, userId: professional.id },
  });

  if (!existing) {
    return { error: "Sede no encontrada." };
  }

  await prisma.location.delete({
    where: { id },
  });

  revalidatePath("/dashboard/sedes");
  return { success: true };
}
