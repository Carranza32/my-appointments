# 07 — Módulos Pendientes (Landing, Legal, Analytics, Widget)

## Módulos que faltan para un lanzamiento completo

---

## A. Landing Page + Precios

### Ruta: `/` (página raíz)

La landing page actual muestra algo básico. Necesita convertirse en una página de venta profesional del SaaS.

### Secciones de la Landing

```
1. Hero Section
   - Headline: "Gestiona tus citas sin esfuerzo"
   - Subheadline: "El sistema de reservas que funciona para cualquier profesional"
   - CTA: "Empieza Gratis" → /signup
   - Screenshot/demo del dashboard

2. Social Proof
   - Logos de rubros: Médicos, Salones, Consultores, Fitness...
   - Estadísticas: "500+ profesionales confían en nosotros"

3. Features
   - Portal público personalizable
   - Calendario inteligente
   - CRM automático
   - Google Calendar sync
   - WhatsApp reminders
   - Formularios dinámicos

4. Rubros
   - Cards de cada rubro con íconos
   - "Funciona para cualquier negocio basado en citas"

5. Pricing
   - Tabla FREE vs PRO (ver 03-plan-limits)
   - Toggle mensual/anual
   - CTAs: "Comenzar Gratis" / "Activar PRO"

6. Testimonials (placeholder inicialmente)

7. FAQ
   - ¿Necesito tarjeta para el plan gratis?
   - ¿Puedo cambiar de plan?
   - ¿Mis datos están seguros?
   - ¿Funciona con Google Calendar?

8. Footer
   - Links: Términos, Privacidad, Soporte, API Status
   - Redes sociales (placeholder)
```

### Archivos a crear

```
src/app/(marketing)/
├── layout.tsx          → Layout sin sidebar (diferente al dashboard)
├── page.tsx            → Landing page
├── pricing/
│   └── page.tsx        → Página de precios dedicada
└── about/
    └── page.tsx        → Sobre nosotros (opcional)
```

> **Nota:** El grupo `(marketing)` usa un layout diferente al dashboard.

---

## B. Páginas Legales

### Obligatorio antes de lanzar

```
src/app/(marketing)/
├── terminos/
│   └── page.tsx        → Términos de Servicio
├── privacidad/
│   └── page.tsx        → Política de Privacidad
└── cookies/
    └── page.tsx        → Política de Cookies (opcional)
```

### Contenido mínimo de Términos

1. Descripción del servicio
2. Cuentas de usuario y responsabilidades
3. Planes y facturación
4. Uso aceptable
5. Limitación de responsabilidad
6. Terminación de cuenta
7. Modificaciones a los términos
8. Ley aplicable y jurisdicción

### Contenido mínimo de Privacidad

1. Qué datos recopilamos
2. Cómo usamos los datos
3. Con quién compartimos datos
4. Cookies y tecnologías de seguimiento
5. Retención de datos
6. Derechos del usuario (acceso, eliminación)
7. Seguridad de datos
8. Contacto del responsable de datos

### Checkbox de consentimiento

En el formulario de signup y en el portal de reserva:
```tsx
<label className="flex items-start gap-2">
  <input type="checkbox" required />
  <span className="text-xs text-slate-500">
    Acepto los <a href="/terminos">Términos de Servicio</a> y la{" "}
    <a href="/privacidad">Política de Privacidad</a>
  </span>
</label>
```

---

## C. Analytics Dashboard (PRO)

### Ruta: `/dashboard/analytics`

Página con reportes para que el tenant entienda su negocio.

### Métricas

