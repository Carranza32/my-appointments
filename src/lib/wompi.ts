import { PlanTier } from "@prisma/client";

export type WompiConfig = {
  clientId: string | undefined;
  clientSecret: string | undefined;
  webhookSecret: string | undefined;
};

export const WOMPI_CONFIG: WompiConfig = {
  clientId: process.env.WOMPI_CLIENT_ID,
  clientSecret: process.env.WOMPI_CLIENT_SECRET,
  webhookSecret: process.env.WOMPI_WEBHOOK_SECRET,
};

// Check if Wompi is configured with real keys
export function isWompiConfigured(): boolean {
  return (
    !!WOMPI_CONFIG.clientId &&
    !!WOMPI_CONFIG.clientSecret &&
    WOMPI_CONFIG.clientId !== "your_wompi_client_id_here" &&
    WOMPI_CONFIG.clientSecret !== "your_wompi_client_secret_here"
  );
}

/**
 * Gets OAuth2 access token from id.wompi.sv
 */
export async function getWompiAccessToken(): Promise<string | null> {
  if (!isWompiConfigured()) {
    return null; // Force Mock Mode in dev
  }

  try {
    const response = await fetch("https://id.wompi.sv/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: WOMPI_CONFIG.clientId!,
        client_secret: WOMPI_CONFIG.clientSecret!,
      }),
    });

    if (!response.ok) {
      console.error("[Wompi] Token endpoint returned status:", response.status);
      return null;
    }
    
    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error("[Wompi] Error fetching access token:", error);
    return null;
  }
}

/**
 * Creates a hosted checkout EnlacePago in Wompi.
 * If credentials are not set, it returns a mock URL.
 */
export async function createWompiPaymentLink(params: {
  userId: string;
  email: string;
  amount: number;
  returnUrl: string;
}): Promise<{ url: string; isMock: boolean }> {
  const token = await getWompiAccessToken();

  if (!token) {
    // Return a mock checkout URL pointing back to our settings tab with query parameters
    const mockUrl = `${params.returnUrl}${params.returnUrl.includes("?") ? "&" : "?"}wompi_mock=checkout&userId=${params.userId}&amount=${params.amount}`;
    return { url: mockUrl, isMock: true };
  }

  try {
    const response = await fetch("https://api.wompi.sv/EnlacePago", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        identificadorEnlaceComercio: `sub_pro_${params.userId}_${Date.now()}`,
        nombreProducto: "Suscripción My Appointment PRO",
        monto: params.amount,
        esMontoEditables: false,
        cantidadMaximoPagos: 1,
        formaRegistroCobro: 1, // standard payment
        configuracion: {
          emailsNotificacion: params.email,
          urlRedirect: params.returnUrl,
          urlReferencia: params.returnUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Wompi API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return { url: data.urlEnlace || data.urlEnlaceLargo, isMock: false };
  } catch (error) {
    console.error("[Wompi] Error creating EnlacePago:", error);
    // Fallback to mock locally in case of failure or network block
    const mockUrl = `${params.returnUrl}${params.returnUrl.includes("?") ? "&" : "?"}wompi_mock=checkout&userId=${params.userId}&amount=${params.amount}`;
    return { url: mockUrl, isMock: true };
  }
}

/**
 * Validates the signature header from Wompi Webhook.
 */
export function validateWompiWebhookSignature(
  bodyText: string,
  signatureHeader: string
): boolean {
  if (!WOMPI_CONFIG.webhookSecret || WOMPI_CONFIG.webhookSecret === "your_wompi_webhook_secret_here") {
    return true; // Auto-pass signature checks in development/mock mode
  }

  try {
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", WOMPI_CONFIG.webhookSecret);
    const calculated = hmac.update(bodyText).digest("hex");
    return calculated === signatureHeader;
  } catch (error) {
    console.error("[Wompi] Signature validation error:", error);
    return false;
  }
}
