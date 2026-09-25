"use server";

import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAvailableSlots } from "@/actions/availability";
import { canCreateAppointment } from "@/lib/plan-guard";
import { withTenant } from "@/lib/tenant";
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
  serviceId?: string | null;
  staffId?: string | null;
  locationId?: string | null;
  resourceId?: string | null;
  paymentProofUrl?: string | null;
};

function validateClientMetadata(
  fields: FormFieldDef[],
  metadata: Record<string, string>,
): string | null {
  const standardNames = new Set([
    "name",
    "nombre",
    "nombre_completo",
    "email",
    "correo",
    "correo_electronico",
    "phone",
    "telefono",
    "celular",
    "whatsapp",
  ]);
  for (const field of fields) {
    if (standardNames.has(field.name.toLowerCase().trim())) continue;
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
  serviceId?: string | null;
  serviceName?: string | null;
  serviceDuration?: number | null;
  price?: number | null;
  currency?: string | null;
  paymentStatus?: string | null;
  staffName?: string | null;
  locationName?: string | null;
  resourceId?: string | null;
};

export async function getAppointmentsForMonth(year: number, month: number) {
  const tenant = await withTenant();

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const rows = await prisma.appointment.findMany({
    where: {
      userId: tenant.userId,
      startTime: { gte: start, lte: end },
    },
    include: {
      service: true,
      staff: true,
      location: true,
      resource: true,
    },
    orderBy: { startTime: "asc" },
  });

  return rows.map((a) => toAppointmentDTO(a));
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
) {
  const tenant = await withTenant();

  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: tenant.userId },
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
      businessName: tenant.name,
      startTime: existing.startTime.toISOString(),
      endTime: existing.endTime.toISOString(),
      professionalEmail: tenant.email,
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
  serviceId?: string | null;
  service?: { name: string; duration: number; price: number; currency?: string } | null;
  price?: number | null;
  paymentStatus?: string | null;
  staff?: { name: string } | null;
  location?: { name: string } | null;
  resourceId?: string | null;
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
    serviceId: a.serviceId,
    serviceName: a.service?.name ?? null,
    serviceDuration: a.service?.duration ?? null,
    price: a.price ?? a.service?.price ?? 0,
    currency: a.service?.currency ?? "USD",
    paymentStatus: a.paymentStatus,
    staffName: a.staff?.name ?? null,
    locationName: a.location?.name ?? null,
    resourceId: a.resourceId,
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
    include: {
      config: true,
      googleAccount: true,
      services: {
        where: input.serviceId
          ? { id: input.serviceId, isActive: true }
          : { isActive: true },
        include: {
          staffServices: {
            include: { staff: true },
          },
        },
      },
    },
  });

  if (!professional?.config) {
    return { error: "Negocio no encontrado." };
  }

  const planCheck = await canCreateAppointment(professional.id, professional.planTier);
  if (!planCheck.allowed) {
    return { error: planCheck.reason };
  }

  const formFields = Array.isArray(professional.config.formFields)
    ? (professional.config.formFields as FormFieldDef[])
    : [];

  const metadataError = validateClientMetadata(
    formFields,
    input.clientMetadata,
  );
  if (metadataError) return { error: metadataError };

  const selectedService = professional.services?.[0] || null;
  if (input.serviceId && !selectedService) {
    return { error: "El servicio seleccionado no está disponible." };
  }

  const slotDuration = selectedService?.duration || professional.config.slotDuration || 30;
  const bufferTime = selectedService !== null ? selectedService.bufferTime : professional.config.bufferTime || 0;
  const servicePrice = selectedService?.price || 0;

  // 1. Validate StaffService relationship server-side
  if (input.staffId && selectedService && selectedService.staffServices.length > 0) {
    const isAssigned = selectedService.staffServices.some(
      (ss) => ss.staffId === input.staffId && ss.staff.isActive
    );
    if (!isAssigned) {
      return { error: "El especialista seleccionado no ofrece este servicio." };
    }
  }

  // 2. Validate Location server-side
  if (input.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: input.locationId, userId: professional.id },
    });
    if (!loc) {
      return { error: "Sede no encontrada." };
    }
  }

  // 3. Validate Resource server-side
  if (input.resourceId) {
    const res = await prisma.resource.findFirst({
      where: { id: input.resourceId, userId: professional.id, isActive: true },
    });
    if (!res) {
      return { error: "Recurso físico no encontrado o inactivo." };
    }
    if (input.locationId && res.locationId && res.locationId !== input.locationId) {
      return { error: "El recurso físico no pertenece a la sede seleccionada." };
    }
  }

  const { startTime, endTime } = buildAppointmentRange(
    input.date,
    input.time,
    slotDuration,
  );
  const endTimeWithBuffer = new Date(endTime.getTime() + bufferTime * 60 * 1000);

  // 4. Pre-check availability
  const slotsResult = await getAvailableSlots(
    slug,
    new Date(`${input.date}T12:00:00`),
    input.staffId,
    input.serviceId,
    input.resourceId,
    input.locationId,
  );

  if ("error" in slotsResult) {
    return { error: slotsResult.error };
  }

  if (!slotsResult.slots.includes(input.time)) {
    return { error: "Ese horario ya no está disponible. Elige otro." };
  }

  const metadataLines = formFields
    .map((f) => {
      const v = input.clientMetadata[f.name]?.trim();
      return v ? `${f.label}: ${v}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const descriptionLines = [
    selectedService ? `Servicio: ${selectedService.name} (${slotDuration} min)` : null,
    `Cliente: ${clientName}`,
    `Email: ${clientEmail}`,
    `Tel: ${clientPhone}`,
    metadataLines,
  ].filter(Boolean);

  const description = descriptionLines.join("\n");

  let appointment;

  try {
    // 5. ATOMIC TRANSACTION WITH ADVISORY LOCK & STRICT OVERLAP CHECK (Double Booking Protection)
    appointment = await prisma.$transaction(async (tx) => {
      const lockKey = `${professional.id}_${input.staffId || "general"}_${input.resourceId || "none"}_${input.date}_${input.time}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      // Check overlapping staff or general calendar appointments
      const conflictingStaff = await tx.appointment.findFirst({
        where: {
          userId: professional.id,
          ...(input.staffId ? { staffId: input.staffId } : { staffId: null }),
          status: { in: [AppointmentStatus.PENDIENTE, AppointmentStatus.CONFIRMADA] },
          startTime: { lt: endTimeWithBuffer },
          endTime: { gt: startTime },
        },
      });

      if (conflictingStaff) {
        throw new Error("HORARIO_NO_DISPONIBLE: Ese horario ya fue reservado.");
      }

      // Check overlapping physical resource (if specified)
      if (input.resourceId) {
        const conflictingResource = await tx.appointment.findFirst({
          where: {
            userId: professional.id,
            resourceId: input.resourceId,
            status: { in: [AppointmentStatus.PENDIENTE, AppointmentStatus.CONFIRMADA] },
            startTime: { lt: endTimeWithBuffer },
            endTime: { gt: startTime },
          },
        });

        if (conflictingResource) {
          throw new Error("RECURSO_NO_DISPONIBLE: El recurso seleccionado ya fue reservado en este horario.");
        }
      }

      return await tx.appointment.create({
        data: {
          userId: professional.id,
          startTime,
          endTime,
          status: AppointmentStatus.PENDIENTE,
          clientName,
          clientEmail,
          clientPhone,
          clientMetadata: input.clientMetadata,
          serviceId: input.serviceId || null,
          staffId: input.staffId || null,
          locationId: input.locationId || null,
          resourceId: input.resourceId || null,
          price: servicePrice,
          paymentProofUrl: input.paymentProofUrl || null,
          paymentStatus: input.paymentProofUrl ? "PENDIENTE_VERIFICACION" : "PENDIENTE",
        },
      });
    });
  } catch (err: any) {
    console.error("[createAppointment] Transaction failed:", err.message);
    if (err.message?.includes("HORARIO_NO_DISPONIBLE")) {
      return { error: "Ese horario acaba de ser reservado por otro usuario. Por favor selecciona otro horario." };
    }
    if (err.message?.includes("RECURSO_NO_DISPONIBLE")) {
      return { error: "El recurso físico ya no está disponible en ese horario." };
    }
    return { error: "No se pudo procesar la reserva. Intenta de nuevo." };
  }

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
          timeZone: professional.config?.timezone || undefined,
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

