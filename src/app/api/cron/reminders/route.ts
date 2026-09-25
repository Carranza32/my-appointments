import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendClientReminderEmail } from "@/lib/emails";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function GET(req: Request) {
  // 1. Validar autorización
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Ventana de 23 a 25 horas en el futuro
    const rangeStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const rangeEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Buscar citas que ocurran mañana y que falte enviar algún recordatorio
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: rangeStart,
          lte: rangeEnd,
        },
        status: {
          in: ["PENDIENTE", "CONFIRMADA"],
        },
        OR: [
          { reminderSent: false },
          { reminderWhatsAppSent: false },
        ],
      },
      include: {
        user: true,
        service: true,
      },
    });

    const results = [];

    for (const app of appointments) {
      const start = new Date(app.startTime);
      const dateStr = start.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const timeStr = start.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      let emailSuccess = app.reminderSent;
      let waSuccess = app.reminderWhatsAppSent;

      // A. Enviar Recordatorio por Correo
      if (!app.reminderSent) {
        try {
          const emailInfo = {
            id: app.id,
            clientName: app.clientName,
            clientEmail: app.clientEmail,
            clientPhone: app.clientPhone,
            businessName: app.user.name,
            startTime: app.startTime.toISOString(),
            endTime: app.endTime.toISOString(),
            professionalEmail: app.user.email,
          };
          const emailResult = await sendClientReminderEmail(emailInfo);
          if ("success" in emailResult) {
            emailSuccess = true;
          }
        } catch (err) {
          console.error(`[Cron Reminders] Failed to send email to ${app.clientEmail}:`, err);
        }
      }

      // B. Enviar Recordatorio por WhatsApp
      if (!app.reminderWhatsAppSent) {
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
          const serviceName = app.service?.name ? ` para *${app.service.name}*` : "";
          const confirmUrl = `${siteUrl}/citas/confirmar/${app.id}`;
          const cancelUrl = `${siteUrl}/citas/cancelar/${app.id}`;
          const meetingUrl = (app.clientMetadata as any)?.meetingUrl;
          const meetText = meetingUrl ? `\n\n📹 *Videollamada de tu sesión:*\n${meetingUrl}` : "";
          const waBody = `¡Hola, *${app.clientName}*! 👋 Te recordamos tu cita${serviceName} con *${app.user.name}* mañana *${dateStr}* a las *${timeStr}* hs.${meetText}\n\n✅ *Confirma tu asistencia en 1 clic:*\n${confirmUrl}\n\n❌ Si necesitas cancelar o reprogramar:\n${cancelUrl}`;
          const waResult = await sendWhatsAppMessage({ to: app.clientPhone, body: waBody });
          if (waResult.success) {
            waSuccess = true;
          }
        } catch (err) {
          console.error(`[Cron Reminders] Failed to send WhatsApp to ${app.clientPhone}:`, err);
        }
      }

      // C. Actualizar banderas en DB si cambiaron
      if (emailSuccess !== app.reminderSent || waSuccess !== app.reminderWhatsAppSent) {
        await prisma.appointment.update({
          where: { id: app.id },
          data: {
            reminderSent: emailSuccess,
            reminderWhatsAppSent: waSuccess,
          },
        });
      }

      results.push({
        id: app.id,
        client: app.clientName,
        emailSent: emailSuccess,
        whatsAppSent: waSuccess,
      });
    }

    return NextResponse.json({
      processed: results.length,
      appointments: results,
    });
  } catch (error: any) {
    console.error("[Cron Reminders Route Error]:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
