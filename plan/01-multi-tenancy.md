# 01 — Multi-Tenancy: Arquitectura y Aislamiento de Datos

## Resumen

El sistema usa **tenant-per-row** en un schema PostgreSQL compartido. Cada profesional que se registra es un **tenant** con su propio espacio de datos aislado por `userId`.

**Cambio clave vs plan anterior:** Los subdominios son la forma principal de acceso al portal público desde el día 1. No son "futuro PRO" — son la base del sistema.

---

## Nueva Arquitectura: Subdominio = Negocio, Slug = Staff

### Estructura de URLs

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUBDOMINIO = El negocio (tenant)                                   │
│  Todos los tenants tienen subdominio. Es GRATIS. Es su identidad.  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  clinica-garcia.miapp.com                                           │
│  ├── /              → Portal del negocio (info + reserva directa)   │
│  ├── /dr-carlos     → Reservar con staff específico (PRO)           │
│  └── /dra-lopez     → Reservar con otro staff (PRO)                 │
│                                                                     │
│  barberia-xyz.miapp.com                                             │
│  ├── /              → Reserva directa (solo 1 persona, FREE)       │
│  │                                                                   │
│  psicologo-luna.miapp.com                                           │
│  ├── /              → Reserva directa (profesional independiente)   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

vs la app principal:

  miapp.com             → Landing page (marketing)
  miapp.com/login       → Login
  miapp.com/dashboard   → Dashboard del tenant autenticado
  miapp.com/admin       → Super admin (tu panel)
```

### FREE vs PRO en esta estructura

| Aspecto | FREE | PRO |
|---|---|---|
| Subdominio propio (`negocio.miapp.com`) | ✅ Sí, desde el onboarding | ✅ Sí |
| Portal en `/` (reserva directa) | ✅ Siempre funciona | ✅ Siempre funciona |
| Staff slugs (`/dr-carlos`, `/dra-lopez`) | ❌ Solo el dueño (sin slug) | ✅ Múltiples staff con su propio slug |
| Selector de staff en portal | ❌ No se muestra | ✅ "¿Con quién quieres tu cita?" |

### Flujo según plan

**FREE (1 persona):**
```
Cliente visita: barberia-xyz.miapp.com
→ Ve el perfil del negocio
→ Selecciona fecha y hora
→ Completa el formulario
→ Cita creada (asignada al dueño automáticamente)
```

**PRO (múltiples staff):**
```
Opción A — Acceso directo al staff:
  Cliente visita: clinica-garcia.miapp.com/dr-carlos
  → Ve el perfil de Dr. Carlos
  → Selecciona fecha y hora (horarios de Dr. Carlos)
  → Completa formulario → Cita creada con staffId = dr-carlos

Opción B — Acceso general al negocio:
  Cliente visita: clinica-garcia.miapp.com
  → Ve el perfil del negocio
  → "¿Con quién deseas tu cita?" → lista de staff disponible
  → Selecciona "Dr. Carlos"
  → Selecciona fecha y hora → Cita creada
```

---

## ¿Aumentan los costos con subdominios?

### **No.** Los costos son exactamente iguales.

| Recurso | Costo | Detalle |
|---|---|---|
| DNS wildcard (`*.miapp.com`) | $0 | Un solo registro CNAME en tu proveedor de DNS |
| Wildcard SSL | $0 | Vercel lo genera automáticamente con Let's Encrypt |
| Vercel hosting | Mismo | Es la misma app Next.js, solo cambia el hostname del request |
| Base de datos | Mismo | Misma BD, mismas queries, solo cambia cómo se resuelve el tenant |

**¿Por qué no cuesta más?**
- Es la **misma aplicación** Next.js sirviendo todos los subdominios
- El middleware lee `request.headers.get("host")` → extrae el subdominio → hace un rewrite interno
- No se crea ningún servidor nuevo por tenant
- No se crea ningún certificado SSL individual

### Configuración necesaria (una sola vez)

```
1. DNS: Agregar registro CNAME *.miapp.com → cname.vercel-dns.com
2. Vercel: Agregar dominio *.miapp.com al proyecto
3. Listo — todos los subdominios funcionan automáticamente
```

---

## Implementación Técnica

### 1. Cambio en el Modelo de Datos

El `slug` del User ahora es el **subdominio**, no una ruta:

```prisma
model User {
  id     String  @id @default(uuid())
  slug   String  @unique   // "clinica-garcia" → clinica-garcia.miapp.com
  // ...
}

model Staff {
  id     String  @id @default(uuid())
  slug   String?           // "dr-carlos" → clinica-garcia.miapp.com/dr-carlos
  // ...
}
```

**Cambio en Staff:** Agregar campo `slug` al modelo Staff para que cada empleado tenga su URL única dentro del subdominio del negocio.

### 2. Middleware: Resolver subdominio → tenant

```typescript
// middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// El dominio principal de la app (sin subdominio)
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "miapp.com";

