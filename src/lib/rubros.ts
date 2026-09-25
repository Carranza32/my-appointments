import { FormFieldDef } from "./form-fields";

export type RubroConfig = {
  id: string;
  label: string;
  icon: string;           // Lucide icon name or emoji
  description: string;
  clientLabel: string;     // "Paciente" | "Cliente" | "Alumno"
  appointmentLabel: string; // "Consulta" | "Sesión" | "Clase"
  defaultFormFields: FormFieldDef[];
  enableClinicalRecords: boolean;
  suggestedServices: { name: string; duration: number; price: number }[];
};

export const RUBRO_CATALOG: Record<string, RubroConfig> = {
  PSICOLOGIA: {
    id: "PSICOLOGIA",
    label: "Psicología y Salud Mental",
    icon: "🧠",
    description: "Psicólogos, terapeutas, psiquiatras, consejeros",
    clientLabel: "Paciente",
    appointmentLabel: "Sesión",
    enableClinicalRecords: true,
    defaultFormFields: [
      { name: "motivo", label: "Motivo de la consulta", type: "textarea", required: true },
      { name: "primeraVez", label: "¿Es tu primera vez en terapia?", type: "select", required: true, options: ["Sí", "No"] },
    ],
    suggestedServices: [
      { name: "Terapia Individual (Presencial)", duration: 50, price: 600 },
      { name: "Terapia Individual (Online)", duration: 50, price: 550 },
      { name: "Terapia de Pareja", duration: 80, price: 900 },
      { name: "Evaluación Psicológica", duration: 60, price: 700 },
    ],
  },

  SALUD: {
    id: "SALUD",
    label: "Salud y Medicina",
    icon: "🩺",
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
    icon: "💇",
    description: "Salones, barberías, spas, uñas, pestañas",
    clientLabel: "Cliente",
    appointmentLabel: "Cita",
    enableClinicalRecords: false,
    defaultFormFields: [
      { name: "tipoCorte", label: "Tipo de corte o servicio", type: "select", required: true,
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
    icon: "💼",
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
    icon: "🏋️",
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
    icon: "🎓",
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
    icon: "🐾",
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
    icon: "⚖️",
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
    icon: "🗓️",
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
  if (!rubro) return RUBRO_CATALOG.GENERAL;
  const normalized = rubro.toUpperCase();
  if (RUBRO_CATALOG[normalized]) {
    return RUBRO_CATALOG[normalized];
  }

  // Check prefix matching (e.g., SALUD_PSICOLOGIA -> SALUD or PSICOLOGIA)
  const rootCategory = normalized.split("_")[0];
  if (rootCategory && RUBRO_CATALOG[rootCategory]) {
    return RUBRO_CATALOG[rootCategory];
  }

  // Check subcategory keyword matching
  if (normalized.includes("PSICO")) return RUBRO_CATALOG.PSICOLOGIA;
  if (normalized.includes("SALUD") || normalized.includes("MEDIC")) return RUBRO_CATALOG.SALUD;
  if (normalized.includes("BELLEZA") || normalized.includes("BARBER") || normalized.includes("SPA")) return RUBRO_CATALOG.BELLEZA;
  if (normalized.includes("FITNESS") || normalized.includes("DEPORTE") || normalized.includes("PADEL")) return RUBRO_CATALOG.FITNESS;
  if (normalized.includes("EDU") || normalized.includes("CLASE") || normalized.includes("TUTOR")) return RUBRO_CATALOG.EDUCACION;
  if (normalized.includes("VET") || normalized.includes("CANIN")) return RUBRO_CATALOG.VETERINARIA;
  if (normalized.includes("LEGAL") || normalized.includes("ABOGAD")) return RUBRO_CATALOG.LEGAL;
  if (normalized.includes("CONSULT")) return RUBRO_CATALOG.CONSULTORIA;

  return RUBRO_CATALOG.GENERAL;
}

export function getAllRubros(): RubroConfig[] {
  return Object.values(RUBRO_CATALOG);
}
