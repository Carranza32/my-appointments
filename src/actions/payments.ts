"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";

export async function getPendingBankTransfers() {
  try {
    const tenant = await withTenant();

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: tenant.userId,
        paymentStatus: "PENDIENTE_VERIFICACION",
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return appointments.map((a) => ({
      id: a.id,
      clientName: a.clientName,
      clientEmail: a.clientEmail,
      clientPhone: a.clientPhone,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      status: a.status,
      price: a.price || 0,
      paymentStatus: a.paymentStatus || "PENDIENTE",
      paymentProofUrl: a.paymentProofUrl,
    }));
  } catch (error: any) {
    console.error("[getPendingBankTransfers] Error:", error);
    return [];
  }
}

export async function confirmBankTransferPayment(appointmentId: string, price: number) {
  try {
    const tenant = await withTenant();

    // Verify appointment ownership
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, userId: tenant.userId },
    });

    if (!appointment) {
      return { error: "Cita no encontrada." };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: "PAGADO",
        status: AppointmentStatus.CONFIRMADA,
        price: price,
      },
    });

    revalidatePath("/dashboard/pagos");
    revalidatePath("/dashboard/citas");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("[confirmBankTransferPayment] Error:", error);
    return { error: error.message || "Error al confirmar el pago." };
  }
}

export async function rejectBankTransferPayment(appointmentId: string) {
  try {
    const tenant = await withTenant();

    // Verify appointment ownership
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, userId: tenant.userId },
    });

    if (!appointment) {
      return { error: "Cita no encontrada." };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: "PENDIENTE",
        paymentProofUrl: null, // Clear invalid/rejected proof
      },
    });

    revalidatePath("/dashboard/pagos");
    revalidatePath("/dashboard/citas");
    return { success: true };
  } catch (error: any) {
    console.error("[rejectBankTransferPayment] Error:", error);
    return { error: error.message || "Error al rechazar el pago." };
  }
}
