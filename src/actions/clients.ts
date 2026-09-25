"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { canCreateClient } from "@/lib/plan-guard";

export type ClientDTO = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string | null;
  createdAt: string;
};

export async function getClients(): Promise<ClientDTO[]> {
  const tenant = await withTenant();

  const rows = await prisma.client.findMany({
    where: { userId: tenant.userId },
    orderBy: { name: "asc" },
  });

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function createClient(input: {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}) {
  const tenant = await withTenant();

  const planCheck = await canCreateClient(tenant.userId, tenant.planTier);
  if (!planCheck.allowed) {
    return { error: planCheck.reason };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const notes = input.notes?.trim() || null;

  if (!name || name.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El correo electrónico es inválido." };
  }
  if (!phone || phone.length < 8) {
    return { error: "Ingresa un número telefónico de al menos 8 dígitos." };
  }

  // Check unique email per professional
  const existing = await prisma.client.findUnique({
    where: {
      userId_email: {
        userId: tenant.userId,
        email,
      },
    },
  });

  if (existing) {
    return { error: "Ya existe un cliente registrado con ese correo electrónico." };
  }

  const client = await prisma.client.create({
    data: {
      userId: tenant.userId,
      name,
      email,
      phone,
      notes,
    },
  });

  revalidatePath("/dashboard/clientes");
  return { success: true, clientId: client.id };
}

export async function updateClient(
  id: string,
  input: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }
) {
  const tenant = await withTenant();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const notes = input.notes?.trim() || null;

  if (!name || name.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El correo electrónico es inválido." };
  }
  if (!phone || phone.length < 8) {
    return { error: "Ingresa un número telefónico de al menos 8 dígitos." };
  }

  // Check if another client has the same email
  const existingWithEmail = await prisma.client.findFirst({
    where: {
      userId: tenant.userId,
      email,
      id: { not: id },
    },
  });

  if (existingWithEmail) {
    return { error: "Ya existe otro cliente registrado con ese correo electrónico." };
  }

  const existing = await prisma.client.findFirst({
    where: { id, userId: tenant.userId },
  });

  if (!existing) {
    return { error: "Cliente no encontrado." };
  }

  await prisma.client.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      notes,
    },
  });

  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function deleteClient(id: string) {
  const tenant = await withTenant();

  const existing = await prisma.client.findFirst({
    where: { id, userId: tenant.userId },
  });

  if (!existing) {
    return { error: "Cliente no encontrado." };
  }

  await prisma.client.delete({
    where: { id },
  });

  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function getClientAppointments(clientEmail: string) {
  const tenant = await withTenant();

  const rows = await prisma.appointment.findMany({
    where: {
      userId: tenant.userId,
      clientEmail: clientEmail,
    },
    orderBy: { startTime: "desc" },
  });

  return rows.map((a) => ({
    id: a.id,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
  }));
}