// Dominios que NO son subdominios de tenant
const SYSTEM_DOMAINS = [
  `www.${ROOT_DOMAIN}`,
  ROOT_DOMAIN,
  "localhost:3000",
  "localhost",
];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  
  const hostname = request.headers.get("host") || "";
  
  // Si es el dominio principal → dejar pasar (landing, login, dashboard, admin)
  if (SYSTEM_DOMAINS.some(d => hostname === d || hostname.startsWith(d))) {
    return response;
  }
  
  // Extraer subdominio: "clinica-garcia.miapp.com" → "clinica-garcia"
  // En localhost: "clinica-garcia.localhost:3000" → "clinica-garcia"
  let subdomain: string | null = null;
  
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
  } else if (hostname.includes(".localhost")) {
    subdomain = hostname.split(".localhost")[0];
  }
  
  if (!subdomain) {
    return response;
  }
  
  // Rewrite: clinica-garcia.miapp.com/dr-carlos 
  //       → /_tenant/clinica-garcia/dr-carlos (ruta interna)
  const path = request.nextUrl.pathname;
  const url = request.nextUrl.clone();
  url.pathname = `/_tenant/${subdomain}${path}`;
  
  return NextResponse.rewrite(url, { headers: response.headers });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 3. Ruta interna: `/_tenant/[subdomain]/[...path]`

```
src/app/_tenant/
├── [subdomain]/
│   ├── page.tsx              → Portal del negocio (reserva directa o selector de staff)
│   └── [staffSlug]/
│       └── page.tsx          → Portal de staff específico
```

**Nota:** El prefijo `_tenant` con guión bajo hace que Next.js no lo exponga como ruta pública directa. Solo se accede vía el rewrite del middleware.

```typescript
// src/app/_tenant/[subdomain]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ subdomain: string }>;
};

export default async function TenantPortalPage({ params }: Props) {
  const { subdomain } = await params;
  
  const professional = await prisma.user.findUnique({
    where: { slug: subdomain },
    include: {
      config: true,
      locations: { orderBy: { name: "asc" } },
      staff: { where: { isActive: true }, orderBy: { name: "asc" } },
    },
  });

  if (!professional?.config) notFound();

  const hasMultipleStaff = professional.staff.length > 0 
    && professional.planTier === "PRO";

  if (hasMultipleStaff) {
    // PRO: Mostrar perfil del negocio + selector de staff
    return <BusinessPortalWithStaffSelector professional={professional} />;
  }

  // FREE o solo 1 persona: Reserva directa con el dueño
  return <DirectBookingPortal professional={professional} />;
}
```

```typescript
// src/app/_tenant/[subdomain]/[staffSlug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ subdomain: string; staffSlug: string }>;
};

export default async function StaffBookingPage({ params }: Props) {
  const { subdomain, staffSlug } = await params;
  
  const professional = await prisma.user.findUnique({
    where: { slug: subdomain },
    include: { config: true },
  });

  if (!professional?.config) notFound();
  
  // Solo PRO puede tener staff slugs
  if (professional.planTier !== "PRO") notFound();

  const staff = await prisma.staff.findFirst({
    where: { 
      userId: professional.id, 
      slug: staffSlug,
      // isActive: true,  // cuando se agregue el campo
    },
  });

  if (!staff) notFound();

  return <StaffBookingPortal professional={professional} staff={staff} />;
}
```

### 4. Migración de la ruta `/[slug]` existente

La ruta actual `/[slug]` se mantiene como **redirect** al subdominio:

```typescript
// src/app/[slug]/page.tsx → se convierte en redirect
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function LegacySlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const professional = await prisma.user.findUnique({
    where: { slug: slug.trim().toLowerCase() },
  });

  if (!professional) notFound();

  // Redirect permanente al subdominio
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "miapp.com";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  redirect(`${protocol}://${slug}.${rootDomain}`);
}
```

---

## Desarrollo Local con Subdominios

En desarrollo, los subdominios en `localhost` requieren configuración especial:

### Opción A: Usar `/etc/hosts` (simple)

```bash
# /etc/hosts
127.0.0.1  miapp.localhost
127.0.0.1  clinica-garcia.miapp.localhost
127.0.0.1  barberia-xyz.miapp.localhost
```

Desventaja: hay que agregar cada subdominio manualmente.

### Opción B: Usar `lvh.me` (recomendado)

`lvh.me` es un dominio público que resuelve a `127.0.0.1`. Funciona con subdominios sin configuración:

```
http://clinica-garcia.lvh.me:3000    → Tu app local
http://barberia-xyz.lvh.me:3000      → Tu app local
```

Solo hay que ajustar `ROOT_DOMAIN` en `.env.local`:
```env
NEXT_PUBLIC_ROOT_DOMAIN=lvh.me:3000
```

### Opción C: Usar `nip.io`

Similar a `lvh.me`, el dominio `127.0.0.1.nip.io` resuelve a localhost:
```
http://clinica-garcia.127.0.0.1.nip.io:3000
```

---

## Capa de Autorización Centralizada

### Helper `withTenant()`

```typescript
// src/lib/tenant.ts
import { getProfessional, requireAuth } from "@/lib/auth";
import { PlanTier } from "@prisma/client";

