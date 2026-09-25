# 06 — Servicios Múltiples (Catálogo de Servicios)

## Resumen

Actualmente un tenant ofrece "una cita" genérica con una sola duración. Este módulo permite que cada tenant defina un catálogo de servicios con duración y precio individual.

**Ejemplo real:**  
Una barbería ofrece: Corte ($250, 30min), Barba ($150, 20min), Corte+Barba ($350, 45min), Tinte ($800, 90min)

---

## Modelo de Datos

### Nueva tabla: Service

```prisma
model Service {
  id           String        @id @default(uuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  description  String?
  duration     Int           // Duración en minutos
  price        Float         @default(0)
  currency     String        @default("MXN")
  isActive     Boolean       @default(true)
  sortOrder    Int           @default(0)
  appointments Appointment[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([userId])
}
```

### Cambio en Appointment

```prisma
model Appointment {
  // ... campos existentes ...
  serviceId  String?
  service    Service?  @relation(fields: [serviceId], references: [id], onDelete: SetNull)
}
```

### Cambio en User

```prisma
model User {
  // ... campos existentes ...
  services   Service[]
}
```

---

## Flujo en el Portal Público

```
1. Cliente entra a miapp.com/barberia-xyz
2. VE: Lista de servicios disponibles (tarjetas con nombre, precio, duración)
3. SELECCIONA: "Corte + Barba" ($350, 45min)
4. VE: Calendario con días disponibles
5. SELECCIONA: Día → se generan slots de 45min (duración del servicio)
6. COMPLETA: Formulario de datos + pregunta dinámica del rubro
7. CONFIRMA: Se crea la cita con serviceId vinculado
```

**Sin servicios (Plan FREE o sin configurar):**
```
1. Cliente entra a miapp.com/dentista
2. VE: Calendario directamente (como funciona hoy)
3. Duración: usa slotDuration de BusinessConfig
```

---

## Flujo en el Dashboard

### Página: /dashboard/servicios (CRUD)

```
┌──────────────────────────────────────────────────┐
│ Mis Servicios                          [+ Nuevo] │
├──────────────────────────────────────────────────┤
│                                                   │
│ ┌─────────────────────────────┐ ┌───────────────┐│
│ │ 🔵 Corte de Cabello        │ │ 🔵 Barba      ││
│ │    30 min · $250 MXN       │ │    20min · $150││
│ │    ✅ Activo                │ │    ✅ Activo   ││
│ │    [Editar] [Desactivar]   │ │    [Editar]   ││
│ └─────────────────────────────┘ └───────────────┘│
│                                                   │
│ ┌─────────────────────────────┐ ┌───────────────┐│
│ │ 🔵 Corte + Barba           │ │ 🔵 Tinte      ││
│ │    45 min · $350 MXN       │ │    90min · $800││
│ │    ✅ Activo                │ │    ✅ Activo   ││
│ │    [Editar] [Desactivar]   │ │    [Editar]   ││
│ └─────────────────────────────┘ └───────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

### Integración con Citas

Cuando se muestra una cita en el calendario o en el dashboard, ahora dice:
- "Corte de Cabello" en vez de "Consulta"
- Precio: $250 MXN
- Duración: 30 min

---

## Compatibilidad con Plan FREE

| Acción | FREE | PRO |
|---|---|---|
| Servicios configurados | 1 máximo (servicio default) | Ilimitados |
| Selector de servicio en portal | No se muestra (va directo al calendario) | Se muestra |
| Duración de cita | `slotDuration` de BusinessConfig | Duración del servicio seleccionado |

### Lógica de fallback

```typescript
// Si el tenant tiene servicios configurados y activos, usarlos
// Si no, usar slotDuration de BusinessConfig como "servicio único"

const services = await prisma.service.findMany({
  where: { userId: tenant.userId, isActive: true },
  orderBy: { sortOrder: "asc" },
});

if (services.length > 0 && canUseFeature(tenant.planTier, 'multipleServices').allowed) {
  // Mostrar selector de servicios en el portal
} else {
  // Flujo actual: calendario directo con slotDuration
}
```

---

## Auto-Population desde Rubros

Al completar el onboarding, si el rubro tiene `suggestedServices`, se crean automáticamente:

```typescript
// En completeOnboarding()
const rubroConfig = getRubroConfig(input.rubro);

if (rubroConfig.suggestedServices.length > 0) {
  await prisma.service.createMany({
    data: rubroConfig.suggestedServices.map((s, i) => ({
      userId: authUser.id,
      name: s.name,
      duration: s.duration,
      price: s.price,
      sortOrder: i,
    })),
  });
}
```

---

## Tareas de Implementación

- [ ] Crear modelo `Service` en Prisma schema
- [ ] Agregar relación `serviceId` en `Appointment`
- [ ] Crear migración de BD
- [ ] Crear `src/actions/services.ts` (CRUD)
- [ ] Crear página `/dashboard/servicios/page.tsx`
- [ ] Crear componente `service-manager.tsx`
- [ ] Actualizar portal público para mostrar selector de servicios
- [ ] Actualizar `getAvailableSlots()` para usar duración del servicio
- [ ] Actualizar `createAppointment()` para aceptar `serviceId`
- [ ] Auto-popular servicios sugeridos en onboarding
- [ ] Mostrar nombre del servicio en citas del calendario
- [ ] Gate: FREE no puede crear más de 1 servicio
