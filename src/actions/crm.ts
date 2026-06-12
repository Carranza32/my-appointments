"use server";

import { revalidatePath } from "next/cache";
import { getProfessional, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      // Find key matching "servicio" or "service" (case-insensitive)
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
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return null;

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: professional.id },
  });

  if (!client) return null;

  // Fetch all appointments for this client email
  const appointments = await prisma.appointment.findMany({
    where: {
      userId: professional.id,
      clientEmail: client.email,
    },
    include: {
      location: true,
      staff: true,
    },
    orderBy: { startTime: "desc" },
  });

  // Fetch clinical records
  const clinicalRecords = await prisma.clinicalRecord.findMany({
    where: {
      clientId: client.id,
      userId: professional.id,
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate metrics
  const totalBooked = appointments.length;
  const totalAttended = appointments.filter((a) => a.status === "CONFIRMADA").length;
  const attendanceRate = totalBooked > 0 ? Math.round((totalAttended / totalBooked) * 100) : 100;
  
  const totalPaid = appointments
    .filter((a) => a.paymentStatus === "PAGADO")
    .reduce((sum, a) => sum + (a.price || 0), 0);

  const favoriteService = findFavoriteService(appointments);

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
      // Try to extract service name from metadata
      let serviceName: string | null = null;
      if (a.clientMetadata && typeof a.clientMetadata === "object" && !Array.isArray(a.clientMetadata)) {
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
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

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
    where: { id: clientId, userId: professional.id },
  });

  if (!client) {
    return { error: "Cliente no encontrado." };
  }

  const record = await prisma.clinicalRecord.create({
    data: {
      clientId,
      userId: professional.id,
      title,
      type,
      content,
      attachments: input.attachments || [],
    },
  });

  revalidatePath("/dashboard/clientes");
  return { success: true, recordId: record.id };
}

export async function deleteClinicalRecord(recordId: string) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

  const existing = await prisma.clinicalRecord.findFirst({
    where: { id: recordId, userId: professional.id },
  });

  if (!existing) {
    return { error: "Ficha clínica no encontrada." };
  }

  await prisma.clinicalRecord.delete({
    where: { id: recordId },
  });

  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function updateAppointmentPayment(
  appointmentId: string,
  input: {
    paymentStatus: string;
    price: number;
  }
) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: professional.id },
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
