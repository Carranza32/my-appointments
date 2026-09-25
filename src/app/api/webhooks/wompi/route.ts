import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PlanTier } from "@prisma/client";
import { validateWompiWebhookSignature } from "@/lib/wompi";

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get("x-wompi-signature") || "";

    // Validate signature
    if (!validateWompiWebhookSignature(bodyText, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    
    // Wompi El Salvador Webhook structure
    // Expected structure:
    // {
    //   "evento": "transaccion.completada",
    //   "transaccion": {
    //     "id": "wompi_tx_id",
    //     "referencia": "sub_pro_USERID_TIMESTAMP",
    //     "monto": 15.00,
    //     "estado": "APROBADO" | "RECHAZADO" | "ANULADO"
    //   }
    // }
    
    const eventType = payload.evento || payload.event;
    const transaction = payload.transaccion || payload.transaction || {};
    const status = transaction.estado || transaction.status;
    const reference = transaction.referencia || transaction.reference || "";

    console.log(`[Wompi Webhook] Event: ${eventType}, Status: ${status}, Reference: ${reference}`);

    if (eventType === "transaccion.completada" || eventType === "transaction.completed") {
      // Extract userId from reference (format: sub_pro_USERID_TIMESTAMP)
      if (reference.startsWith("sub_pro_")) {
        const parts = reference.split("_");
        const userId = parts[2]; // parts = ["sub", "pro", "userId", "timestamp"]

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const isApproved = 
            status === "APROBADO" || 
            status === "APPROVED" || 
            status === "SUCCESS" || 
            status === "successful";

          await prisma.user.update({
            where: { id: userId },
            data: {
              planTier: isApproved ? PlanTier.PRO : PlanTier.FREE,
            },
          });
          
          console.log(`[Wompi Webhook] User ${userId} planTier updated to ${isApproved ? "PRO" : "FREE"}`);
        } else {
          console.warn(`[Wompi Webhook] User ID ${userId} not found in database.`);
        }
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error("[Wompi Webhook Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
