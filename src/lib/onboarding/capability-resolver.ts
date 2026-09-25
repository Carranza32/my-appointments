import { BusinessCapabilities, OnboardingAnswers, PresetRecommendation } from "./types";
import { getPresetForCategory } from "./presets";

export const DEFAULT_WEEKLY_HOURS = [
  { day: 1, slots: [{ open: "09:00", close: "18:00" }] },
  { day: 2, slots: [{ open: "09:00", close: "18:00" }] },
  { day: 3, slots: [{ open: "09:00", close: "18:00" }] },
  { day: 4, slots: [{ open: "09:00", close: "18:00" }] },
  { day: 5, slots: [{ open: "09:00", close: "18:00" }] },
  { day: 6, slots: [{ open: "09:00", close: "14:00" }] },
  { day: 0, slots: [] },
];

export function createInitialOnboardingAnswers(userEmail: string = ""): OnboardingAnswers {
  return {
    businessName: "",
    slug: "",
    category: "belleza",
    subCategory: "barberia",
    bookingItemType: "service",
    teamStructure: "solo",
    modality: "presencial",
    locationType: "single",
    locationsList: [],
    usesPhysicalResources: "no",
    resourcesList: [],
    servicesList: [
      {
        id: "srv-1",
        name: "Servicio Principal",
        duration: 30,
        bufferTime: 5,
        price: 20,
        requiresPayment: false,
      },
    ],
    staffList: [],
    weeklyHours: DEFAULT_WEEKLY_HOURS,
    paymentPreference: "later",
    clientFields: [
      { name: "nombre", label: "Nombre Completo", type: "text", required: true },
      { name: "telefono", label: "Teléfono Móvil", type: "tel", required: true },
      { name: "email", label: "Correo Electrónico", type: "email", required: true },
    ],
    enableClinicalModule: false,
  };
}

export function resolveBusinessCapabilities(
  answers: OnboardingAnswers,
  preset?: PresetRecommendation
): BusinessCapabilities {
  const p = preset || getPresetForCategory(answers.category, answers.subCategory);

  const hasMultipleLocations = answers.locationType === "multiple" && (answers.locationsList?.length || 0) > 1;
  const isOnline = answers.modality === "online" || answers.modality === "hybrid" || answers.locationType === "none_online";
  const isDomicilio = answers.modality === "domicilio" || answers.locationType === "none_domicilio";
  const isPresencial = answers.modality === "presencial" || answers.modality === "hybrid" || answers.locationType === "single" || hasMultipleLocations;

  const hasStaff =
    answers.teamStructure === "team_selectable" ||
    answers.teamStructure === "team_assigned" ||
    (answers.staffList && answers.staffList.length > 0);

  const staffSelection = answers.teamStructure === "team_selectable";
  const hasResources = answers.usesPhysicalResources === "yes" && (answers.resourcesList?.length || 0) > 0;
  const resourceSelection = (answers.resourcesList?.length || 0) > 1;

  const hasServices = (answers.servicesList?.length || 0) > 0;
  const multipleServices = (answers.servicesList?.length || 0) > 1;

  const payments = answers.paymentPreference !== "none";
  let paymentMode: "UPFRONT" | "LATER" | "BOTH" | "NONE" = "LATER";
  if (answers.paymentPreference === "upfront") paymentMode = "UPFRONT";
  else if (answers.paymentPreference === "both") paymentMode = "BOTH";
  else if (answers.paymentPreference === "none") paymentMode = "NONE";

  const customForms = (answers.clientFields?.length || 0) > 0;
  const clinicalRecords = answers.category === "salud" && answers.enableClinicalModule === true;

  return {
    services: hasServices,
    multipleServices,
    serviceModality: {
      presencial: isPresencial,
      online: isOnline,
      domicilio: isDomicilio,
    },
    staff: !!hasStaff,
    staffSelection: !!staffSelection,
    staffServiceAssignment: answers.servicesList.some(
      (s) => s.assignedStaffNames && s.assignedStaffNames.length > 0
    ),
    locations: answers.locationType === "single" || answers.locationType === "multiple" || hasMultipleLocations,
    multipleLocations: hasMultipleLocations,
    resources: answers.usesPhysicalResources === "yes",
    resourceSelection,
    payments,
    paymentMode,
    customForms,
    clinicalRecords,
  };
}
