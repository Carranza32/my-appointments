type SendWhatsAppInput = {
  to: string;
  body: string;
};

export async function sendWhatsAppMessage({ to, body }: SendWhatsAppInput): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;

  // Normalizar número de teléfono (debe iniciar con '+' y no llevar espacios ni guiones)
  let normalizedTo = to.trim().replace(/[\s\-()]/g, "");
  if (!normalizedTo.startsWith("+")) {
    // Si no tiene código de país, podemos asumir uno por defecto o simplemente dejarlo pasar si ya lo lleva implícito.
    // De preferencia, los números deben venir con formato internacional desde el portal.
    normalizedTo = "+" + normalizedTo;
  }

  // Comportamiento local en desarrollo si no hay variables de entorno configuradas
  if (!accountSid || !authToken || !fromWhatsApp) {
    console.log("\n=======================================================");
    console.log(`[WHATSAPP MOCK] Enviando recordatorio a: ${normalizedTo}`);
    console.log(`[CONTENIDO]:\n${body}`);
    console.log("=======================================================\n");
    return { success: true, messageId: "mock-twilio-msg-id" };
  }

  try {
    const authString = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: `whatsapp:${fromWhatsApp}`,
          To: `whatsapp:${normalizedTo}`,
          Body: body,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[Twilio API Error]:", data);
      return { success: false, error: data.message || "Error al enviar mensaje por Twilio." };
    }

    console.log(`[Twilio Success] Mensaje enviado a ${normalizedTo}. SID: ${data.sid}`);
    return { success: true, messageId: data.sid };
  } catch (error: any) {
    console.error("[sendWhatsAppMessage] Failed:", error);
    return { success: false, error: error.message || "Error en la conexión con Twilio." };
  }
}
