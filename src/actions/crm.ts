"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getRubroConfig } from "@/lib/rubros";

export type CRMDetails = {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string | null;
    createdAt: string;
  };
  metrics: {
    totalBooked: number;
    totalAttended: number;
    attendanceRate: number;
    totalPaid: number;
    favoriteService: string;
  };
  appointments: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    price: number;
    paymentStatus: string;
    locationName: string | null;
    staffName: string | null;
    serviceName: string | null;
  }[];
  clinicalRecords: {
    id: string;
    title: string;
    type: string;
    content: string;
    attachments: string[] | null;
    createdAt: string;
  }[];
};

function findFavoriteService(appointments: any[]): string {
  const serviceCounts: Record<string, number> = {};

  for (const apt of appointments) {
    if (apt.clientMetadata && typeof apt.clientMetadata === "object" && !Array.isArray(apt.clientMetadata)) {
      const metadata = apt.clientMetadata as Record<string, any>;
      const serviceKey = Object.keys(metadata).find(
        (k) => k.toLowerCase() === "servicio" || k.toLowerCase() === "service"
      );
      if (serviceKey) {
        const val = String(metadata[serviceKey]).trim();
        if (val) {
          serviceCounts[val] = (serviceCounts[val] || 0) + 1;
        }
      }
    }
  }

  const entries = Object.entries(serviceCounts);
  if (entries.length === 0) return "No registrado";

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export async function getClientCRMDetails(clientId: string): Promise<CRMDetails | null> {
  const tenant = await withTenant();

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: tenant.userId },
  });

  if (!client) return null;

  // Fetch all appointments for this client email
  const appointments = await prisma.appointment.findMany({
    where: {
      userId: tenant.userId,
      clientEmail: client.email,
    },
    include: {
      location: true,
      staff: true,
      service: true,
    },
    orderBy: { startTime: "desc" },
  });

  // Fetch clinical records if rubro allows
  const rubroConfig = getRubroConfig(tenant.rubro);
  let clinicalRecords: any[] = [];
  if (rubroConfig.enableClinicalRecords) {
    clinicalRecords = await prisma.clinicalRecord.findMany({
      where: {
        clientId: client.id,
        userId: tenant.userId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Calculate metrics
  const totalBooked = appointments.length;
  const totalAttended = appointments.filter((a) => a.status === "CONFIRMADA").length;
  const attendanceRate = totalBooked > 0 ? Math.round((totalAttended / totalBooked) * 100) : 100;
  
  const totalPaid = appointments
    .filter((a) => a.paymentStatus === "PAGADO")
    .reduce((sum, a) => sum + (a.price || 0), 0);

  // Calculate favorite service
  const serviceCounts: Record<string, number> = {};
  for (const apt of appointments) {
    let name = apt.service?.name;
    if (!name && apt.clientMetadata && typeof apt.clientMetadata === "object" && !Array.isArray(apt.clientMetadata)) {
      const metadata = apt.clientMetadata as Record<string, any>;
      const serviceKey = Object.keys(metadata).find(
        (k) => k.toLowerCase() === "servicio" || k.toLowerCase() === "service"
      );
      if (serviceKey && metadata[serviceKey]) {
        name = String(metadata[serviceKey]).trim();
      }
    }
    if (name) {
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    }
  }
  const entries = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
  const favoriteService = entries.length > 0 ? entries[0][0] : "No registrado";

  return {
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      notes: client.notes,
      createdAt: client.createdAt.toISOString(),
    },
    metrics: {
      totalBooked,
      totalAttended,
      attendanceRate,
      totalPaid,
      favoriteService,
    },
    appointments: appointments.map((a) => {
      let serviceName: string | null = a.service?.name || null;
      if (!serviceName && a.clientMetadata && typeof a.clientMetadata === "object" && !Array.isArray(a.clientMetadata)) {
        const metadata = a.clientMetadata as Record<string, any>;
        const serviceKey = Object.keys(metadata).find(
          (k) => k.toLowerCase() === "servicio" || k.toLowerCase() === "service"
        );
        if (serviceKey) {
          serviceName = String(metadata[serviceKey]);
        }
      }

      return {
        id: a.id,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        status: a.status,
        price: a.price || 0,
        paymentStatus: a.paymentStatus || "PENDIENTE",
        locationName: a.location?.name || null,
        staffName: a.staff?.name || null,
        serviceName,
      };
    }),
    clinicalRecords: clinicalRecords.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      content: r.content,
      attachments: Array.isArray(r.attachments) ? (r.attachments as string[]) : null,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function createClinicalRecord(
  clientId: string,
  input: {
    title: string;
    type: string;
    content: string;
    attachments?: string[];
  }
) {
  const tenant = await withTenant();
  const rubroConfig = getRubroConfig(tenant.rubro);

  if (!rubroConfig.enableClinicalRecords) {
    return { error: "El módulo clínico no está habilitado para el rubro de este negocio." };
  }

  const title = input.title.trim();
  const content = input.content.trim();
  const type = input.type.trim().toUpperCase();

  if (!title || title.length < 2) {
    return { error: "El título debe tener al menos 2 caracteres." };
  }
  if (!content || content.length < 5) {
    return { error: "Las notas clínicas deben tener al menos 5 caracteres." };
  }

  // Verify client ownership
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: tenant.userId },
  });

  if (!client) {
    return { error: "Cliente no encontrado." };
  }

  const record = await prisma.clinicalRecord.create({
    data: {
      clientId,
      userId: tenant.userId,
      title,
      type,
      content,
      attachments: input.attachments || [],
    },
  });

  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard/expedientes");
  return { success: true, recordId: record.id };
}

export async function deleteClinicalRecord(recordId: string) {
  const tenant = await withTenant();
  const rubroConfig = getRubroConfig(tenant.rubro);

  if (!rubroConfig.enableClinicalRecords) {
    return { error: "El módulo clínico no está habilitado para el rubro de este negocio." };
  }

  const existing = await prisma.clinicalRecord.findFirst({
    where: { id: recordId, userId: tenant.userId },
  });

  if (!existing) {
    return { error: "Ficha clínica no encontrada." };
  }

  await prisma.clinicalRecord.delete({
    where: { id: recordId },
  });

  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard/expedientes");
  return { success: true };
}

export async function updateAppointmentPayment(
  appointmentId: string,
  input: {
    paymentStatus: string;
    price: number;
  }
) {
  const tenant = await withTenant();

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: tenant.userId },
  });

  if (!appointment) {
    return { error: "Cita no encontrada." };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      paymentStatus: input.paymentStatus,
      price: input.price,
    },
  });

  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function getAllClinicalRecords() {
  const tenant = await withTenant();
  const rubroConfig = getRubroConfig(tenant.rubro);

  if (!rubroConfig.enableClinicalRecords) {
    return [];
  }

  const records = await prisma.clinicalRecord.findMany({
    where: { userId: tenant.userId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return records.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    clientName: r.client.name,
    clientEmail: r.client.email,
    clientPhone: r.client.phone,
    title: r.title,
    type: r.type,
    content: r.content,
    attachments: Array.isArray(r.attachments) ? (r.attachments as string[]) : null,
    createdAt: r.createdAt.toISOString(),
  }));
}