export type TenantContext = {
  userId: string;
  email: string;
  name: string;
  slug: string;          // El subdominio del negocio
  planTier: PlanTier;
  configId: string;
  rubro: string;
};

export async function withTenant(): Promise<TenantContext> {
  await requireAuth();
  const professional = await getProfessional();
  
  if (!professional?.config) {
    throw new Error("TENANT_NOT_CONFIGURED");
  }

  return {
    userId: professional.id,
    email: professional.email,
    name: professional.name,
    slug: professional.slug,
    planTier: professional.planTier,
    configId: professional.config.id,
    rubro: professional.rubro,
  };
}
```

### Resolver tenant desde subdominio (para portal público)

```typescript
// src/lib/tenant.ts (complemento)
export async function resolveTenantBySubdomain(subdomain: string) {
  const professional = await prisma.user.findUnique({
    where: { slug: subdomain.trim().toLowerCase() },
    include: { config: true },
  });

  if (!professional?.config) return null;

  return {
    userId: professional.id,
    name: professional.name,
    slug: professional.slug,
    planTier: professional.planTier,
    rubro: professional.rubro,
    config: professional.config,
  };
}
```

---

## Flujo de Datos Completo

```
Tenant (User)
│
│  slug = "clinica-garcia" → clinica-garcia.miapp.com
│
├── Location[] (sedes del tenant)
│   └── Cada cita puede pertenecer a una sede
│
├── Staff[] (empleados del tenant, PRO)
│   ├── slug = "dr-carlos" → clinica-garcia.miapp.com/dr-carlos
│   ├── slug = "dra-lopez" → clinica-garcia.miapp.com/dra-lopez
│   └── Cada staff tiene sus propios horarios
│
├── Client[] (clientes del tenant)
│   └── Se crean automáticamente al reservar
│   └── ClinicalRecord[] (ficha por cliente)
│
└── Appointment[]
    ├── userId (siempre = tenant)
    ├── locationId (opcional)
    ├── staffId (opcional, si PRO con múltiples staff)
    ├── serviceId (opcional, si tiene servicios configurados)
    ├── clientEmail (link al Client)
    └── clientMetadata (respuestas del formulario dinámico)
```

---

## Seguridad del Portal Público

1. Visitante accede a `clinica-garcia.miapp.com`
2. Middleware extrae subdominio → rewrite a `/_tenant/clinica-garcia`
3. Page busca `User WHERE slug = 'clinica-garcia'`
4. Se exponen SOLO: nombre, descripción, avatar, horarios, sedes, staff (nombres)
5. Al crear cita → se resuelve el tenant por subdominio
6. **Nunca** se expone: email del profesional, tokens de Google, datos de otros clientes

---

## Cambios en el Schema de Prisma

```prisma
model Staff {
  // ... campos existentes ...
  slug         String?           // NUEVO: URL path dentro del subdominio
  isActive     Boolean  @default(true)  // NUEVO: para desactivar sin borrar
  
  @@unique([userId, slug])        // NUEVO: slug único dentro del tenant
}
```

---

## Tareas de Implementación

### Prioridad 1: Middleware + Rutas (base)
- [ ] Configurar variable `NEXT_PUBLIC_ROOT_DOMAIN` en `.env`
- [ ] Reescribir `middleware.ts` con resolución de subdominios
- [ ] Crear estructura `src/app/_tenant/[subdomain]/page.tsx`
- [ ] Crear `src/app/_tenant/[subdomain]/[staffSlug]/page.tsx`
- [ ] Convertir `/[slug]/page.tsx` en redirect al subdominio
- [ ] Probar con `lvh.me:3000` en desarrollo local

### Prioridad 2: Tenant Context (seguridad)
- [ ] Crear `src/lib/tenant.ts` con helper `withTenant()`
- [ ] Crear `resolveTenantBySubdomain()` para portal público
- [ ] Refactorizar todas las server actions para usar `withTenant()`
- [ ] Documentar que toda nueva action DEBE usar `withTenant()`

### Prioridad 3: Staff Slugs (PRO)
- [ ] Agregar campo `slug` al modelo Staff en Prisma
- [ ] Agregar campo `isActive` al modelo Staff
- [ ] Agregar constraint `@@unique([userId, slug])` en Staff
- [ ] Crear migración de BD
- [ ] Actualizar CRUD de Staff para manejar slug
- [ ] En portal público PRO: mostrar selector de staff con links a sus slugs

### Prioridad 4: Producción
- [ ] Configurar DNS wildcard `*.miapp.com` → Vercel
- [ ] Agregar wildcard domain en Vercel project settings
- [ ] Verificar SSL automático
- [ ] (Futuro) Configurar RLS en Supabase como red de seguridad