```
┌──────────────────────────────────────────────────┐
│ Analytics                        [Mes ▼] [2026]  │
├──────────────────────────────────────────────────┤
│                                                   │
│ KPIs principales:                                 │
│ ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌───────┐│
│ │Citas     │ │No-shows  │ │Clientes   │ │Ingresos│
│ │este mes  │ │(canceladas│ │nuevos     │ │cobrados│
│ │142       │ │ )  8 (6%)│ │23         │ │$42,500││
│ └─────────┘ └──────────┘ └───────────┘ └───────┘│
│                                                   │
│ 📊 Citas por día (gráfica de barras)              │
│ 📊 Distribución por estado (pie chart)            │
│ 📊 Horarios más populares (heatmap)               │
│ 📊 Servicios más solicitados (horizontal bars)    │
│ 📊 Ingresos por mes (line chart)                  │
│                                                   │
│ 🏆 Top clientes (tabla: nombre, citas, ingresos)  │
│ 📊 Tasa de retención de clientes                  │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Implementación

- Usar datos reales de Prisma (aggregaciones)
- No necesita librería de charts externa: usar CSS bars o canvas básico
- Si se quiere algo más rico: usar `recharts` (React charts library)
- Gate: Solo PRO (FREE ve un preview borroso con CTA de upgrade)

---

## D. Widget Embebible (PRO, futuro)

### Concepto

Un script JavaScript que el tenant puede pegar en su sitio web externo (WordPress, Wix, etc.) para mostrar el botón/calendario de reservas.

### Flujo

```
1. Tenant copia el snippet desde /dashboard/settings
2. Lo pega en su sitio web
3. Se renderiza un botón "Reservar Cita"
4. Al hacer click, abre un iframe/modal con el portal de reservas
```

### Snippet

```html
<!-- My Appointment Widget -->
<script src="https://miapp.com/widget.js" data-slug="barberia-xyz"></script>
```

### Implementación

```javascript
// public/widget.js
(function() {
  const slug = document.currentScript.getAttribute('data-slug');
  const btn = document.createElement('button');
  btn.textContent = 'Reservar Cita';
  btn.style.cssText = '...estilos...';
  btn.onclick = () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://miapp.com/${slug}?embed=true`;
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;border:none;';
    document.body.appendChild(iframe);
  };
  document.currentScript.parentNode.insertBefore(btn, document.currentScript);
})();
```

> **Prioridad baja:** Implementar después de tener los módulos core.

---

## E. Bloqueo de Días (Vacaciones/Feriados)

### Modelo

```prisma
model BlockedDate {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime // La fecha bloqueada
  reason    String?  // "Vacaciones", "Feriado", etc.
  createdAt DateTime @default(now())

  @@unique([userId, date])
  @@index([userId, date])
}
```

### Integración en disponibilidad

```typescript
// En getAvailableSlots()
const blocked = await prisma.blockedDate.findFirst({
  where: {
    userId: professional.id,
    date: {
      gte: startOfLocalDay(date),
      lte: endOfLocalDay(date),
    },
  },
});

if (blocked) {
  return { slots: [], meta: { ...meta, blocked: true, reason: blocked.reason } };
}
```

### UI en Settings

Un mini-calendario donde el tenant marca días como "bloqueados". Similar a como funciona Google Calendar pero más simple.

---

## Resumen de Prioridades

| Módulo | Prioridad | Complejidad | Dependencia |
|---|---|---|---|
| Landing Page | 🔴 Alta | Media | Ninguna |
| Páginas Legales | 🔴 Alta | Baja | Ninguna |
| Plan Limits (módulo 03) | 🔴 Alta | Media | Ninguna |
| Stripe (módulo 04) | 🔴 Alta | Alta | Plan Limits |
| Super Admin (módulo 05) | 🟡 Media | Media | Ninguna |
| Servicios Múltiples (módulo 06) | 🟡 Media | Alta | Plan Limits |
| Analytics Dashboard | 🟡 Media | Media | Plan Limits |
| Bloqueo de Días | 🟢 Baja | Baja | Ninguna |
| Widget Embebible | 🟢 Baja | Media | Plan Limits |

---

## Orden de Ejecución Recomendado

```
Semana 1:  Plan Limits + Rubros (módulos 02, 03) → base para todo lo demás
Semana 2:  Stripe Integration (módulo 04) → monetización lista
Semana 3:  Landing Page + Legal → puedes recibir usuarios
Semana 4:  Super Admin (módulo 05) → puedes monitorear
Semana 5:  Servicios Múltiples (módulo 06) → valor agregado
Semana 6:  Analytics + Bloqueo de Días → polish
```
