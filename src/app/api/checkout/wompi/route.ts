import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant";
import { createWompiPaymentLink } from "@/lib/wompi";

export async function POST(request: NextRequest) {
  try {
    const tenant = await withTenant();
    
    // Default to PRO Monthly pricing ($15 USD) if not specified
    let amount = 15;
    try {
      const body = await request.json();
      if (body.priceAmount) {
        amount = Number(body.priceAmount);
      }
    } catch (e) {
      // Body may be empty
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard/settings?tab=plan`;

    const result = await createWompiPaymentLink({
      userId: tenant.userId,
      email: tenant.email,
      amount,
      returnUrl,
    });

    return NextResponse.json({ url: result.url, isMock: result.isMock });
  } catch (error: any) {
    console.error("[Wompi Checkout API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
