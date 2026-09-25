# 00 — Visión General del Sistema

## ¿Qué es My Appointment?

**My Appointment** es un SaaS multi-tenant de agendamiento de citas que permite a cualquier profesional independiente o pequeña empresa gestionar sus reservas de forma autónoma. Cada tenant (cliente del SaaS) obtiene su propio portal público, panel administrativo y gestión de datos completamente aislada.

---

## Modelo de Negocio

```
┌──────────────────────────────────────────────────────────┐
│                    TÚ (Super Admin)                      │
│   Panel central: ve todos los tenants, métricas, pagos   │
└────────────────────────┬─────────────────────────────────┘
                         │
          ┌──────────────┼──────────────────┐
          │              │                  │
   ┌──────▼──────┐ ┌─────▼──────┐ ┌────────▼────────┐
   │  Tenant A   │ │  Tenant B  │ │   Tenant C      │
   │  (Dentista) │ │  (Barbería)│ │  (Psicólogo)    │
   │  FREE Plan  │ │  PRO Plan  │ │  PRO Plan       │
   │             │ │            │ │                  │
   │ ┌─────────┐ │ │ ┌────────┐ │ │ ┌──────────────┐│
   │ │ Sede 1  │ │ │ │ Sede 1 │ │ │ │ Sede Virtual ││
   │ │(dueño)  │ │ │ │ Staff 3│ │ │ │ (dueño)      ││
   │ └─────────┘ │ │ │ Sede 2 │ │ │ └──────────────┘│
   │             │ │ │ Staff 2│ │ │                  │
   └──────┬──────┘ │ └────────┘ │ └────────┬────────┘
          │        └──────┬─────┘          │
          ▼               ▼                ▼
  dentista.miapp.com barberia.miapp.com  psicologo.miapp.com
  (reserva directa)  ├── /juan           (reserva directa)
                     ├── /pedro
                     └── /maria
                     (staff con slug PRO)
```

---

## Arquitectura Multi-Tenant

### Estrategia: Tenant-per-Row (Schema compartido)

Se usa **un único schema de base de datos** donde cada registro está vinculado a un `userId` (el tenant). Esto es lo más práctico para un SaaS temprano porque:

- ✅ Una sola base de datos PostgreSQL
- ✅ Migraciones simples (un solo Prisma schema)
- ✅ Bajo costo operativo
- ✅ Fácil de escalar a schema-per-tenant si crece masivamente
- ✅ Aislamiento por queries (`WHERE userId = ?`)

### Identificación de Tenants

| Aspecto | Solución |
|---|---|
| **Acceso al dashboard** | Login en `miapp.com/login` → el `userId` en sesión es el tenant |
| **Portal público** | Subdominio `negocio.miapp.com` → middleware resuelve al tenant |
| **Staff individual** | Path `negocio.miapp.com/staff-slug` → PRO feature |
| **Separación de datos** | Cada tabla tiene `userId` como FK → siempre filtrar por él |
| **Costo de subdominios** | $0 extra — wildcard DNS + Vercel automático |

---

## Rubros: Generalización vs Personalización

### Filosofía: Core genérico + Plugins de rubro

El sistema base funciona igual para TODOS los rubros. La personalización por rubro se limita a:

1. **Formulario de reserva dinámico** (`formFields` en JSON) — ya implementado ✅
2. **Plantillas de campos predeterminados** por rubro — ya implementado ✅  
3. **Fichas clínicas** (solo para rubros de salud) — ya implementado ✅
4. **Labels dinámicos** (ej: "Paciente" vs "Cliente" vs "Alumno")

### Rubros Iniciales y Expansión

```
Fase 1 (actual):    SALUD | BELLEZA | CONSULTORIA
Fase 2 (próxima):   FITNESS | EDUCACION | VETERINARIA | LEGAL
Fase 3 (futuro):    CUSTOM (el tenant define su propio rubro)
```

> **Clave:** El enum `Rubro` en Prisma se puede reemplazar por un String libre + un catálogo de rubros con configs predeterminadas. Esto permite que nuevos rubros se agreguen sin migración de BD.

---

## Planes: FREE vs PRO

### Matriz de Features

