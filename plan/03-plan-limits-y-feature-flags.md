# 03 — Plan Limits y Feature Flags (FREE vs PRO)

## Resumen

Este módulo controla qué puede hacer cada tenant según su plan. Es el **guardián central** que se aplica en:
- Server Actions (backend)
- Componentes de UI (frontend)
- Portal público

---

## Arquitectura del Sistema de Límites

```
┌─────────────────────────────────────────┐
│           plan-limits.ts                 │
│   Definición de límites por plan         │
├─────────────────────────────────────────┤
│           plan-guard.ts                  │
│   Helper que chequea si una acción       │
│   está permitida para el tenant          │
├─────────────────────────────────────────┤
│     Integración en Server Actions        │
│   Cada action verifica antes de operar   │
├─────────────────────────────────────────┤
│     Integración en Componentes UI        │
│   Ocultar/deshabilitar features PRO      │
│   Mostrar badges "PRO" y modal upgrade   │
└─────────────────────────────────────────┘
```

---

## 1. Definición de Límites

```typescript
// src/lib/plan-limits.ts

import { PlanTier } from "@prisma/client";

export type PlanLimits = {
  // Límites cuantitativos
  maxAppointmentsPerMonth: number;
  maxClients: number;
  maxLocations: number;
  maxStaff: number;
  maxServices: number;
  maxFormFields: number;
  
  // Feature flags booleanos
  googleCalendar: boolean;
  whatsappReminders: boolean;
  emailReminders: boolean;
  removeBranding: boolean;
  clinicalRecords: boolean;
  customFormFields: boolean;
  multipleServices: boolean;
  analytics: boolean;
  stripeConnect: boolean;
  embeddableWidget: boolean;
  customSubdomain: boolean;
  prioritySupport: boolean;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    maxAppointmentsPerMonth: 30,
    maxClients: 50,
    maxLocations: 1,
    maxStaff: 0,          // No extra staff — el dueño es el único
    maxServices: 1,
    maxFormFields: 3,
    
    subdomain: true,       // Todos tienen subdominio
    staffSlugs: false,     // No pueden tener staff con URLs propias
    googleCalendar: false,
    whatsappReminders: false,
    emailReminders: true,  // Solo confirmación básica
    removeBranding: false,
    clinicalRecords: false,
    customFormFields: false,
    multipleServices: false,
    analytics: false,
    stripeConnect: false,
    embeddableWidget: false,
    prioritySupport: false,
  },
  PRO: {
    maxAppointmentsPerMonth: Infinity,
    maxClients: Infinity,
    maxLocations: Infinity,
    maxStaff: Infinity,   // Staff ilimitado con su propio slug
    maxServices: Infinity,
    maxFormFields: Infinity,
    
    subdomain: true,       // Obvio
    staffSlugs: true,      // Cada staff tiene su URL: negocio.miapp.com/staff
    googleCalendar: true,
    whatsappReminders: true,
    emailReminders: true,
    removeBranding: true,
    clinicalRecords: true,
    customFormFields: true,
    multipleServices: true,
    analytics: true,
    stripeConnect: true,
    embeddableWidget: true,
    prioritySupport: true,
  },
};

export function getPlanLimits(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier];
}
```

---

## 2. Plan Guard (Backend)

```typescript
// src/lib/plan-guard.ts

import { PlanTier } from "@prisma/client";
import { getPlanLimits } from "./plan-limits";
import { prisma } from "./prisma";

export type PlanCheckResult = 
  | { allowed: true }
  | { allowed: false; reason: string; upgradeRequired: true };

/**
 * Verifica si el tenant puede crear una nueva cita este mes
 */
export async function canCreateAppointment(
  userId: string,
  planTier: PlanTier
): Promise<PlanCheckResult> {
  const limits = getPlanLimits(planTier);
  
  if (limits.maxAppointmentsPerMonth === Infinity) {
    return { allowed: true };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.appointment.count({
    where: {
      userId,
      createdAt: { gte: monthStart, lte: monthEnd },
      status: { not: "CANCELADA" },
    },
  });

  if (count >= limits.maxAppointmentsPerMonth) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limits.maxAppointmentsPerMonth} citas por mes en el plan gratuito.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Verifica si el tenant puede crear un nuevo cliente
 */
export async function canCreateClient(
  userId: string,
  planTier: PlanTier
): Promise<PlanCheckResult> {
  const limits = getPlanLimits(planTier);
  
  if (limits.maxClients === Infinity) return { allowed: true };

  const count = await prisma.client.count({ where: { userId } });

  if (count >= limits.maxClients) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limits.maxClients} clientes en el plan gratuito.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Verifica si el tenant puede crear una nueva sede
 */
export async function canCreateLocation(
  userId: string,
  planTier: PlanTier
): Promise<PlanCheckResult> {
  const limits = getPlanLimits(planTier);
  
  if (limits.maxLocations === Infinity) return { allowed: true };

  const count = await prisma.location.count({ where: { userId } });

  if (count >= limits.maxLocations) {
    return {
      allowed: false,
      reason: `El plan gratuito permite solo ${limits.maxLocations} sede.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Verifica si el tenant puede crear un nuevo staff
 */
