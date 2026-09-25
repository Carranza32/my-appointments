export type BusinessCapabilities = {
  // Servicios & Catálogo
  services: boolean;
  multipleServices: boolean;
  serviceModality: {
    presencial: boolean;
    online: boolean;
    domicilio: boolean;
  };

  // Personal / Especialistas
  staff: boolean;
  staffSelection: boolean;
  staffServiceAssignment: boolean;

  // Sedes y Ubicaciones Físicas
  locations: boolean;
  multipleLocations: boolean;

  // Recursos Físicos (Canchas, Cabinas, Salas, Equipos)
  resources: boolean;
  resourceSelection: boolean;

  // Pagos & Finanzas
  payments: boolean;
  paymentMode: "UPFRONT" | "LATER" | "BOTH" | "NONE";

  // Captura de Información del Cliente
  customForms: boolean;

  // Módulos Especializados
  clinicalRecords: boolean;
};

export type OnboardingServiceDraft = {
  id: string;
  name: string;
  duration: number; // en minutos
  bufferTime: number; // en minutos
  price: number;
  currency?: string;
  description?: string;
  requiresPayment?: boolean;
  assignedStaffNames?: string[];
  assignedResourceNames?: string[];
  modality?: "presencial" | "online" | "domicilio" | "hybrid";
};

export type OnboardingStaffDraft = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  assignedServiceNames: string[];
};

export type OnboardingLocationDraft = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
};

export type OnboardingResourceDraft = {
  id: string;
  name: string;
  type: string; // "CONSULTORIO" | "CABINA" | "CANCHA" | "SALA" | "SILLON" | "EQUIPO" | "GENERAL"
  locationName?: string;
};

export type OnboardingFormFieldDraft = {
  name: string;
  label: string;
  type: "text" | "tel" | "email" | "textarea" | "select" | "boolean";
  required: boolean;
  options?: string[];
};

export type OnboardingAnswers = {
  // 1. Identidad
  businessName: string;
  slug: string;
  category: string;
  subCategory?: string;
  customCategoryDescription?: string;

  // 2. Modelo de Prestación
  bookingItemType: "service" | "person" | "space" | "class" | "session" | "other";
  teamStructure: "solo" | "team_selectable" | "team_assigned" | "not_sure";
  modality: "presencial" | "online" | "domicilio" | "hybrid";

  // 3. Infraestructura Física
  locationType: "single" | "multiple" | "none_online" | "none_domicilio";
  locationsList: OnboardingLocationDraft[];
  usesPhysicalResources: "yes" | "no" | "not_sure";
  resourceTypeLabel?: string;
  resourcesList: OnboardingResourceDraft[];

  // 4. Catálogo de Servicios
  servicesList: OnboardingServiceDraft[];

  // 5. Equipo de Trabajo
  staffList: OnboardingStaffDraft[];

  // 6. Horarios Semanales
  weeklyHours: Array<{
    day: number; // 0: Dom, 1: Lun, ..., 6: Sáb
    slots: Array<{ open: string; close: string }>;
  }>;

  // 7. Pagos
  paymentPreference: "upfront" | "later" | "both" | "none";

  // 8. Preguntas al Cliente
  clientFields: OnboardingFormFieldDraft[];

  // 9. Módulos Especiales
  enableClinicalModule: boolean;
};

export type OnboardingDraft = {
  userId: string;
  currentStepId: string;
  completedStepIds: string[];
  answers: OnboardingAnswers;
  inferredCapabilities: BusinessCapabilities;
  lastUpdated: string;
  isFinished: boolean;
};

export type PresetRecommendation = {
  id: string;
  category: string;
  subCategory: string;
  title: string;
  icon: string;
  suggestedBookingItemType: "service" | "person" | "space" | "class" | "session";
  defaultTerminology: {
    client: string;
    appointment: string;
    service: string;
    staff: string;
    location: string;
    resource?: string;
  };
  suggestedServices: Array<{
    name: string;
    duration: number;
    bufferTime: number;
    price: number;
    description?: string;
  }>;
  suggestedQuestions: OnboardingFormFieldDraft[];
  recommendedCapabilities: Partial<BusinessCapabilities>;
};
