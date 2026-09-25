# 02 — Rubros y Personalización

## Problema Actual

El sistema usa un `enum Rubro` en Prisma con solo 3 valores fijos:

```prisma
enum Rubro {
  SALUD
  BELLEZA
  CONSULTORIA
}
```

Esto tiene limitaciones:
- Agregar un nuevo rubro requiere una migración de BD
- No se puede personalizar (un gym y un dentista son muy diferentes)
- No se pueden agregar rubros "custom" sin deploy

---

## Solución: Catálogo de Rubros + Config por Rubro

### Fase 1: Migración del enum a String + Catálogo

**Cambio en Prisma:**
```prisma
model User {
  // ...
  rubro    String   @default("GENERAL")  // Antes era enum Rubro
  // ...
}
```

**Catálogo de rubros en código (no en BD):**
```typescript
// src/lib/rubros.ts

export type RubroConfig = {
  id: string;
  label: string;
  icon: string;           // Lucide icon name
  description: string;
  clientLabel: string;     // "Paciente" | "Cliente" | "Alumno"
  appointmentLabel: string; // "Consulta" | "Sesión" | "Clase"
  defaultFormFields: FormFieldDef[];
  enableClinicalRecords: boolean;
  suggestedServices: { name: string; duration: number; price: number }[];
};

export const RUBRO_CATALOG: Record<string, RubroConfig> = {
  SALUD: {
    id: "SALUD",
    label: "Salud y Medicina",
    icon: "Stethoscope",
    description: "Médicos, dentistas, fisioterapeutas, nutriólogos",
    clientLabel: "Paciente",
    appointmentLabel: "Consulta",
    enableClinicalRecords: true,
    defaultFormFields: [
      { name: "motivo", label: "Motivo de la consulta", type: "textarea", required: true },
      { name: "alergias", label: "¿Tiene alergias?", type: "text", required: false },
    ],
    suggestedServices: [
      { name: "Consulta General", duration: 30, price: 500 },
      { name: "Revisión de Resultados", duration: 20, price: 300 },
      { name: "Procedimiento", duration: 60, price: 1500 },
    ],
  },

  BELLEZA: {
    id: "BELLEZA",
    label: "Belleza y Estética",
    icon: "Scissors",
    description: "Salones, barberías, spas, uñas, pestañas",
    clientLabel: "Cliente",
    appointmentLabel: "Cita",
    enableClinicalRecords: false,
    defaultFormFields: [
      { name: "servicio", label: "Tipo de servicio", type: "select", required: true,
        options: ["Corte", "Color", "Peinado", "Manicure", "Pedicure", "Otro"] },
    ],
    suggestedServices: [
      { name: "Corte de Cabello", duration: 30, price: 250 },
      { name: "Tinte Completo", duration: 90, price: 800 },
      { name: "Manicure", duration: 45, price: 200 },
    ],
  },

  CONSULTORIA: {
    id: "CONSULTORIA",
    label: "Consultoría y Coaching",
    icon: "Briefcase",
    description: "Consultores, coaches, mentores, asesores",
    clientLabel: "Cliente",
    appointmentLabel: "Sesión",
    enableClinicalRecords: false,
    defaultFormFields: [
      { name: "tema", label: "Tema de la sesión", type: "text", required: true },
      { name: "objetivo", label: "¿Qué esperas de esta sesión?", type: "textarea", required: false },
    ],
    suggestedServices: [
      { name: "Sesión Individual", duration: 60, price: 1000 },
      { name: "Sesión de Seguimiento", duration: 30, price: 600 },
    ],
  },

  FITNESS: {
    id: "FITNESS",
    label: "Fitness y Deporte",
    icon: "Dumbbell",
    description: "Entrenadores personales, gimnasios, yoga, pilates",
    clientLabel: "Alumno",
    appointmentLabel: "Clase",
    enableClinicalRecords: false,
    defaultFormFields: [
      { name: "nivel", label: "Nivel de experiencia", type: "select", required: true,
        options: ["Principiante", "Intermedio", "Avanzado"] },
      { name: "lesiones", label: "¿Tiene lesiones actuales?", type: "text", required: false },
    ],
    suggestedServices: [
      { name: "Entrenamiento Personal", duration: 60, price: 500 },
      { name: "Clase Grupal", duration: 45, price: 150 },
    ],
  },

  EDUCACION: {
    id: "EDUCACION",
    label: "Educación y Tutorías",
    icon: "GraduationCap",
    description: "Profesores, tutores, academias, clases particulares",
    clientLabel: "Estudiante",
    appointmentLabel: "Clase",
    enableClinicalRecords: false,
    defaultFormFields: [
      { name: "materia", label: "Materia o tema", type: "text", required: true },
      { name: "nivel", label: "Nivel académico", type: "select", required: true,
        options: ["Primaria", "Secundaria", "Preparatoria", "Universidad", "Posgrado"] },
    ],
    suggestedServices: [
      { name: "Clase Particular", duration: 60, price: 300 },
      { name: "Asesoría de Tesis", duration: 90, price: 500 },
    ],
  },

  VETERINARIA: {
    id: "VETERINARIA",
    label: "Veterinaria",
    icon: "PawPrint",
    description: "Veterinarios, peluquerías caninas, adiestradores",
    clientLabel: "Dueño",
    appointmentLabel: "Consulta",
    enableClinicalRecords: true,
    defaultFormFields: [
      { name: "mascota", label: "Nombre de la mascota", type: "text", required: true },
      { name: "especie", label: "Especie", type: "select", required: true,
        options: ["Perro", "Gato", "Ave", "Otro"] },
      { name: "motivo", label: "Motivo de la visita", type: "textarea", required: true },
    ],
    suggestedServices: [
      { name: "Consulta General", duration: 30, price: 400 },
      { name: "Vacunación", duration: 15, price: 250 },
      { name: "Baño y Corte", duration: 60, price: 350 },
    ],
  },

  LEGAL: {
    id: "LEGAL",
    label: "Servicios Legales",
    icon: "Scale",
    description: "Abogados, notarios, mediadores",
    clientLabel: "Cliente",
    appointmentLabel: "Consulta",
    enableClinicalRecords: false,
    defaultFormFields: [
      { name: "tipoCaso", label: "Tipo de caso", type: "select", required: true,
        options: ["Civil", "Penal", "Laboral", "Mercantil", "Familiar", "Otro"] },
      { name: "descripcion", label: "Descripción breve del caso", type: "textarea", required: true },
    ],
    suggestedServices: [
      { name: "Consulta Inicial", duration: 60, price: 800 },
      { name: "Revisión de Documentos", duration: 30, price: 500 },
    ],
  },

  GENERAL: {
    id: "GENERAL",
    label: "General / Otro",
    icon: "CalendarDays",
    description: "Cualquier negocio basado en citas",
    clientLabel: "Cliente",
    appointmentLabel: "Cita",
    enableClinicalRecords: false,
    defaultFormFields: [
      { name: "notas", label: "Notas adicionales", type: "textarea", required: false },
    ],
    suggestedServices: [
      { name: "Servicio Estándar", duration: 30, price: 0 },
    ],
  },
};

export function getRubroConfig(rubro: string): RubroConfig {
  return RUBRO_CATALOG[rubro] || RUBRO_CATALOG.GENERAL;
}

export function getAllRubros(): RubroConfig[] {
  return Object.values(RUBRO_CATALOG);
}
```

