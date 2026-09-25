import { BusinessCapabilities } from "@/lib/onboarding/types";
import { getLabels } from "@/lib/labels";

export type BookingStepId =
  | "resource_first" // For court/space rental where Court is the primary choice
  | "service"
  | "modality"
  | "location"
  | "staff"
  | "resource"
  | "date"
  | "time"
  | "form"
  | "payment"
  | "done";

export type AdaptiveServiceItem = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  bufferTime: number;
  price: number;
  currency: string;
  staffIds: string[];
  requiresPayment?: boolean;
};

export type AdaptiveStaffItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string | null;
  avatarUrl: string | null;
  weeklyHours: any;
};

export type AdaptiveLocationItem = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
};

export type AdaptiveResourceItem = {
  id: string;
  name: string;
  type: string; // "CANCHA" | "CABINA" | "CONSULTORIO" | "SILLON" | "EQUIPO" | "SALA" | "GENERAL"
  locationId: string | null;
  isActive: boolean;
};

export type AdaptiveBusinessData = {
  slug: string;
  businessName: string;
  rubro: string;
  planTier: "FREE" | "PRO";
  services: AdaptiveServiceItem[];
  staff: AdaptiveStaffItem[];
  locations: AdaptiveLocationItem[];
  resources: AdaptiveResourceItem[];
  capabilities: BusinessCapabilities;
  config: {
    slotDuration: number;
    bufferTime: number;
    formFields: any[];
    acceptBankTransfer: boolean;
    bankName?: string | null;
    bankClabe?: string | null;
    bankHolder?: string | null;
    bankInstructions?: string | null;
    timezone: string;
    description?: string | null;
    avatarUrl?: string | null;
    whatsappNumber?: string | null;
    enableWhatsApp?: boolean;
    removeBranding?: boolean;
    coverUrl?: string | null;
    phone?: string | null;
    location?: string | null;
    themeColor?: string | null;
    modality?: string | null;
  };
};

export type BookingState = {
  serviceId: string | null;
  modality: "presencial" | "online" | null;
  locationId: string | null;
  staffId: string | null;
  resourceId: string | null;
  date: string | null; // "YYYY-MM-DD"
  time: string | null; // "HH:mm"
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientMetadata: Record<string, string>;
  paymentStatus: "PENDIENTE" | "PAGADO";
  paymentProofUrl?: string | null;
  createdAppointmentId?: string | null;
};

/**
 * Infiere capacidades a partir de entidades existentes en base de datos si no hay preset explícito.
 */
export function inferCapabilitiesFromEntities(params: {
  rubro: string;
  planTier: "FREE" | "PRO";
  services: AdaptiveServiceItem[];
  staff: AdaptiveStaffItem[];
  locations: AdaptiveLocationItem[];
  resources: AdaptiveResourceItem[];
  acceptBankTransfer?: boolean;
  formFields?: any[];
}): BusinessCapabilities {
  const { rubro, planTier, services, staff, locations, resources, acceptBankTransfer, formFields } = params;

  const hasMultipleLocations = locations.length > 1;
  const hasLocations = locations.length > 0;

  const anyServiceOnline = services.some((s) => {
    const text = `${s.name} ${s.description || ""}`.toLowerCase();
    return (
      text.includes("online") ||
      text.includes("virtual") ||
      text.includes("zoom") ||
      text.includes("meet") ||
      text.includes("videollamada")
    );
  });
  const rubroOnline = rubro.toUpperCase().includes("ONLINE") || rubro.toUpperCase().includes("CONSULTOR");

  let isOnline = false;
  let isPresencial = false;

  if (!hasLocations || rubroOnline) {
    isOnline = true;
    isPresencial = hasLocations;
  } else {
    isPresencial = true;
    isOnline = anyServiceOnline;
  }

  if (!isOnline && !isPresencial) {
    if (hasLocations) isPresencial = true;
    else isOnline = true;
  }

  const hasStaff = staff.length > 0;
  const staffSelection = planTier === "PRO" && staff.length > 0;
  const staffServiceAssignment = services.some((s) => s.staffIds && s.staffIds.length > 0);

  const hasResources = resources.length > 0;
  const resourceSelection = resources.length > 1;

  const hasServices = services.length > 0;
  const multipleServices = services.length > 1;

  const hasPaidServices = services.some((s) => s.price > 0 || s.requiresPayment);
  const payments = !!acceptBankTransfer || hasPaidServices;

  let paymentMode: "UPFRONT" | "LATER" | "BOTH" | "NONE" = "NONE";
  if (payments) {
    if (services.some((s) => s.requiresPayment) || acceptBankTransfer) {
      paymentMode = "UPFRONT";
    } else {
      paymentMode = "LATER";
    }
  }

  const customForms = (formFields?.length || 0) > 0;
  const clinicalRecords =
    rubro.toUpperCase().includes("SALUD") ||
    rubro.toUpperCase().includes("PSICO") ||
    rubro.toUpperCase().includes("MEDIC");

  return {
    services: hasServices,
    multipleServices,
    serviceModality: {
      presencial: isPresencial,
      online: isOnline,
      domicilio: false,
    },
    staff: hasStaff,
    staffSelection,
    staffServiceAssignment,
    locations: hasLocations,
    multipleLocations: hasMultipleLocations,
    resources: hasResources,
    resourceSelection,
    payments,
    paymentMode,
    customForms,
    clinicalRecords,
  };
}

