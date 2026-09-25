import { PresetRecommendation } from "./types";

export const CATEGORIES = [
  { id: "salud", label: "Salud y Medicina", icon: "🩺", desc: "Psicología, medicina, odontología, nutrición, terapias" },
  { id: "belleza", label: "Belleza y Estética", icon: "💇", desc: "Barberías, salones, spas, uñas, centros estéticos" },
  { id: "bienestar", label: "Bienestar y Coaching", icon: "🧘", desc: "Masajes, terapias alternativas, coaching personal" },
  { id: "fitness", label: "Fitness y Deportes", icon: "🏋️", desc: "Entrenamiento personal, gimnasios, yoga, pilates" },
  { id: "educacion", label: "Educación y Clases", icon: "🎓", desc: "Tutorías, academias, idiomas, clases particulares" },
  { id: "profesionales", label: "Servicios Profesionales", icon: "💼", desc: "Consultorías, abogados, contadores, asesorías" },
  { id: "servicios", label: "Servicios Técnicos", icon: "📸", desc: "Fotografía, talleres, reparaciones, mantenimiento" },
  { id: "espacios", label: "Espacios y Canchas", icon: "🏟️", desc: "Canchas deportivas, salas de reuniones, estudios" },
  { id: "otro", label: "Otro Tipo de Negocio", icon: "✨", desc: "Cualquier otra actividad con agenda o reservas" },
];