---

## Cómo Afecta al Sistema

### 1. Onboarding
El paso de "selecciona tu rubro" ahora muestra tarjetas con ícono y descripción del catálogo. Al seleccionar un rubro:
- Se crean los `formFields` predeterminados
- Se pre-populan los servicios sugeridos (cuando se implemente el módulo de servicios)
- Se configuran los labels (Paciente vs Cliente vs Alumno)

### 2. Portal Público
- La etiqueta del botón dice "Agendar Consulta" (SALUD) o "Reservar Cita" (BELLEZA) según el rubro
- Los formularios dinámicos cambian completamente

### 3. Dashboard
- Si `enableClinicalRecords = true` → se muestra la pestaña de fichas clínicas en el CRM
- Los labels se adaptan: "Tus Pacientes" vs "Tus Clientes"
- Los servicios sugeridos se muestran al crear el catálogo

### 4. Fichas Clínicas
- Solo visibles para rubros con `enableClinicalRecords: true`
- Actualmente: SALUD, VETERINARIA
- Esto ya está condicionado por rubro + plan PRO

---

## Labels Dinámicos: Helper

```typescript
// src/lib/labels.ts
import { getRubroConfig } from "./rubros";

export function getLabels(rubro: string) {
  const config = getRubroConfig(rubro);
  return {
    client: config.clientLabel,       // "Paciente" | "Cliente" | "Alumno"
    clients: `${config.clientLabel}s`, // "Pacientes" | "Clientes"
    appointment: config.appointmentLabel, // "Consulta" | "Cita" | "Clase"
    appointments: `${config.appointmentLabel}s`,
    bookAction: `Agendar ${config.appointmentLabel}`,
  };
}
```

---

## Tareas de Implementación

- [ ] Migrar `Rubro` de enum a String en Prisma
- [ ] Crear `src/lib/rubros.ts` con el catálogo completo
- [ ] Crear `src/lib/labels.ts` para labels dinámicos
- [ ] Actualizar onboarding para usar catálogo de rubros
- [ ] Actualizar `getDefaultFormFields()` para usar catálogo
- [ ] Pasar labels dinámicos al portal público y dashboard
- [ ] Condicionar fichas clínicas por `enableClinicalRecords` del rubro
- [ ] Actualizar sidebar y títulos con labels dinámicos
