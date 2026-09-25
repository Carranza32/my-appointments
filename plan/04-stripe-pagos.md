# 04 — Stripe: Pagos y Suscripciones

## Resumen

Stripe maneja todo el flujo de monetización:
1. **Stripe Checkout** — el tenant compra el plan PRO
2. **Stripe Webhooks** — actualiza automáticamente `planTier` en la BD
3. **Stripe Billing Portal** — el tenant administra su suscripción
4. **(Futuro) Stripe Connect** — los clientes finales pagan al reservar

---

## Flujo de Suscripción

```
┌──────────────────┐    ┌───────────────────┐    ┌──────────────────┐
│ Tenant (FREE)    │    │ Stripe Checkout    │    │ Stripe Webhooks  │
│                  │    │                    │    │                  │
│ Click "Upgrade"  │───►│ Pago con tarjeta   │───►│ Evento recibido  │
│                  │    │                    │    │ planTier → PRO   │
└──────────────────┘    └───────────────────┘    └──────────────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │ BD: User.planTier│
                                                 │ actualizado a PRO│
                                                 └──────────────────┘
```

---

## 1. Setup de Stripe

### Variables de entorno necesarias

```env
# .env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx        # Price ID del plan PRO mensual
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxx  # Price ID del plan PRO anual
```

### Dependencia

```bash
npm install stripe
```

### Cliente de Stripe

```typescript
// src/lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});
```

---

## 2. API: Crear Checkout Session

```typescript
// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const tenant = await withTenant();
    const { priceId } = await request.json();

    // Obtener o crear Stripe Customer
    let stripeCustomerId = null;
    const user = await prisma.user.findUnique({ where: { id: tenant.userId } });
    
    if (user?.stripeCustomerId) {
      stripeCustomerId = user.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: tenant.email,
        name: tenant.name,
        metadata: { userId: tenant.userId },
      });
      
      await prisma.user.update({
        where: { id: tenant.userId },
        data: { stripeCustomerId: customer.id },
      });
      
      stripeCustomerId = customer.id;
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing?canceled=true`,
      metadata: { userId: tenant.userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 3. API: Webhook de Stripe

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PlanTier } from "@prisma/client";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      
      const isActive = ["active", "trialing"].includes(subscription.status);
      
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { planTier: isActive ? PlanTier.PRO : PlanTier.FREE },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { planTier: PlanTier.FREE },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      // Opcionalmente enviar email de aviso al tenant
      console.log(`[Stripe] Payment failed for customer: ${invoice.customer}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## 4. API: Billing Portal

```typescript
// src/app/api/billing-portal/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const tenant = await withTenant();
    const user = await prisma.user.findUnique({ where: { id: tenant.userId } });
    
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 5. Página de Billing en Dashboard

```
/dashboard/billing
├── Estado actual del plan (FREE o PRO)
├── Si FREE: botones para "Upgrade a PRO" (mensual/anual)
├── Si PRO: info de suscripción + botón "Gestionar Suscripción"
├── Historial de pagos (opcional)
└── FAQ de precios
```

---

## 6. Precios Sugeridos

| Plan | Mensual | Anual (descuento 20%) |
|---|---|---|
| FREE | $0 | $0 |
| PRO | $299 MXN (~$15 USD) | $2,870 MXN (~$145 USD) |

> Estos precios son competitivos para el mercado LATAM. Ajustar según validación.

---

## Tareas de Implementación

- [ ] Instalar `stripe` como dependencia
- [ ] Crear `src/lib/stripe.ts`
- [ ] Crear `src/app/api/checkout/route.ts`
- [ ] Crear `src/app/api/webhooks/stripe/route.ts`
- [ ] Crear `src/app/api/billing-portal/route.ts`
- [ ] Crear página `/dashboard/billing` con UI premium
- [ ] Agregar variables de entorno de Stripe
- [ ] Configurar webhook en Stripe Dashboard
- [ ] Crear productos y precios en Stripe Dashboard
- [ ] Probar flujo completo con Stripe Test Mode
- [ ] (Futuro) Stripe Connect para cobros en la reserva
