import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const fromEmail = process.env.EMAILS_FROM_ADDRESS || "onboarding@resend.dev";

// Initialize Resend client only if API key is present
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type EmailParams = {
  to: string;
  subject: string;
  html: string;
};

async function sendEmail({ to, subject, html }: EmailParams) {
  if (!resend) {
    console.log("\n=======================================================");
    console.log(`[EMAIL MOCK] Sending email to: ${to}`);
    console.log(`[EMAIL MOCK] Subject: ${subject}`);
    console.log(`[EMAIL MOCK] HTML Content:\n${html}`);
    console.log("=======================================================\n");
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `My Appointment <${fromEmail}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[emails] Resend error:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("[emails] Failed to send email via Resend:", err);
    return { error: err.message || "Unknown error" };
  }
}

export type AppointmentEmailInfo = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  businessName: string;
  startTime: string;
  endTime: string;
  professionalEmail: string;
};

// Format a date string nicely
function formatDateString(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 1. Email de confirmación de cita al cliente
 */
export async function sendClientConfirmationEmail(apt: AppointmentEmailInfo) {
  const dateFormatted = formatDateString(apt.startTime);
  const cancelLink = `${siteUrl}/citas/cancelar/${apt.id}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
      <div style="background-color: #4f46e5; padding: 24px; border-radius: 12px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">¡Tu cita ha sido reservada!</h1>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff; border-radius: 12px; margin-top: 16px; border: 1px border-slate-200;">
        <p style="margin-top: 0; font-size: 16px; line-height: 1.6;">Hola <strong>${apt.clientName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Tu reserva con <strong>${apt.businessName}</strong> ha quedado confirmada. A continuación los detalles de tu cita:</p>
        
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 0 0 8px 0; font-size: 14px;">📅 <strong>Fecha:</strong> ${dateFormatted}</p>
          <p style="margin: 0; font-size: 14px;">⏱️ <strong>Duración:</strong> Cita reservada en la plataforma.</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Si necesitas cancelar o reprogramar tu cita, puedes hacerlo directamente haciendo clic en el siguiente enlace:</p>
        
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${cancelLink}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Cancelar Cita</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        <p>Este es un correo automático enviado por My Appointment.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: apt.clientEmail,
    subject: `Confirmación de cita - ${apt.businessName}`,
    html,
  });
}

/**
 * 2. Notificación por email al profesional cuando recibe cita
 */
export async function sendProfessionalNotificationEmail(apt: AppointmentEmailInfo, metadataLines?: string) {
  const dateFormatted = formatDateString(apt.startTime);
  const dashboardLink = `${siteUrl}/dashboard/citas`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
      <div style="background-color: #0f172a; padding: 24px; border-radius: 12px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Nueva cita recibida</h1>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff; border-radius: 12px; margin-top: 16px; border: 1px border-slate-200;">
        <p style="margin-top: 0; font-size: 16px; line-height: 1.6;">Hola <strong>${apt.businessName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Has recibido una nueva reserva en tu portal de citas:</p>
        
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 0 0 8px 0; font-size: 14px;">👤 <strong>Cliente:</strong> ${apt.clientName}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">✉️ <strong>Email:</strong> ${apt.clientEmail}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">📞 <strong>Teléfono:</strong> ${apt.clientPhone}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">📅 <strong>Fecha y Hora:</strong> ${dateFormatted}</p>
          ${metadataLines ? `<p style="margin: 8px 0 0 0; font-size: 13px; border-t border-slate-200 pt-2; color: #475569;">📋 <strong>Respuestas adicionales:</strong><br/>${metadataLines.replace(/\n/g, "<br/>")}</p>` : ""}
        </div>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${dashboardLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Ver en mi Panel</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        <p>Gestión de citas automatizada por My Appointment.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: apt.professionalEmail,
    subject: `Nueva cita de ${apt.clientName} - My Appointment`,
    html,
  });
}

/**
 * 3. Email de cancelación de cita al cliente
 */
export async function sendClientCancellationEmail(apt: AppointmentEmailInfo) {
  const dateFormatted = formatDateString(apt.startTime);

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
      <div style="background-color: #ef4444; padding: 24px; border-radius: 12px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Cita Cancelada</h1>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff; border-radius: 12px; margin-top: 16px; border: 1px border-slate-200;">
        <p style="margin-top: 0; font-size: 16px; line-height: 1.6;">Hola <strong>${apt.clientName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Te informamos que tu cita programada con <strong>${apt.businessName}</strong> ha sido cancelada:</p>
        
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;">📅 <strong>Fecha original:</strong> ${dateFormatted}</p>
          <p style="margin: 0; font-size: 14px; color: #991b1b;">❌ <strong>Estado:</strong> CANCELADA</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Si deseas agendar un nuevo horario, puedes visitar nuevamente su portal de reservas públicas.</p>
      </div>
      
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        <p>My Appointment.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: apt.clientEmail,
    subject: `Cita Cancelada - ${apt.businessName}`,
    html,
  });
}

/**
 * 4. Email de cancelación de cita al profesional
 */
export async function sendProfessionalCancellationEmail(apt: AppointmentEmailInfo) {
  const dateFormatted = formatDateString(apt.startTime);
  const dashboardLink = `${siteUrl}/dashboard/citas`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
      <div style="background-color: #ef4444; padding: 24px; border-radius: 12px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Reserva Cancelada</h1>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff; border-radius: 12px; margin-top: 16px; border: 1px border-slate-200;">
        <p style="margin-top: 0; font-size: 16px; line-height: 1.6;">Hola <strong>${apt.businessName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">La siguiente cita de tu agenda ha sido cancelada:</p>
        
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;">👤 <strong>Cliente:</strong> ${apt.clientName}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;">📅 <strong>Fecha original:</strong> ${dateFormatted}</p>
        </div>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${dashboardLink}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Ver en mi Panel</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        <p>My Appointment.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: apt.professionalEmail,
    subject: `Cita Cancelada: ${apt.clientName} - My Appointment`,
    html,
  });
}

export async function sendClientReminderEmail(apt: AppointmentEmailInfo) {
  const dateFormatted = formatDateString(apt.startTime);
  const cancelLink = `${siteUrl}/citas/cancelar/${apt.id}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
      <div style="background-color: #4f46e5; padding: 24px; border-radius: 12px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Recordatorio de tu cita</h1>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff; border-radius: 12px; margin-top: 16px; border: 1px border-slate-200;">
        <p style="margin-top: 0; font-size: 16px; line-height: 1.6;">Hola <strong>${apt.clientName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Te recordamos que tienes una cita programada con <strong>${apt.businessName}</strong> mañana:</p>
        
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 0 0 8px 0; font-size: 14px;">📅 <strong>Fecha y Hora:</strong> ${dateFormatted}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Si por algún motivo no puedes asistir, por favor cancela tu reserva a tiempo utilizando el siguiente enlace:</p>
        
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${cancelLink}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Cancelar Cita</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        <p>Gracias por usar My Appointment.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: apt.clientEmail,
    subject: `Recordatorio de cita mañana - ${apt.businessName}`,
    html,
  });
}