/**
 * Inicializa el estado inicial de reserva con pre-selecciones automáticas de dependencias únicas.
 */
export function createInitialBookingState(
  data: AdaptiveBusinessData,
  requirements: BookingRequirements
): BookingState {
  const initialService = data.services.length === 1 ? data.services[0].id : null;
  const initialLocation = data.locations.length === 1 ? data.locations[0].id : null;

  let initialModality: "presencial" | "online" | null = null;
  if (data.capabilities.serviceModality.presencial && !data.capabilities.serviceModality.online) {
    initialModality = "presencial";
  } else if (data.capabilities.serviceModality.online && !data.capabilities.serviceModality.presencial) {
    initialModality = "online";
  } else if (!requirements.requiresModalitySelection) {
    initialModality = data.capabilities.serviceModality.presencial ? "presencial" : "online";
  }

  let initialStaffId: string | null = null;
  if (data.staff.length === 1) {
    initialStaffId = data.staff[0].id;
  }

  let initialResourceId: string | null = null;
  if (data.resources.length === 1) {
    initialResourceId = data.resources[0].id;
  }

  return {
    serviceId: initialService,
    modality: initialModality,
    locationId: initialLocation,
    staffId: initialStaffId,
    resourceId: initialResourceId,
    date: null,
    time: null,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientMetadata: {},
    paymentStatus: "PENDIENTE",
    paymentProofUrl: null,
    createdAppointmentId: null,
  };
}

export type BookingRequirements = {
  isSpaceFirst: boolean;
  requiresServiceSelection: boolean;
  requiresModalitySelection: boolean;
  requiresLocationSelection: boolean;
  requiresStaffSelection: boolean;
  requiresResourceSelection: boolean;
  requiresPayment: boolean;
  paymentMode: "UPFRONT" | "LATER" | "BOTH" | "NONE";
  requiresCustomForm: boolean;
};

/**
 * Determina los requerimientos reales del flujo de reserva según las capacidades y entidades existentes.
 */
