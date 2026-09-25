"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export type ServiceDTO = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  bufferTime: number;
  price: number;
  currency: string;
  isActive: boolean;
  onlineBooking: boolean;
  requiresPayment: boolean;
  staffIds: string[];
  appointmentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceInput = {
  name: string;
  description?: string | null;
  duration: number;
  bufferTime?: number;
  price?: number;
  currency?: string;
  isActive?: boolean;
  onlineBooking?: boolean;
  requiresPayment?: boolean;
  staffIds?: string[];
};

export type UpdateServiceInput = Partial<CreateServiceInput>;

export async function getServicesList(): Promise<ServiceDTO[]> {
  const tenant = await withTenant();

  const services = await prisma.service.findMany({
    where: { userId: tenant.userId },
    include: {
      staffServices: {
        select: { staffId: true },
      },
      _count: {
        select: { appointments: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration: s.duration,
    bufferTime: s.bufferTime,
    price: s.price,
    currency: s.currency,
    isActive: s.isActive,
    onlineBooking: s.onlineBooking,
    requiresPayment: s.requiresPayment,
    staffIds: s.staffServices.map((ss) => ss.staffId),
    appointmentsCount: s._count.appointments,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
}

export async function getServiceById(id: string): Promise<ServiceDTO | null> {
  const tenant = await withTenant();

  const service = await prisma.service.findFirst({
    where: { id, userId: tenant.userId },
    include: {
      staffServices: {
        select: { staffId: true },
      },
      _count: {
        select: { appointments: true },
      },
    },
  });

  if (!service) return null;

  return {
    id: service.id,
    name: service.name,
    description: service.description,
    duration: service.duration,
    bufferTime: service.bufferTime,
    price: service.price,
    currency: service.currency,
    isActive: service.isActive,
    onlineBooking: service.onlineBooking,
    requiresPayment: service.requiresPayment,
    staffIds: service.staffServices.map((ss) => ss.staffId),
    appointmentsCount: service._count.appointments,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}

export async function createService(input: CreateServiceInput) {
  const tenant = await withTenant();

  const name = input.name.trim();
  const description = input.description?.trim() || null;
  const duration = Number(input.duration) || 30;
  const bufferTime = Number(input.bufferTime) || 0;
  const price = typeof input.price === "number" ? Math.max(0, input.price) : 0;
  const currency = input.currency?.trim() || "USD";
  const isActive = input.isActive !== undefined ? input.isActive : true;
  const onlineBooking = input.onlineBooking !== undefined ? input.onlineBooking : true;
  const requiresPayment = input.requiresPayment !== undefined ? input.requiresPayment : false;
  const staffIds = input.staffIds || [];

  if (!name || name.length < 2) {
    return { error: "El nombre del servicio debe tener al menos 2 caracteres." };
  }

  if (duration < 5 || duration > 720) {
    return { error: "La duración debe estar entre 5 y 720 minutos." };
  }

  const service = await prisma.service.create({
    data: {
      userId: tenant.userId,
      name,
      description,
      duration,
      bufferTime,
      price,
      currency,
      isActive,
      onlineBooking,
      requiresPayment,
      staffServices: {
        create: staffIds.map((staffId) => ({
          staff: {
            connect: { id: staffId },
          },
        })),
      },
    },
  });

  revalidatePath("/dashboard/servicios");
  revalidatePath("/dashboard");
  return { success: true, serviceId: service.id };
}

export async function updateService(id: string, input: UpdateServiceInput) {
  const tenant = await withTenant();

  const existing = await prisma.service.findFirst({
    where: { id, userId: tenant.userId },
  });

  if (!existing) {
    return { error: "Servicio no encontrado." };
  }

  const name = input.name !== undefined ? input.name.trim() : existing.name;
  const description = input.description !== undefined ? input.description?.trim() || null : existing.description;
  const duration = input.duration !== undefined ? Number(input.duration) : existing.duration;
  const bufferTime = input.bufferTime !== undefined ? Number(input.bufferTime) : existing.bufferTime;
  const price = input.price !== undefined ? Math.max(0, Number(input.price)) : existing.price;
  const currency = input.currency !== undefined ? input.currency.trim() : existing.currency;
  const isActive = input.isActive !== undefined ? input.isActive : existing.isActive;
  const onlineBooking = input.onlineBooking !== undefined ? input.onlineBooking : existing.onlineBooking;
  const requiresPayment = input.requiresPayment !== undefined ? input.requiresPayment : existing.requiresPayment;

  if (!name || name.length < 2) {
    return { error: "El nombre del servicio debe tener al menos 2 caracteres." };
  }

  if (duration < 5 || duration > 720) {
    return { error: "La duración debe estar entre 5 y 720 minutos." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.service.update({
      where: { id },
      data: {
        name,
        description,
        duration,
        bufferTime,
        price,
        currency,
        isActive,
        onlineBooking,
        requiresPayment,
      },
    });

    if (input.staffIds !== undefined) {
      // Re-sync staff relations
      await tx.staffService.deleteMany({
        where: { serviceId: id },
      });

      if (input.staffIds.length > 0) {
        await tx.staffService.createMany({
          data: input.staffIds.map((staffId) => ({
            serviceId: id,
            staffId,
          })),
        });
      }
    }
  });

  revalidatePath("/dashboard/servicios");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleServiceActive(id: string, isActive: boolean) {
  const tenant = await withTenant();

  const existing = await prisma.service.findFirst({
    where: { id, userId: tenant.userId },
  });

  if (!existing) {
    return { error: "Servicio no encontrado." };
  }

  await prisma.service.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function deleteService(id: string) {
  const tenant = await withTenant();

  const existing = await prisma.service.findFirst({
    where: { id, userId: tenant.userId },
    include: {
      _count: {
        select: { appointments: true },
      },
    },
  });

  if (!existing) {
    return { error: "Servicio no encontrado." };
  }

  // If service has appointments, deactivate it instead of deleting to preserve history
  if (existing._count.appointments > 0) {
    await prisma.service.update({
      where: { id },
      data: { isActive: false, onlineBooking: false },
    });
    revalidatePath("/dashboard/servicios");
    return {
      success: true,
      message: "El servicio tiene citas históricas asociadas, por lo que ha sido desactivado.",
    };
  }

  await prisma.service.delete({
    where: { id },
  });

  revalidatePath("/dashboard/servicios");
  revalidatePath("/dashboard");
  return { success: true };
}
