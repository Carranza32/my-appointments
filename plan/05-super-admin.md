# 05 — Super Admin Panel (Tu Panel Central)

## Resumen

Como dueño del SaaS, necesitas un panel separado donde puedas:
- Ver todos tus tenants (clientes del SaaS)
- Monitorear métricas globales
- Gestionar planes manualmente
- Ver ingresos y suscripciones
- Soporte y troubleshooting

---

## Arquitectura

### Opción recomendada: Rutas protegidas por rol

No crear un proyecto separado. En su lugar, agregar rutas `/admin/*` protegidas por un campo `role` en el modelo User.

**Cambio en Prisma:**
```prisma
enum UserRole {
  TENANT    // Usuario normal (profesional que compra el SaaS)
  ADMIN     // Tú, el dueño del SaaS
}

model User {
  // ... campos existentes ...
  role    UserRole  @default(TENANT)
}
```

**Middleware de protección:**
```typescript
// src/lib/admin-guard.ts
import { getProfessional } from "./auth";

export async function requireAdmin() {
  const professional = await getProfessional();
  if (!professional || professional.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return professional;
}
```

---

## Estructura de Rutas

```
/admin
├── /admin              → Dashboard global (métricas)
├── /admin/tenants      → Lista de todos los tenants
├── /admin/tenants/[id] → Detalle de un tenant
├── /admin/revenue      → Ingresos y suscripciones
└── /admin/settings     → Configuración global del SaaS
```

**Layout del admin:**
```
/src/app/admin/
├── layout.tsx          → Verifica role=ADMIN, sidebar propio
├── page.tsx            → Dashboard global
├── tenants/
│   ├── page.tsx        → Lista de tenants
│   └── [id]/
│       └── page.tsx    → Detalle de tenant
├── revenue/
│   └── page.tsx        → Revenue dashboard
└── settings/
    └── page.tsx        → Config global
```

---

## 1. Dashboard Global (`/admin`)

### Métricas principales

```
┌──────────────────────────────────────────────────────────────┐
│                    Admin Dashboard                            │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Total    │ Tenants  │ Tenants  │ Citas    │ MRR             │
│ Tenants  │ FREE     │ PRO      │ Hoy      │ (Ingresos Mes)  │
│ 156      │ 124      │ 32       │ 2,847    │ $9,568 MXN      │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│                                                              │
│  📊 Gráfica: Tenants registrados por semana (últimos 3 meses)│
│  📊 Gráfica: Citas creadas por día (últimos 30 días)         │
│  📊 Gráfica: Conversión FREE → PRO                          │
│                                                              │
│  🔔 Últimos registros:                                       │
│    - "Dr. García" se registró hace 2h (SALUD, FREE)          │
│    - "Barbería XYZ" upgradó a PRO hace 5h                    │
│    - "Nutrióloga Martínez" canceló su PRO                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Server action para métricas globales

```typescript
// src/actions/admin.ts
"use server";

import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function getAdminDashboardStats() {
  await requireAdmin();

  const [
    totalTenants,
    freeTenants,
    proTenants,
    totalAppointments,
    todayAppointments,
    totalClients,
    recentTenants,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.user.count({ where: { role: "TENANT", planTier: "FREE" } }),
    prisma.user.count({ where: { role: "TENANT", planTier: "PRO" } }),
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.client.count(),
    prisma.user.findMany({
      where: { role: "TENANT" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, rubro: true, planTier: true, createdAt: true },
    }),
  ]);

  return {
    totalTenants,
    freeTenants,
    proTenants,
    totalAppointments,
    todayAppointments,
    totalClients,
    recentTenants,
    mrr: proTenants * 299, // MXN, ajustar al precio real
  };
}
```

---

## 2. Lista de Tenants (`/admin/tenants`)

### Tabla con filtros y búsqueda

| Nombre | Email | Rubro | Plan | Citas | Clientes | Registro | Acciones |
|---|---|---|---|---|---|---|---|
| Dr. García | dr@email.com | SALUD | PRO ⭐ | 234 | 89 | 2026-01-15 | Ver / Editar |
| Barbería XYZ | barb@email.com | BELLEZA | FREE | 12 | 8 | 2026-03-20 | Ver / Editar |

### Filtros disponibles
- Por plan (FREE / PRO / Todos)
- Por rubro
- Búsqueda por nombre o email
- Ordenar por: fecha de registro, total de citas, total de clientes

### Acciones por tenant
- **Ver portal**: abre `/[slug]` en nueva pestaña
- **Cambiar plan**: upgrade/downgrade manual
- **Desactivar**: suspender la cuenta
- **Impersonar**: (futuro) ver el dashboard como si fueras ese tenant

---

## 3. Detalle de Tenant (`/admin/tenants/[id]`)

```
┌──────────────────────────────────────────────────┐
│ Dr. Carlos García                                 │
│ dr.garcia@email.com · Rubro: SALUD · Plan: PRO   │
│ Slug: dr-garcia · Registro: 15 Ene 2026          │
├──────────────────────────────────────────────────┤
│ Métricas:                                         │
│   Citas totales: 234   Clientes: 89               │
│   Sedes: 2             Staff: 3                   │
│   Citas este mes: 42   Google Calendar: ✅        │
│   Stripe Customer: cus_xxx                        │
├──────────────────────────────────────────────────┤
│ Acciones rápidas:                                 │
│   [Ver Portal] [Cambiar Plan] [Enviar Email]      │
│   [Desactivar Cuenta]                             │
└──────────────────────────────────────────────────┘
```

---

## 4. Revenue Dashboard (`/admin/revenue`)

- MRR (Monthly Recurring Revenue)
- Gráfica de ingresos por mes
- Lista de suscriptores PRO activos
- Conversión: cuántos FREE → PRO
- Churn: cuántos PRO → FREE (cancelaron)

> **Nota:** Los datos de revenue vienen de Stripe API + datos locales.

---

## Seguridad

1. **Layout guard**: El layout de `/admin` verifica `role === ADMIN` antes de renderizar
2. **Action guard**: Cada server action de admin usa `requireAdmin()`
3. **No visible en sidebar**: Las rutas `/admin` no aparecen en el sidebar normal del tenant
4. **Acceso directo**: Solo tú (con role=ADMIN en la BD) puedes acceder

---

## Tareas de Implementación

- [ ] Agregar `role` (TENANT/ADMIN) al modelo User en Prisma
- [ ] Crear migración de BD para el campo `role`
- [ ] Crear `src/lib/admin-guard.ts`
- [ ] Crear layout `/admin/layout.tsx` con guard y sidebar propio
- [ ] Crear `/admin/page.tsx` — Dashboard global
- [ ] Crear `src/actions/admin.ts` — Actions de métricas y CRUD
- [ ] Crear `/admin/tenants/page.tsx` — Lista de tenants
- [ ] Crear `/admin/tenants/[id]/page.tsx` — Detalle de tenant
- [ ] Crear `/admin/revenue/page.tsx` — Revenue dashboard
- [ ] Marcar tu usuario como ADMIN en la BD manualmente
- [ ] Agregar enlace `/admin` en el navbar (solo si role=ADMIN)
