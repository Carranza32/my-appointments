"use server";

import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAvailableSlots } from "@/actions/availability";
import { getProfessional, requireAuth } from "@/lib/auth";
import { buildAppointmentRange } from "@/lib/booking";
import type { FormFieldDef } from "@/lib/form-fields";
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent } from "@/lib/google-calendar-client";
import { prisma } from "@/lib/prisma";
import {
  sendClientConfirmationEmail,
  sendProfessionalNotificationEmail,
  sendClientCancellationEmail,
  sendProfessionalCancellationEmail,
} from "@/lib/emails";

export type CreateAppointmentInput = {
  slug: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientMetadata: Record<string, string>;
  staffId?: string | null;
  locationId?: string | null;
};

function validateClientMetadata(
  fields: FormFieldDef[],
  metadata: Record<string, string>,
): string | null {
  for (const field of fields) {
    const value = metadata[field.name]?.trim() ?? "";
    if (field.required && !value) {
      return `El campo «${field.label}» es obligatorio.`;
    }
  }
  return null;
}

export type AppointmentDTO = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientMetadata: Record<string, string> | null;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  googleEventId: string | null;
};

export async function getAppointmentsForMonth(year: number, month: number) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return [];

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const rows = await prisma.appointment.findMany({
    where: {
      userId: professional.id,
      startTime: { gte: start, lte: end },
    },
    orderBy: { startTime: "asc" },
  });

  return rows.map((a) => toAppointmentDTO(a));
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
) {
  await requireAuth();
  const professional = await getProfessional();
  if (!professional) return { error: "No autorizado." };

  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: professional.id },
  });

  if (!existing) {
    return { error: "Cita no encontrada." };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  if (status === AppointmentStatus.CANCELADA) {
    const emailInfo = {
      id: existing.id,
      clientName: existing.clientName,
      clientEmail: existing.clientEmail,
      clientPhone: existing.clientPhone,
      businessName: professional.name,
      startTime: existing.startTime.toISOString(),
      endTime: existing.endTime.toISOString(),
      professionalEmail: professional.email,
    };
    sendClientCancellationEmail(emailInfo).catch((err) =>
      console.error("[updateAppointmentStatus] Client cancellation email trigger failed:", err)
    );
    sendProfessionalCancellationEmail(emailInfo).catch((err) =>
      console.error("[updateAppointmentStatus] Professional cancellation email trigger failed:", err)
    );
  }

  revalidatePath("/dashboard/citas");

  return { success: true };
}