| Feature | FREE | PRO |
|---|:---:|:---:|
| Portal público de reservas | ✅ | ✅ |
| Citas por mes | 30 | ∞ |
| Clientes en CRM | 50 | ∞ |
| Subdominio propio (`negocio.miapp.com`) | ✅ | ✅ |
| Sedes | 1 | ∞ |
| Staff con slug propio | ❌ (solo el dueño) | ✅ Múltiples staff con su URL |
| Formularios dinámicos | Solo predeterminados | Custom ilimitados |
| Sincronización Google Calendar | ❌ | ✅ |
| Emails transaccionales | Básico (confirmación) | Todos |
| Recordatorios WhatsApp | ❌ | ✅ |
| Branding removible | ❌ (muestra "Powered by") | ✅ |
| Fichas clínicas | ❌ | ✅ |
| Múltiples servicios | ❌ | ✅ |
| Reportes/Analytics | Básico | Completo |
| Pagos en reserva (Stripe Connect) | ❌ | ✅ |
| Widget embebible | ❌ | ✅ |
| Soporte prioritario | ❌ | ✅ |

### Implementación de Límites

```typescript
// src/lib/plan-limits.ts
export const PLAN_LIMITS = {
  FREE: {
    maxAppointmentsPerMonth: 30,
    maxClients: 50,
    maxLocations: 1,
    maxStaff: 0,
    googleCalendar: false,
    whatsappReminders: false,
    removeBranding: false,
    clinicalRecords: false,
    customFormFields: false,
    multipleServices: false,
  },
  PRO: {
    maxAppointmentsPerMonth: Infinity,
    maxClients: Infinity,
    maxLocations: Infinity,
    maxStaff: Infinity,
    googleCalendar: true,
    whatsappReminders: true,
    removeBranding: true,
    clinicalRecords: true,
    customFormFields: true,
    multipleServices: true,
  },
} as const;
```

---

## Estado Actual del Proyecto (Lo que YA existe)

### ✅ Completado
- Autenticación (Supabase Auth + middleware)
- Onboarding (slug, nombre, rubro)
- Dashboard principal con métricas
- Calendario completo (Día/Semana/Mes)
- Portal público de reservas `/[slug]`
- Gestión de disponibilidad (slots dinámicos)
- Sincronización Google Calendar (bidireccional)
- CRM de clientes + fichas clínicas
- Sedes (Location CRUD)
- Personal/Staff CRUD con horarios propios
- Emails transaccionales (Resend)
- WhatsApp reminders (Twilio)
- Cancelación de citas por el cliente
- Settings: horarios, perfil, integraciones

### 🔴 Falta (Bloqueante para lanzar)
1. **Sistema de plan-limits** — middleware que enforce FREE vs PRO
2. **Stripe Integration** — checkout, webhooks, billing portal
3. **Super Admin Panel** — tu dashboard central para ver todos los tenants
4. **Landing Page + Precios** — la página de venta del SaaS
5. **Páginas legales** — términos y privacidad

### 🟡 Mejoras Prioritarias (Post-lanzamiento)
6. **Servicios múltiples** — catálogo de servicios con duración/precio individual
7. **Bloqueo de días** — feriados, vacaciones  
8. **Rubros expandidos** — FITNESS, EDUCACION, etc.
9. **Analytics dashboard** — reportes para el tenant

### 🔵 Diferenciadores Premium (Mes 2-3)
10. **Stripe Connect** — cobros en la reserva  
11. **Widget embebible** — script para sitios externos
12. **Subdominio personalizado** — tenant.miapp.com
13. **App móvil / PWA** — notificaciones push

---

## Índice de Documentos del Plan

| # | Archivo | Módulo |
|---|---|---|
| 00 | `00-vision-general.md` | Este documento |
| 01 | `01-multi-tenancy.md` | Arquitectura multi-tenant y aislamiento de datos |
| 02 | `02-rubros-y-personalizacion.md` | Sistema de rubros genéricos y personalización |
| 03 | `03-plan-limits-y-feature-flags.md` | Sistema FREE/PRO y control de features |
| 04 | `04-stripe-pagos.md` | Integración de pagos y suscripciones |
| 05 | `05-super-admin.md` | Panel de administración central (tu panel) |
| 06 | `06-servicios-multiples.md` | Catálogo de servicios por tenant |
| 07 | `07-modulos-pendientes.md` | Landing page, legal, analytics, widget |
