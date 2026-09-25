"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export type ResourceDTO = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  locationId: string | null;
  locationName: string | null;
  appointmentsCount: number;
  createdAt: string;
};

export type CreateResourceInput = {
  name: string;
  type?: string;
  locationId?: string | null;
  isActive?: boolean;
};

export type UpdateResourceInput = Partial<CreateResourceInput>;

export async function getResourcesList(): Promise<ResourceDTO[]> {
  const tenant = await withTenant();

  const resources = await prisma.resource.findMany({
    where: { userId: tenant.userId },
    include: {
      location: {
        select: { name: true },
      },
      _count: {
        select: { appointments: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return resources.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    isActive: r.isActive,
    locationId: r.locationId,
    locationName: r.location?.name ?? null,
    appointmentsCount: r._count.appointments,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createResource(input: CreateResourceInput) {
  const tenant = await withTenant();

  const name = input.name.trim();
  const type = input.type?.trim().toUpperCase() || "GENERAL";
  const locationId = input.locationId || null;
  const isActive = input.isActive !== undefined ? input.isActive : true;

  if (!name || name.length < 2) {
    return { error: "El nombre del recurso debe tener al menos 2 caracteres." };
  }

  const resource = await prisma.resource.create({
    data: {
      userId: tenant.userId,
      name,
      type,
      locationId,
      isActive,
    },
  });

  revalidatePath("/dashboard/sedes");
  revalidatePath("/dashboard");
  return { success: true, resourceId: resource.id };
}

export async function updateResource(id: string, input: UpdateResourceInput) {
  const tenant = await withTenant();

  const existing = await prisma.resource.findFirst({
    where: { id, userId: tenant.userId },
  });

  if (!existing) {
    return { error: "Recurso no encontrado." };
  }

  const name = input.name !== undefined ? input.name.trim() : existing.name;
  const type = input.type !== undefined ? input.type.trim().toUpperCase() : existing.type;
  const locationId = input.locationId !== undefined ? input.locationId : existing.locationId;
  const isActive = input.isActive !== undefined ? input.isActive : existing.isActive;

  if (!name || name.length < 2) {
    return { error: "El nombre del recurso debe tener al menos 2 caracteres." };
  }

  await prisma.resource.update({
    where: { id },
    data: {
      name,
      type,
      locationId,
      isActive,
    },
  });

  revalidatePath("/dashboard/sedes");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteResource(id: string) {
  const tenant = await withTenant();

  const existing = await prisma.resource.findFirst({
    where: { id, userId: tenant.userId },
    include: {
      _count: {
        select: { appointments: true },
      },
    },
  });

  if (!existing) {
    return { error: "Recurso no encontrado." };
  }

  if (existing._count.appointments > 0) {
    await prisma.resource.update({
      where: { id },
      data: { isActive: false },
    });
    return {
      success: true,
      message: "El recurso tiene citas asociadas y ha sido desactivado.",
    };
  }

  await prisma.resource.delete({
    where: { id },
  });

  revalidatePath("/dashboard/sedes");
  return { success: true };
}