function toAppointmentDTO(a: {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientMetadata: unknown;
  status: AppointmentStatus;
  startTime: Date;
  endTime: Date;
  googleEventId: string | null;
}): AppointmentDTO {
  return {
    id: a.id,
    clientName: a.clientName,
    clientEmail: a.clientEmail,
    clientPhone: a.clientPhone,
    clientMetadata:
      a.clientMetadata && typeof a.clientMetadata === "object"
        ? (a.clientMetadata as Record<string, string>)
        : null,
    status: a.status,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    googleEventId: a.googleEventId,
  };
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<
  | { success: true; appointmentId: string; googleSynced: boolean }
  | { error: string }
> {
  const slug = input.slug.trim().toLowerCase();
  const clientName = input.clientName.trim();
  const clientEmail = input.clientEmail.trim().toLowerCase();
  const clientPhone = input.clientPhone.trim();

  if (!slug || !input.date || !input.time) {
    return { error: "Datos de reserva incompletos." };
  }

  if (!clientName || clientName.length < 2) {
    return { error: "Ingresa tu nombre." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return { error: "Email inválido." };
  }

  if (!clientPhone || clientPhone.length < 8) {
    return { error: "Ingresa un teléfono válido." };
  }

  const professional = await prisma.user.findUnique({
    where: { slug },
    include: { config: true, googleAccount: true },
  });

  if (!professional?.config) {
    return { error: "Negocio no encontrado." };
  }

  const formFields = Array.isArray(professional.config.formFields)
    ? (professional.config.formFields as FormFieldDef[])
    : [];

  const metadataError = validateClientMetadata(
    formFields,
    input.clientMetadata,
  );
  if (metadataError) return { error: metadataError };

  const slotsResult = await getAvailableSlots(
    slug,
    new Date(`${input.date}T12:00:00`),
    input.staffId,
  );

  if ("error" in slotsResult) {
    return { error: slotsResult.error };
  }

  if (!slotsResult.slots.includes(input.time)) {
    return { error: "Ese horario ya no está disponible. Elige otro." };
  }

  const { startTime, endTime } = buildAppointmentRange(
    input.date,
    input.time,
    professional.config.slotDuration,
  );

  const metadataLines = formFields
    .map((f) => {
      const v = input.clientMetadata[f.name]?.trim();
      return v ? `${f.label}: ${v}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const description = [
    `Cliente: ${clientName}`,
    `Email: ${clientEmail}`,
    `Tel: ${clientPhone}`,
    metadataLines,
  ]
    .filter(Boolean)
    .join("\n");

  const appointment = await prisma.appointment.create({
    data: {
      userId: professional.id,
      startTime,
      endTime,
      status: AppointmentStatus.PENDIENTE,
      clientName,
      clientEmail,
      clientPhone,
      clientMetadata: input.clientMetadata,
      staffId: input.staffId || null,
      locationId: input.locationId || null,
    },
  });

  // Auto-sync client to Client table
  try {
    await prisma.client.upsert({
      where: {
        userId_email: {
          userId: professional.id,
          email: clientEmail,
        },
      },
      update: {
        name: clientName,
        phone: clientPhone,
      },
      create: {
        userId: professional.id,
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
      },
    });
  } catch (err) {
    console.error("[createAppointment] Failed to upsert client to Client table:", err);
  }

  let googleSynced = false;

  if (professional.googleAccount) {
    try {
      const googleEventId = await createGoogleCalendarEvent(
        professional.googleAccount,
        {
          summary: `Cita: ${clientName}`,
          description,
          startTime,
          endTime,
          attendeeEmail: clientEmail,
        },
      );
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { googleEventId },
      });
      googleSynced = true;
    } catch (e) {
      console.error(
        "[createAppointment] Google Calendar opcional falló, cita guardada en DB:",
        e,
      );
    }
  }

  // Trigger emails in background
  const emailInfo = {
    id: appointment.id,
    clientName,
    clientEmail,
    clientPhone,
    businessName: professional.name,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    professionalEmail: professional.email,
  };

  sendClientConfirmationEmail(emailInfo).catch((err) =>
    console.error("[createAppointment] Client email trigger failed:", err)
  );
  sendProfessionalNotificationEmail(emailInfo, metadataLines).catch((err) =>
    console.error("[createAppointment] Professional email trigger failed:", err)
  );

  return {
    success: true,
    appointmentId: appointment.id,
    googleSynced,
  };
}

export async function cancelAppointmentByClient(appointmentId: string) {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: {
        include: {
          googleAccount: true,
        },
      },
    },
  });

  if (!existing) {
    return { error: "Cita no encontrada." };
  }

  if (existing.status === AppointmentStatus.CANCELADA) {
    return { success: true, message: "La cita ya estaba cancelada." };
  }

  // Update status to CANCELADA in database
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CANCELADA },
  });

  // Delete from Google Calendar if integrated
  if (existing.user.googleAccount && existing.googleEventId) {
    try {
      await deleteGoogleCalendarEvent(
        existing.user.googleAccount,
        existing.googleEventId
      );
    } catch (e) {
      console.error("[cancelAppointmentByClient] Google calendar cancellation failed:", e);
    }
  }

  // Trigger emails
  const emailInfo = {
    id: existing.id,
    clientName: existing.clientName,
    clientEmail: existing.clientEmail,
    clientPhone: existing.clientPhone,
    businessName: existing.user.name,
    startTime: existing.startTime.toISOString(),
    endTime: existing.endTime.toISOString(),
    professionalEmail: existing.user.email,
  };

  sendClientCancellationEmail(emailInfo).catch((err) =>
    console.error("[cancelAppointmentByClient] Client cancellation email trigger failed:", err)
  );
  sendProfessionalCancellationEmail(emailInfo).catch((err) =>
    console.error("[cancelAppointmentByClient] Professional cancellation email trigger failed:", err)
  );

  return { success: true };
}