export function resolveBookingRequirements(data: AdaptiveBusinessData): BookingRequirements {
  const { capabilities, services, staff, locations, resources, planTier } = data;

  // Si el rubro es de canchas/espacios y hay recursos disponibles, se puede priorizar la selección de cancha
  const isSpaceFirst =
    (data.rubro.toUpperCase().includes("ESPACIOS") ||
      data.rubro.toUpperCase().includes("CANCHA") ||
      data.rubro.toUpperCase().includes("PADEL")) &&
    resources.length > 0 &&
    staff.length === 0;

  const requiresServiceSelection = services.length > 1;

  // Requiere selección de modalidad si soporta tanto presencial como online
  const requiresModalitySelection =
    capabilities.serviceModality.presencial && capabilities.serviceModality.online;

  // Requiere selección de sede únicamente si tiene más de 1 sede física registrada
  const requiresLocationSelection =
    capabilities.locations && locations.length > 1;

  // Requiere selección de personal si el negocio tiene personal, está en plan PRO y tiene habilitada la selección
  const requiresStaffSelection =
    capabilities.staff &&
    capabilities.staffSelection &&
    planTier === "PRO" &&
    staff.length > 1;

  // Requiere selección de recurso si tiene más de 1 recurso físico disponible
  const requiresResourceSelection =
    capabilities.resources &&
    capabilities.resourceSelection &&
    resources.length > 1;

  const requiresPayment = capabilities.payments;
  const paymentMode = capabilities.paymentMode || "LATER";
  const requiresCustomForm = capabilities.customForms && data.config.formFields.length > 0;

  return {
    isSpaceFirst,
    requiresServiceSelection,
    requiresModalitySelection,
    requiresLocationSelection,
    requiresStaffSelection,
    requiresResourceSelection,
    requiresPayment,
    paymentMode,
    requiresCustomForm,
  };
}

/**
 * Filtra los especialistas compatibles con el servicio seleccionado según StaffService.
 */
export function filterCompatibleStaff(
  selectedService: AdaptiveServiceItem | null,
  allStaff: AdaptiveStaffItem[]
): AdaptiveStaffItem[] {
  if (!selectedService || allStaff.length === 0) return allStaff;
  if (!selectedService.staffIds || selectedService.staffIds.length === 0) {
    return allStaff; // Si no tiene asignación explícita, todos pueden prestarlo
  }
  return allStaff.filter((st) => selectedService.staffIds.includes(st.id));
}

/**
 * Filtra los recursos físicos compatibles con el servicio y la sede seleccionada.
 * Evita asignar canchas a masajes o cabinas a partidos de pádel.
 */
export function filterCompatibleResources(
  selectedService: AdaptiveServiceItem | null,
  selectedLocationId: string | null,
  allResources: AdaptiveResourceItem[]
): AdaptiveResourceItem[] {
  if (allResources.length === 0) return [];

  let filtered = allResources.filter((r) => r.isActive);

  // 1. Filtrar por sede si está seleccionada y el recurso tiene sede asignada
  if (selectedLocationId) {
    filtered = filtered.filter(
      (r) => !r.locationId || r.locationId === selectedLocationId
    );
  }

  // 2. Filtrar por compatibilidad semántica de tipo de recurso según el servicio
  if (selectedService) {
    const sName = selectedService.name.toLowerCase();
    const sDesc = (selectedService.description || "").toLowerCase();
    const combined = `${sName} ${sDesc}`;

    if (combined.includes("cancha") || combined.includes("padel") || combined.includes("tenis")) {
      const courts = filtered.filter((r) => r.type === "CANCHA");
      if (courts.length > 0) return courts;
    } else if (combined.includes("masaje") || combined.includes("facial") || combined.includes("spa") || combined.includes("corporal")) {
      const cabins = filtered.filter((r) => r.type === "CABINA");
      if (cabins.length > 0) return cabins;
    } else if (combined.includes("dental") || combined.includes("diente") || combined.includes("limpieza")) {
      const dental = filtered.filter((r) => r.type === "SILLON" || r.type === "CONSULTORIO");
      if (dental.length > 0) return dental;
    } else if (combined.includes("consulta") || combined.includes("terapia") || combined.includes("psico") || combined.includes("médic")) {
      const consultorios = filtered.filter((r) => r.type === "CONSULTORIO");
      if (consultorios.length > 0) return consultorios;
    }
  }

  return filtered;
}

/**
 * Motor de dependencias dinámico que genera la lista de pasos estrictamente necesarios.
 */
