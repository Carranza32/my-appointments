import { OnboardingAnswers } from "./types";

export type StepId =
  | "identity"
  | "category"
  | "workflow"
  | "team"
  | "location"
  | "resources"
  | "services"
  | "schedule"
  | "payments"
  | "questions"
  | "summary";

export type StepDefinition = {
  id: StepId;
  title: string;
  description: string;
  shouldShow: (answers: OnboardingAnswers) => boolean;
  canAdvance: (answers: OnboardingAnswers) => boolean;
  getNextStepId?: (answers: OnboardingAnswers) => StepId | null;
  getPrevStepId?: (answers: OnboardingAnswers) => StepId | null;
};

export const ALL_STEPS: StepId[] = [
  "identity",
  "category",
  "workflow",
  "team",
  "location",
  "resources",
  "services",
  "schedule",
  "payments",
  "questions",
  "summary",
];

export const STEPS_CONFIG: Record<StepId, StepDefinition> = {
  identity: {
    id: "identity",
    title: "¿Cómo se llama tu negocio?",
    description: "Elige el nombre y el enlace personalizado de tu portal de reservas.",
    shouldShow: () => true,
    canAdvance: (answers) =>
      Boolean(answers.businessName?.trim().length >= 2) &&
      Boolean(answers.slug?.trim().length >= 3),
  },
  category: {
    id: "category",
    title: "¿A qué sector pertenece tu actividad?",
    description: "Te recomendaremos servicios y configuraciones adaptadas a tu modelo de atención.",
    shouldShow: () => true,
    canAdvance: (answers) => Boolean(answers.category),
  },
  workflow: {
    id: "workflow",
    title: "Modelo de Operación e Infraestructura",
    description: "Indícanos cómo trabaja tu equipo y la estructura física de tu negocio.",
    shouldShow: () => true,
    canAdvance: (answers) => Boolean(answers.teamStructure),
  },
  team: {
    id: "team",
    title: "Equipo y Especialistas",
    description: "Agrega a las personas que atienden o prestan los servicios en tu negocio.",
    shouldShow: (answers) => answers.teamStructure !== "solo",
    canAdvance: (answers) => answers.teamStructure === "solo" || answers.staffList.length > 0,
  },
  location: {
    id: "location",
    title: "Sedes y Ubicación",
    description: "Configura las direcciones de atención física de tu negocio.",
    shouldShow: (answers) =>
      answers.locationType === "single" || answers.locationType === "multiple",
    canAdvance: (answers) =>
      answers.locationType !== "multiple" || answers.locationsList.length > 0,
  },
  resources: {
    id: "resources",
    title: "Espacios, Canchas o Cabinas",
    description: "Configura los recursos físicos que requieren control de disponibilidad.",
    shouldShow: (answers) => answers.usesPhysicalResources === "yes",
    canAdvance: (answers) =>
      answers.usesPhysicalResources !== "yes" || answers.resourcesList.length > 0,
  },
  services: {
    id: "services",
    title: "Catálogo de Servicios y Precios",
    description: "Revisa y personaliza los servicios que tus clientes podrán agendar.",
    shouldShow: () => true,
    canAdvance: (answers) => (answers.servicesList?.length || 0) > 0,
  },
  schedule: {
    id: "schedule",
    title: "Horario Semanal de Atención",
    description: "Define los días y rangos horarios en los que tu negocio está disponible.",
    shouldShow: () => true,
    canAdvance: (answers) =>
      (answers.weeklyHours || []).some((d) => (d.slots || []).length > 0),
  },
  payments: {
    id: "payments",
    title: "Modalidad de Cobros",
    description: "Selecciona cómo deseas gestionar los pagos de tus citas y servicios.",
    shouldShow: () => true,
    canAdvance: (answers) => Boolean(answers.paymentPreference),
  },
  questions: {
    id: "questions",
    title: "Formulario de Reserva del Cliente",
    description: "Campos o información requerida antes de confirmar la cita.",
    shouldShow: () => true,
    canAdvance: (answers) => (answers.clientFields?.length || 0) > 0,
  },
  summary: {
    id: "summary",
    title: "Así quedará tu sistema",
    description: "Revisa el resumen final y activa tu portal de reservas en un instante.",
    shouldShow: () => true,
    canAdvance: () => true,
  },
};

export function getVisibleSteps(answers: OnboardingAnswers): StepDefinition[] {
  return ALL_STEPS.map((id) => STEPS_CONFIG[id]).filter((step) =>
    step.shouldShow(answers)
  );
}

export function canAdvance(stepId: string, answers: OnboardingAnswers): boolean {
  const step = STEPS_CONFIG[stepId as StepId];
  if (!step) return true;
  return step.canAdvance(answers);
}

export function calculateProgress(
  currentStepId: string,
  answers: OnboardingAnswers
): {
  currentIdx: number;
  totalSteps: number;
  percentage: number;
} {
  const visible = getVisibleSteps(answers);
  const currentIdx = Math.max(
    0,
    visible.findIndex((s) => s.id === currentStepId)
  );
  const totalSteps = visible.length;
  const percentage = Math.round(((currentIdx + 1) / Math.max(totalSteps, 1)) * 100);
  return { currentIdx: currentIdx + 1, totalSteps, percentage };
}