export const PRESETS_CATALOG: Record<string, PresetRecommendation[]> = {
  salud: [
    {
      id: "psicologia",
      category: "salud",
      subCategory: "psicologia",
      title: "Psicología y Salud Mental",
      icon: "🧠",
      suggestedBookingItemType: "session",
      defaultTerminology: {
        client: "Paciente",
        appointment: "Sesión",
        service: "Tipo de Sesión",
        staff: "Terapeuta",
        location: "Consultorio",
      },
      suggestedServices: [
        { name: "Terapia Individual", duration: 50, bufferTime: 10, price: 45, description: "Sesión psicológica individualizada" },
        { name: "Terapia de Pareja", duration: 60, bufferTime: 15, price: 60, description: "Sesión orientada a parejas y vínculos" },
        { name: "Primera Consulta / Evaluación", duration: 60, bufferTime: 10, price: 50, description: "Entrevista inicial y diagnóstico" },
      ],
      suggestedQuestions: [
        { name: "es_primera_vez", label: "¿Es tu primera consulta con nosotros?", type: "boolean", required: true },
        { name: "motivo_consulta", label: "¿Cuál es el motivo principal de tu consulta?", type: "textarea", required: true },
      ],
      recommendedCapabilities: {
        clinicalRecords: true,
        customForms: true,
      },
    },
    {
      id: "medicina_general",
      category: "salud",
      subCategory: "medicina_general",
      title: "Medicina General / Especialidades",
      icon: "🩺",
      suggestedBookingItemType: "service",
      defaultTerminology: {
        client: "Paciente",
        appointment: "Consulta",
        service: "Consulta / Especialidad",
        staff: "Médico / Especialista",
        location: "Consultorio",
        resource: "Consultorio",
      },
      suggestedServices: [
        { name: "Consulta Médica General", duration: 30, bufferTime: 10, price: 40, description: "Revisión clínica y prescripción" },
        { name: "Consulta de Seguimiento", duration: 20, bufferTime: 10, price: 25, description: "Control y revisión de estudios" },
      ],
      suggestedQuestions: [
        { name: "sintomas_principales", label: "¿Qué síntomas o molestias presentas?", type: "textarea", required: true },
        { name: "alergias_medicamentos", label: "¿Tienes alguna alergia a medicamentos?", type: "text", required: false },
      ],
      recommendedCapabilities: {
        clinicalRecords: true,
        customForms: true,
      },
    },
    {
      id: "veterinaria",
      category: "salud",
      subCategory: "veterinaria",
      title: "Veterinaria y Cuidado Animal",
      icon: "🐾",
      suggestedBookingItemType: "service",
      defaultTerminology: {
        client: "Dueño / Tutor",
        appointment: "Cita",
        service: "Servicio Veterinario",
        staff: "Veterinario",
        location: "Clínica",
      },
      suggestedServices: [
        { name: "Consulta Veterinaria", duration: 30, bufferTime: 10, price: 25, description: "Chequeo general de la mascota" },
        { name: "Vacunación y Desparasitación", duration: 20, bufferTime: 10, price: 20, description: "Aplicación de cuadro preventivo" },
      ],
      suggestedQuestions: [
        { name: "nombre_mascota", label: "Nombre de la mascota", type: "text", required: true },
        { name: "especie_raza", label: "Especie y Raza (ej. Perro Golden)", type: "text", required: true },
      ],
      recommendedCapabilities: {
        clinicalRecords: true,
        customForms: true,
      },
    },
  ],
  belleza: [
    {
      id: "barberia",
      category: "belleza",
      subCategory: "barberia",
      title: "Barbería Tradicional o Moderna",
      icon: "💈",
      suggestedBookingItemType: "service",
      defaultTerminology: {
        client: "Cliente",
        appointment: "Cita",
        service: "Servicio",
        staff: "Barbero",
        location: "Sucursal",
      },
      suggestedServices: [
        { name: "Corte de Cabello", duration: 30, bufferTime: 5, price: 15, description: "Corte clásico o degradado + peinado" },
        { name: "Corte + Arreglo de Barba", duration: 50, bufferTime: 10, price: 25, description: "Corte completo y perfilado con toalla caliente" },
        { name: "Perfilado de Barba", duration: 20, bufferTime: 5, price: 10, description: "Diseño y afeitado de barba" },
      ],
      suggestedQuestions: [],
      recommendedCapabilities: {
        staff: true,
        staffSelection: true,
        clinicalRecords: false,
      },
    },
    {
      id: "salon_belleza",
      category: "belleza",
      subCategory: "salon_belleza",
      title: "Salón de Belleza / Estética / Uñas",
      icon: "💅",
      suggestedBookingItemType: "service",
      defaultTerminology: {
        client: "Cliente",
        appointment: "Cita",
        service: "Servicio",
        staff: "Estilista / Especialista",
        location: "Sucursal",
      },
      suggestedServices: [
        { name: "Manicura Rusa / Gelish", duration: 60, bufferTime: 10, price: 30, description: "Limpieza profunda y esmaltado semipermanente" },
        { name: "Pedicura Spa", duration: 50, bufferTime: 10, price: 35, description: "Tratamiento completo de pies" },
        { name: "Corte y Estilizado", duration: 45, bufferTime: 10, price: 25, description: "Lavado, corte y peinado profesional" },
      ],
      suggestedQuestions: [],
      recommendedCapabilities: {
        staff: true,
        staffSelection: true,
        clinicalRecords: false,
      },
    },
  ],
  fitness: [
    {
      id: "entrenamiento_personal",
      category: "fitness",
      subCategory: "entrenamiento_personal",
      title: "Entrenador Personal / Fitness",
      icon: "🏋️",
      suggestedBookingItemType: "session",
      defaultTerminology: {
        client: "Alumno",
        appointment: "Entrenamiento",
        service: "Tipo de Sesión",
        staff: "Entrenador",
        location: "Estudio / Gimnasio",
      },
      suggestedServices: [
        { name: "Sesión 1 a 1 de Entrenamiento", duration: 60, bufferTime: 10, price: 35, description: "Entrenamiento funcional o pesas personalizado" },
        { name: "Evaluación Física y Plan", duration: 45, bufferTime: 10, price: 40, description: "Mediciones corporales y rutina a medida" },
      ],
      suggestedQuestions: [
        { name: "objetivo_fitness", label: "¿Cuál es tu objetivo principal? (ej. Perder peso, ganar músculo)", type: "text", required: true },
        { name: "lesiones_previas", label: "¿Tienes alguna lesión o condición médica?", type: "text", required: false },
      ],
      recommendedCapabilities: {
        clinicalRecords: false,
        customForms: true,
      },
    },
  ],
  espacios: [
    {
      id: "canchas_deportivas",
      category: "espacios",
      subCategory: "canchas_deportivas",
      title: "Canchas de Pádel / Fútbol / Tenis",
      icon: "🎾",
      suggestedBookingItemType: "space",
      defaultTerminology: {
        client: "Cliente",
        appointment: "Reserva",
        service: "Modalidad de Cancha",
        staff: "Encargado",
        location: "Sede",
        resource: "Cancha",
      },
      suggestedServices: [
        { name: "Alquiler Cancha (60 min)", duration: 60, bufferTime: 0, price: 30, description: "Uso exclusivo de la cancha por 1 hora" },
        { name: "Alquiler Cancha (90 min)", duration: 90, bufferTime: 0, price: 45, description: "Partido completo de 1 hora y media" },
      ],
      suggestedQuestions: [],
      recommendedCapabilities: {
        resources: true,
        resourceSelection: true,
        staff: false,
        staffSelection: false,
        clinicalRecords: false,
      },
    },
  ],
  educacion: [
    {
      id: "tutorias",
      category: "educacion",
      subCategory: "tutorias",
      title: "Clases Particulares / Tutorías",
      icon: "📚",
      suggestedBookingItemType: "class",
      defaultTerminology: {
        client: "Estudiante / Padre",
        appointment: "Clase",
        service: "Materia / Nivel",
        staff: "Profesor / Tutor",
        location: "Academia",
      },
      suggestedServices: [
        { name: "Clase Individual (60 min)", duration: 60, bufferTime: 10, price: 20, description: "Resolución de dudas y apoyo académico" },
        { name: "Preparación para Examen", duration: 90, bufferTime: 15, price: 30, description: "Simulacro y repaso intensivo" },
      ],
      suggestedQuestions: [
        { name: "materia_tema", label: "¿Qué materia y temas específicos necesitas reforzar?", type: "text", required: true },
        { name: "nivel_educativo", label: "Nivel escolar (Primaria, Secundaria, Universidad)", type: "text", required: true },
      ],
      recommendedCapabilities: {
        staff: true,
        staffSelection: true,
        clinicalRecords: false,
      },
    },
  ],
  profesionales: [
    {
      id: "consultoria",
      category: "profesionales",
      subCategory: "consultoria",
      title: "Consultoría / Legal / Asesoría",
      icon: "💼",
      suggestedBookingItemType: "session",
      defaultTerminology: {
        client: "Cliente",
        appointment: "Asesoría",
        service: "Tipo de Asesoría",
        staff: "Consultor / Abogado",
        location: "Oficina",
      },
      suggestedServices: [
        { name: "Sesión de Asesoría Inicial (45 min)", duration: 45, bufferTime: 15, price: 50, description: "Diagnóstico inicial y plan de acción" },
        { name: "Revisión Documental / Contratos", duration: 60, bufferTime: 15, price: 75, description: "Análisis y dictamen profesional" },
      ],
      suggestedQuestions: [
        { name: "tema_consulta", label: "Describe brevemente el tema o asunto a tratar", type: "textarea", required: true },
      ],
      recommendedCapabilities: {
        clinicalRecords: false,
        customForms: true,
      },
    },
  ],
  otro: [
    {
      id: "negocio_general",
      category: "otro",
      subCategory: "general",
      title: "Servicios Generales",
      icon: "🗓️",
      suggestedBookingItemType: "service",
      defaultTerminology: {
        client: "Cliente",
        appointment: "Cita",
        service: "Servicio",
        staff: "Responsable",
        location: "Ubicación",
      },
      suggestedServices: [
        { name: "Servicio Estándar", duration: 30, bufferTime: 10, price: 25, description: "Atención regular" },
        { name: "Servicio Extendido", duration: 60, bufferTime: 15, price: 50, description: "Atención completa" },
      ],
      suggestedQuestions: [],
      recommendedCapabilities: {
        clinicalRecords: false,
      },
    },
  ],
};

export const CATEGORIES_LIST = CATEGORIES.map((c) => ({
  id: c.id,
  name: c.label,
  description: c.desc,
  icon: c.icon,
}));

export const ALL_PRESETS_FLAT: PresetRecommendation[] = Object.values(PRESETS_CATALOG).flat();

export function getPresetForCategory(category: string, subCategory?: string): PresetRecommendation {
  const categoryPresets = PRESETS_CATALOG[category.toLowerCase()] || PRESETS_CATALOG["otro"];
  if (subCategory) {
    const matched = categoryPresets.find(
      (p) =>
        p.subCategory.toLowerCase() === subCategory.toLowerCase() ||
        p.id.toLowerCase() === subCategory.toLowerCase()
    );
    if (matched) return matched;
  }
  return categoryPresets[0] || PRESETS_CATALOG["otro"][0];
}

export function getPresetById(idOrSubCategory: string): PresetRecommendation | undefined {
  if (!idOrSubCategory) return undefined;
  const target = idOrSubCategory.toLowerCase();
  return ALL_PRESETS_FLAT.find(
    (p) => p.id.toLowerCase() === target || p.subCategory.toLowerCase() === target
  );
}

