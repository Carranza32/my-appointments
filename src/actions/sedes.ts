"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { canCreateLocation } from "@/lib/plan-guard";

export type LocationDTO = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  createdAt: string;
};

export async function getLocationsList(): Promise<LocationDTO[]> {
  const tenant = await withTenant();

  const rows = await prisma.location.findMany({
    where: { userId: tenant.userId },
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
  const tenant = await withTenant();

  const planCheck = await canCreateLocation(tenant.userId, tenant.planTier);
  if (!planCheck.allowed) {
    return { error: planCheck.reason };
  }

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
      userId: tenant.userId,
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
  const tenant = await withTenant();

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
    where: { id, userId: tenant.userId },
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
  const tenant = await withTenant();

  const existing = await prisma.location.findFirst({
    where: { id, userId: tenant.userId },
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