export async function canCreateStaff(
  userId: string,
  planTier: PlanTier
): Promise<PlanCheckResult> {
  const limits = getPlanLimits(planTier);
  
  if (limits.maxStaff === Infinity) return { allowed: true };

  if (limits.maxStaff === 0) {
    return {
      allowed: false,
      reason: "La gestión de personal está disponible en el plan PRO.",
      upgradeRequired: true,
    };
  }

  const count = await prisma.staff.count({ where: { userId } });

  if (count >= limits.maxStaff) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limits.maxStaff} empleados en tu plan.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Chequeo genérico de feature flag
 */
export function canUseFeature(
  planTier: PlanTier,
  feature: keyof Pick<PlanLimits, 
    'googleCalendar' | 'whatsappReminders' | 'clinicalRecords' |
    'customFormFields' | 'multipleServices' | 'analytics' |
    'stripeConnect' | 'embeddableWidget' | 'customSubdomain'
  >
): PlanCheckResult {
  const limits = getPlanLimits(planTier);
  
  if (limits[feature]) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Esta función está disponible en el plan PRO.`,
    upgradeRequired: true,
  };
}
```

---

## 3. Integración en Server Actions

### Ejemplo: createAppointment

```typescript
// En src/actions/appointments.ts
export async function createAppointment(input: CreateAppointmentInput) {
  // ... validaciones existentes ...
  
  // NUEVO: Verificar límites de plan
  const planCheck = await canCreateAppointment(professional.id, professional.planTier);
  if (!planCheck.allowed) {
    return { error: planCheck.reason, upgradeRequired: true };
  }
  
  // ... resto de la lógica ...
}
```

### Ejemplo: createLocation

```typescript
export async function createLocation(input: { name: string; address: string }) {
  const tenant = await withTenant();
  
  const planCheck = await canCreateLocation(tenant.userId, tenant.planTier);
  if (!planCheck.allowed) {
    return { error: planCheck.reason, upgradeRequired: true };
  }
  
  // ... crear la sede ...
}
```

### Ejemplo: Google Calendar Connect

```typescript
// Si el tenant es FREE, no permitir conectar Google Calendar
export async function connectGoogleCalendar() {
  const tenant = await withTenant();
  
  const featureCheck = canUseFeature(tenant.planTier, 'googleCalendar');
  if (!featureCheck.allowed) {
    return { error: featureCheck.reason, upgradeRequired: true };
  }
  
  // ... flujo OAuth ...
}
```

---

## 4. Integración en UI

### Componente UpgradeBadge

```tsx
// src/components/ui/upgrade-badge.tsx
"use client";

export function UpgradeBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
      text-[9px] font-extrabold uppercase tracking-widest
      bg-gradient-to-r from-amber-400 to-amber-500 text-white
      shadow-sm shadow-amber-200/50">
      PRO
    </span>
  );
}
```

### Componente FeatureGate

```tsx
// src/components/ui/feature-gate.tsx
"use client";

import { UpgradeBadge } from "./upgrade-badge";

type Props = {
  planTier: string;
  requiredPlan: "PRO";
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureGate({ planTier, requiredPlan, children, fallback }: Props) {
  if (planTier === requiredPlan || planTier === "PRO") {
    return <>{children}</>;
  }

  return fallback ?? (
    <div className="relative opacity-50 pointer-events-none select-none">
      <div className="absolute top-2 right-2 z-10">
        <UpgradeBadge />
      </div>
      {children}
    </div>
  );
}
```

### Modal de Upgrade

```tsx
// src/components/ui/upgrade-modal.tsx
"use client";

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  feature 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  feature: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
          Función Premium
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          <strong>{feature}</strong> está disponible en el plan PRO. 
          Actualiza tu cuenta para desbloquear todas las funciones.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="...">Cerrar</button>
          <a href="/dashboard/billing" className="...">Ver Planes</a>
        </div>
      </div>
    </div>
  );
}
```

### Uso en Sidebar

```tsx
// En el sidebar, items PRO muestran badge
<NavItem 
  href="/dashboard/integrations" 
  label="Google Calendar"
  badge={planTier === "FREE" ? <UpgradeBadge /> : null}
  disabled={planTier === "FREE"}
/>
```

---

## 5. Branding en Portal Público

```tsx
// En /[slug]/page.tsx footer
{!professional.config.removeBranding && (
  <footer className="...">
    <span>Powered by <a href="https://miapp.com">My Appointment</a></span>
  </footer>
)}
```

El tenant PRO con `removeBranding: true` no muestra el footer de branding.

---

## Tareas de Implementación

- [ ] Crear `src/lib/plan-limits.ts`
- [ ] Crear `src/lib/plan-guard.ts`
- [ ] Integrar `canCreateAppointment()` en `createAppointment` action
- [ ] Integrar `canCreateClient()` en upsert de clientes
- [ ] Integrar `canCreateLocation()` en `createLocation` action
- [ ] Integrar `canCreateStaff()` en `createStaff` action
- [ ] Integrar `canUseFeature()` en Google Calendar connect
- [ ] Crear componentes UI: `UpgradeBadge`, `FeatureGate`, `UpgradeModal`
- [ ] Actualizar sidebar con badges PRO
- [ ] Condicionar branding en portal público
- [ ] Crear página `/dashboard/billing` (enlaza a Stripe)