export async function confirmAppointmentByClient(appointmentId: string) {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: true,
      service: true,
      staff: true,
    },
  });

  if (!existing) {
    return { error: "Cita no encontrada." };
  }

  if (existing.status === AppointmentStatus.CONFIRMADA) {
    return { success: true, message: "La cita ya se encuentra confirmada." };
  }

  if (existing.status === AppointmentStatus.CANCELADA) {
    return {
      error:
        "Esta cita fue cancelada previamente. Por favor ingresa al portal de reservas para agendar un nuevo horario.",
    };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CONFIRMADA },
  });

  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard");
  revalidatePath(`/citas/confirmar/${appointmentId}`);

  return { success: true };
}

export async function uploadPaymentProofAction(appointmentId: string, paymentProofUrl: string) {
  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentProofUrl,
        paymentStatus: "PENDIENTE_VERIFICACION",
      },
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al subir el comprobante de pago." };
  }
}

export async function updateAppointmentMeetingUrl(appointmentId: string, meetingUrl: string) {
  try {
    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing) {
      return { error: "Cita no encontrada." };
    }

    const currentMetadata =
      existing.clientMetadata && typeof existing.clientMetadata === "object" && !Array.isArray(existing.clientMetadata)
        ? (existing.clientMetadata as Record<string, any>)
        : {};

    const updatedMetadata = {
      ...currentMetadata,
      meetingUrl: meetingUrl.trim(),
    };

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        clientMetadata: updatedMetadata,
      },
    });

    revalidatePath("/dashboard/citas");
    revalidatePath("/dashboard");
    revalidatePath(`/citas/confirmar/${appointmentId}`);

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar enlace de videollamada." };
  }
}