export function getBookingSteps(
  requirements: BookingRequirements,
  state: BookingState,
  data: AdaptiveBusinessData
): BookingStepId[] {
  const steps: BookingStepId[] = [];

  // 1. Caso especial: Centro deportivo / Alquiler de canchas (Pádel)
  if (requirements.isSpaceFirst) {
    if (requirements.requiresResourceSelection) {
      steps.push("resource_first");
    }
    if (requirements.requiresServiceSelection) {
      steps.push("service");
    }
    steps.push("date", "time", "form");
    if (requirements.requiresPayment && requirements.paymentMode === "UPFRONT") {
      steps.push("payment");
    }
    steps.push("done");
    return steps;
  }

  // 2. Paso de Servicio (si hay más de 1 servicio a elegir)
  if (requirements.requiresServiceSelection) {
    steps.push("service");
  }

  // 3. Paso de Modalidad (Presencial vs Online)
  if (requirements.requiresModalitySelection) {
    steps.push("modality");
  }

  // Si la modalidad elegida es ONLINE, omitir sedes y recursos físicos
  const isOnline = state.modality === "online";

  // 4. Paso de Sede / Ubicación (si es presencial y hay más de 1 sede)
  if (!isOnline && requirements.requiresLocationSelection) {
    steps.push("location");
  }

  // 5. Paso de Especialista / Staff (si aplica y hay más de 1 especialista compatible)
  const currentService = data.services.find((s) => s.id === state.serviceId) || data.services[0] || null;
  const compatibleStaff = filterCompatibleStaff(currentService, data.staff);
  if (requirements.requiresStaffSelection && compatibleStaff.length > 1) {
    steps.push("staff");
  }

  // 6. Paso de Recurso Físico / Cabina (si es presencial y hay más de 1 recurso compatible)
  if (!isOnline && requirements.requiresResourceSelection) {
    const compatibleResources = filterCompatibleResources(currentService, state.locationId, data.resources);
    if (compatibleResources.length > 1) {
      steps.push("resource");
    }
  }

  // 7. Selección de Fecha y Horario
  steps.push("date", "time");

  // 8. Formulario de Datos del Cliente
  steps.push("form");

  // 9. Pago Anticipado si es obligatorio
  if (requirements.requiresPayment && requirements.paymentMode === "UPFRONT") {
    steps.push("payment");
  }

  // 10. Confirmación
  steps.push("done");

  return steps;
}

/**
 * Limpia selecciones incompatibles cuando el usuario cambia de modalidad (Presencial <-> Online).
 */
export function sanitizeStateOnModalityChange(
  prevState: BookingState,
  newModality: "presencial" | "online"
): BookingState {
  if (newModality === "online") {
    return {
      ...prevState,
      modality: "online",
      locationId: null, // Online no tiene sede física
      resourceId: null, // Online no ocupa cabina ni cancha
      time: null, // Re-solicitar horario
    };
  }

  // Si cambió a presencial
  return {
    ...prevState,
    modality: "presencial",
    time: null,
  };
}

/**
 * Obtiene las etiquetas dinámicas contextuales en lenguaje natural para la interfaz.
 */
export function getContextualLabels(rubro: string, isSpaceBooking = false) {
  const base = getLabels(rubro);

  if (isSpaceBooking) {
    return {
      ...base,
      resourceStepTitle: "Elige tu cancha o espacio",
      resourceBadge: "Cancha / Espacio",
      staffStepTitle: "Instructor / Personal",
      locationStepTitle: "Elige tu sede o sucursal",
    };
  }

  const norm = rubro.toUpperCase();
  if (norm.includes("BARBER") || norm.includes("BELLEZA")) {
    return {
      ...base,
      resourceStepTitle: "Elige tu cabina o estación",
      resourceBadge: "Estación",
      staffStepTitle: "Elige a tu barbero o estilista",
      locationStepTitle: "Elige tu sucursal",
    };
  }

  if (norm.includes("SALUD") || norm.includes("PSICO") || norm.includes("MEDIC")) {
    return {
      ...base,
      resourceStepTitle: "Consultorio asignado",
      resourceBadge: "Consultorio",
      staffStepTitle: "Elige a tu especialista",
      locationStepTitle: "Elige tu consultorio o clínica",
    };
  }

  return {
    ...base,
    resourceStepTitle: "Elige el espacio o sala",
    resourceBadge: "Espacio",
    staffStepTitle: `Elige ${base.staff.toLowerCase()}`,
    locationStepTitle: `Elige ${base.location.toLowerCase()}`,
  };
}
