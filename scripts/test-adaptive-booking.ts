import {
  AdaptiveBusinessData,
  resolveBookingRequirements,
  getBookingSteps,
  createInitialBookingState,
  filterCompatibleStaff,
  filterCompatibleResources,
  sanitizeStateOnModalityChange,
  inferCapabilitiesFromEntities,
  getContextualLabels,
  BookingStepId,
} from "../src/lib/booking/adaptive-engine";
import { prisma } from "../src/lib/prisma";
import { createAppointment } from "../src/actions/appointments";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✔ ${message}`);
  passedCount++;
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  TEST SUITE: ADAPTIVE PUBLIC BOOKING ENGINE 1.0");
  console.log("=======================================================\n");

  // ─────────────────────────────────────────────────────────────
  // CASE A: Psicólogo solo (Minimal steps: date, time, form, done)
  // ─────────────────────────────────────────────────────────────
  console.log("🧠 Caso A: Psicólogo solo (flujo minimalista, sin staff ni recurso)");
  {
    const data: AdaptiveBusinessData = {
      slug: "psico-ana",
      businessName: "Lic. Ana Gómez",
      rubro: "PSICOLOGIA",
      planTier: "FREE",
      services: [
        { id: "s1", name: "Terapia Individual", description: "", duration: 50, bufferTime: 10, price: 60, currency: "USD", staffIds: [] },
      ],
      staff: [],
      locations: [{ id: "loc-1", name: "Consultorio Condesa", address: "Av Mazatlan 10", phone: null }],
      resources: [],
      capabilities: {
        services: true,
        multipleServices: false,
        serviceModality: { presencial: true, online: false, domicilio: false },
        staff: false,
        staffSelection: false,
        staffServiceAssignment: false,
        locations: true,
        multipleLocations: false,
        resources: false,
        resourceSelection: false,
        payments: false,
        paymentMode: "NONE",
        customForms: true,
        clinicalRecords: true,
      },
      config: {
        slotDuration: 50,
        bufferTime: 10,
        formFields: [{ name: "motivo", label: "Motivo de consulta", type: "text", required: true }],
        acceptBankTransfer: false,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    assert(!reqs.requiresServiceSelection, "A: No requiere paso de selección de servicio (solo 1)");
    assert(!reqs.requiresModalitySelection, "A: No requiere paso de modalidad (solo presencial)");
    assert(!reqs.requiresLocationSelection, "A: No requiere paso de sede (solo 1 sede)");
    assert(!reqs.requiresStaffSelection, "A: No requiere paso de staff");
    assert(!reqs.requiresResourceSelection, "A: No requiere paso de recursos");

    const state = createInitialBookingState(data, reqs);
    assert(state.serviceId === "s1", "A: Auto-selecciona el único servicio s1");
    assert(state.locationId === "loc-1", "A: Auto-selecciona la única sede loc-1");
    assert(state.modality === "presencial", "A: Auto-selecciona presencial");

    const steps = getBookingSteps(reqs, state, data);
    const expectedSteps: BookingStepId[] = ["date", "time", "form", "done"];
    assert(
      JSON.stringify(steps) === JSON.stringify(expectedSteps),
      `A: Pasos exactos generados son solo [date, time, form, done]. Obtenido: ${steps.join(" -> ")}`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CASE B: Médico solo en clínica (Single location, clinical metadata)
  // ─────────────────────────────────────────────────────────────
  console.log("\n🩺 Caso B: Médico solo (metadatos clínicos, 1 sola clínica)");
  {
    const data: AdaptiveBusinessData = {
      slug: "dr-martinez",
      businessName: "Dr. Carlos Martínez",
      rubro: "MEDICINA",
      planTier: "FREE",
      services: [
        { id: "s1", name: "Consulta General", description: "", duration: 30, bufferTime: 10, price: 800, currency: "MXN", staffIds: [] },
      ],
      staff: [],
      locations: [{ id: "c1", name: "Hospital Ángeles", address: "Agrarismo 208", phone: "555-1234" }],
      resources: [{ id: "r1", name: "Consultorio 302", type: "CONSULTORIO", locationId: "c1", isActive: true }],
      capabilities: {
        services: true,
        multipleServices: false,
        serviceModality: { presencial: true, online: false, domicilio: false },
        staff: false,
        staffSelection: false,
        staffServiceAssignment: false,
        locations: true,
        multipleLocations: false,
        resources: true,
        resourceSelection: false,
        payments: true,
        paymentMode: "LATER",
        customForms: true,
        clinicalRecords: true,
      },
      config: {
        slotDuration: 30,
        bufferTime: 10,
        formFields: [{ name: "sintomas", label: "Síntomas", type: "textarea", required: true }],
        acceptBankTransfer: false,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    const state = createInitialBookingState(data, reqs);
    assert(state.serviceId === "s1", "B: Auto-selecciona el servicio médico");
    assert(state.resourceId === "r1", "B: Auto-selecciona el único consultorio r1");
    assert(reqs.requiresPayment, "B: Registra pago en clínica");

    const steps = getBookingSteps(reqs, state, data);
    assert(!steps.includes("resource"), "B: Oculta selector de recurso (solo hay 1 consultorio)");
    assert(!steps.includes("staff"), "B: Oculta selector de staff");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE C: Barbería con múltiples barberos (StaffService filtering)
  // ─────────────────────────────────────────────────────────────
  console.log("\n💈 Caso C: Barbería con múltiples barberos (Filtrado por StaffService)");
  {
    const staff1 = { id: "st-1", name: "Mateo Barbero", email: "m@barber.com", phone: null, description: null, avatarUrl: null, weeklyHours: [] };
    const staff2 = { id: "st-2", name: "Lucas Colorista", email: "l@barber.com", phone: null, description: null, avatarUrl: null, weeklyHours: [] };

    const data: AdaptiveBusinessData = {
      slug: "barberia-classic",
      businessName: "Classic Cuts",
      rubro: "BARBERIA",
      planTier: "PRO",
      services: [
        { id: "s-corte", name: "Corte Clásico", description: "", duration: 30, bufferTime: 0, price: 300, currency: "MXN", staffIds: ["st-1", "st-2"] },
        { id: "s-tinte", name: "Tinte y Barba", description: "", duration: 60, bufferTime: 10, price: 600, currency: "MXN", staffIds: ["st-2"] }, // Solo Lucas
      ],
      staff: [staff1, staff2],
      locations: [{ id: "loc-1", name: "Sucursal Centro", address: "Reforma 100", phone: null }],
      resources: [],
      capabilities: {
        services: true,
        multipleServices: true,
        serviceModality: { presencial: true, online: false, domicilio: false },
        staff: true,
        staffSelection: true,
        staffServiceAssignment: true,
        locations: true,
        multipleLocations: false,
        resources: false,
        resourceSelection: false,
        payments: true,
        paymentMode: "LATER",
        customForms: true,
        clinicalRecords: false,
      },
      config: {
        slotDuration: 30,
        bufferTime: 0,
        formFields: [],
        acceptBankTransfer: false,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    assert(reqs.requiresServiceSelection, "C: Requiere paso de servicio (2 servicios)");
    assert(reqs.requiresStaffSelection, "C: Plan PRO con 2 barberos requiere selección de staff");

    // Filtrado cuando se elige "Corte Clásico" (ambos barberos pueden)
    const corte = data.services[0];
    const corteStaff = filterCompatibleStaff(corte, data.staff);
    assert(corteStaff.length === 2, "C: Para 'Corte Clásico' ambos barberos están disponibles");

    // Filtrado cuando se elige "Tinte y Barba" (solo Lucas)
    const tinte = data.services[1];
    const tinteStaff = filterCompatibleStaff(tinte, data.staff);
    assert(tinteStaff.length === 1 && tinteStaff[0].id === "st-2", "C: Para 'Tinte y Barba' SOLO Lucas está disponible");

    // Verificación dinámica de pasos para tinte: como solo 1 barbero puede darlo, el paso de staff NO se muestra
    const stateTinte = {
      ...createInitialBookingState(data, reqs),
      serviceId: "s-tinte",
    };
    const stepsTinte = getBookingSteps(reqs, stateTinte, data);
    assert(!stepsTinte.includes("staff"), "C: Si el servicio solo lo da 1 barbero, el paso 'staff' se omite dinámicamente");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE D: Spa con terapeutas + cabinas simultáneas
  // ─────────────────────────────────────────────────────────────
  console.log("\n🧖 Caso D: Spa con terapeutas + cabinas físicas simultáneas");
  {
    const data: AdaptiveBusinessData = {
      slug: "spa-zen",
      businessName: "Zen Spa",
      rubro: "SPA",
      planTier: "PRO",
      services: [
        { id: "s-masaje", name: "Masaje Relajante", description: "En cabina spa", duration: 60, bufferTime: 15, price: 1200, currency: "MXN", staffIds: [] },
        { id: "s-facial", name: "Limpieza Facial", description: "En cabina spa", duration: 45, bufferTime: 10, price: 900, currency: "MXN", staffIds: [] },
      ],
      staff: [
        { id: "ter-1", name: "Terapeuta Sofía", email: "s@spa.com", phone: null, description: null, avatarUrl: null, weeklyHours: [] },
        { id: "ter-2", name: "Terapeuta Valeria", email: "v@spa.com", phone: null, description: null, avatarUrl: null, weeklyHours: [] },
      ],
      locations: [{ id: "loc-spa", name: "Sede Roma", address: "Orizaba 55", phone: null }],
      resources: [
        { id: "cab-1", name: "Cabina Esmeralda", type: "CABINA", locationId: "loc-spa", isActive: true },
        { id: "cab-2", name: "Cabina Cuarzo", type: "CABINA", locationId: "loc-spa", isActive: true },
      ],
      capabilities: {
        services: true,
        multipleServices: true,
        serviceModality: { presencial: true, online: false, domicilio: false },
        staff: true,
        staffSelection: true,
        staffServiceAssignment: false,
        locations: true,
        multipleLocations: false,
        resources: true,
        resourceSelection: true,
        payments: true,
        paymentMode: "UPFRONT",
        customForms: false,
        clinicalRecords: false,
      },
      config: {
        slotDuration: 60,
        bufferTime: 15,
        formFields: [],
        acceptBankTransfer: true,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    const state = createInitialBookingState(data, reqs);
    const steps = getBookingSteps(reqs, state, data);

    assert(steps.includes("service"), "D: Incluye paso de servicio");
    assert(steps.includes("staff"), "D: Incluye paso de terapeuta (staff)");
    assert(steps.includes("resource"), "D: Incluye paso de cabina (resource)");
    assert(steps.includes("payment"), "D: Incluye paso de pago anticipado");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE E: Pádel con canchas y sin staff (Space-First Flow)
  // ─────────────────────────────────────────────────────────────
  console.log("\n🎾 Caso E: Club de Pádel (Flujo Space-First: Cancha primero, sin staff)");
  {
    const data: AdaptiveBusinessData = {
      slug: "padel-club",
      businessName: "Padel Center",
      rubro: "CANCHAS_PADEL",
      planTier: "FREE",
      services: [
        { id: "s-pista", name: "Alquiler 90 min", description: "Cancha de pádel", duration: 90, bufferTime: 0, price: 500, currency: "MXN", staffIds: [] },
      ],
      staff: [],
      locations: [{ id: "l1", name: "Club Central", address: "Av Insurgentes 500", phone: null }],
      resources: [
        { id: "cancha-1", name: "Cancha 1 (Panorámica)", type: "CANCHA", locationId: "l1", isActive: true },
        { id: "cancha-2", name: "Cancha 2 (Techada)", type: "CANCHA", locationId: "l1", isActive: true },
        { id: "cancha-3", name: "Cancha 3 (Outdoor)", type: "CANCHA", locationId: "l1", isActive: true },
      ],
      capabilities: {
        services: true,
        multipleServices: false,
        serviceModality: { presencial: true, online: false, domicilio: false },
        staff: false,
        staffSelection: false,
        staffServiceAssignment: false,
        locations: true,
        multipleLocations: false,
        resources: true,
        resourceSelection: true,
        payments: true,
        paymentMode: "UPFRONT",
        customForms: false,
        clinicalRecords: false,
      },
      config: {
        slotDuration: 90,
        bufferTime: 0,
        formFields: [],
        acceptBankTransfer: true,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    assert(reqs.isSpaceFirst, "E: Reconoce space-first para pádel/canchas con recursos y sin staff");

    const state = createInitialBookingState(data, reqs);
    const steps = getBookingSteps(reqs, state, data);

    assert(steps[0] === "resource_first", "E: El PRIMER paso es 'resource_first' (elegir cancha antes de horario)");
    assert(!steps.includes("staff"), "E: NO incluye paso de staff");
    assert(!steps.includes("service"), "E: NO incluye paso de servicio porque solo hay 1 duración");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE F: Consultor 100% online (No physical location or resource)
  // ─────────────────────────────────────────────────────────────
  console.log("\n💻 Caso F: Consultor 100% Online (Sin sede física ni recurso)");
  {
    const data: AdaptiveBusinessData = {
      slug: "consultor-online",
      businessName: "Consultoría Estratégica",
      rubro: "CONSULTORIA",
      planTier: "FREE",
      services: [
        { id: "s1", name: "Sesión 1:1 por Zoom", description: "Videollamada online", duration: 45, bufferTime: 15, price: 100, currency: "USD", staffIds: [] },
      ],
      staff: [],
      locations: [],
      resources: [],
      capabilities: {
        services: true,
        multipleServices: false,
        serviceModality: { presencial: false, online: true, domicilio: false },
        staff: false,
        staffSelection: false,
        staffServiceAssignment: false,
        locations: false,
        multipleLocations: false,
        resources: false,
        resourceSelection: false,
        payments: false,
        paymentMode: "NONE",
        customForms: true,
        clinicalRecords: false,
      },
      config: {
        slotDuration: 45,
        bufferTime: 15,
        formFields: [{ name: "objetivo", label: "¿Cuál es tu objetivo?", type: "text", required: true }],
        acceptBankTransfer: false,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    const state = createInitialBookingState(data, reqs);
    assert(state.modality === "online", "F: Pre-selecciona modalidad 'online'");
    assert(state.locationId === null, "F: locationId es null");
    assert(state.resourceId === null, "F: resourceId es null");

    const steps = getBookingSteps(reqs, state, data);
    assert(!steps.includes("location"), "F: NO incluye paso de sede");
    assert(!steps.includes("resource"), "F: NO incluye paso de recurso");
    assert(!steps.includes("modality"), "F: NO incluye selector de modalidad (solo ofrece online)");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE G: Negocio con múltiples sucursales (Resource filtered by branch)
  // ─────────────────────────────────────────────────────────────
  console.log("\n🏢 Caso G: Múltiples sucursales (Recursos filtrados estrictamente por sede)");
  {
    const resources = [
      { id: "res-pol-1", name: "Cabina Polanco 1", type: "CABINA", locationId: "loc-polanco", isActive: true },
      { id: "res-pol-2", name: "Cabina Polanco 2", type: "CABINA", locationId: "loc-polanco", isActive: true },
      { id: "res-roma-1", name: "Cabina Roma 1", type: "CABINA", locationId: "loc-roma", isActive: true },
    ];

    const polancoResources = filterCompatibleResources(null, "loc-polanco", resources);
    assert(polancoResources.length === 2, "G: Para Polanco solo se muestran sus 2 cabinas");
    assert(polancoResources.every((r) => r.locationId === "loc-polanco"), "G: Ninguna cabina de Roma en Polanco");

    const romaResources = filterCompatibleResources(null, "loc-roma", resources);
    assert(romaResources.length === 1 && romaResources[0].id === "res-roma-1", "G: Para Roma solo se muestra su única cabina");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE H: Negocio híbrido presencial + online (Sanitización de estado)
  // ─────────────────────────────────────────────────────────────
  console.log("\n🔄 Caso H: Negocio Híbrido (Selector de modalidad y sanitización)");
  {
    const data: AdaptiveBusinessData = {
      slug: "nutri-hibrido",
      businessName: "Nutrición Integral",
      rubro: "SALUD",
      planTier: "FREE",
      services: [
        { id: "s1", name: "Consulta Nutricional", description: "", duration: 40, bufferTime: 10, price: 600, currency: "MXN", staffIds: [] },
      ],
      staff: [],
      locations: [
        { id: "loc-1", name: "Consultorio Del Valle", address: "Amores 300", phone: null },
        { id: "loc-2", name: "Consultorio Santa Fe", address: "Vasco de Quiroga", phone: null },
      ],
      resources: [],
      capabilities: {
        services: true,
        multipleServices: false,
        serviceModality: { presencial: true, online: true, domicilio: false },
        staff: false,
        staffSelection: false,
        staffServiceAssignment: false,
        locations: true,
        multipleLocations: true,
        resources: false,
        resourceSelection: false,
        payments: false,
        paymentMode: "NONE",
        customForms: false,
        clinicalRecords: true,
      },
      config: {
        slotDuration: 40,
        bufferTime: 10,
        formFields: [],
        acceptBankTransfer: false,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    assert(reqs.requiresModalitySelection, "H: Requiere selector de modalidad (presencial y online disponibles)");

    // Estado cuando el usuario elige presencial
    let state = createInitialBookingState(data, reqs);
    state.modality = "presencial";
    state.locationId = "loc-1";
    let stepsPresencial = getBookingSteps(reqs, state, data);
    assert(stepsPresencial.includes("location"), "H: Si elige presencial, muestra paso de sede");

    // Cuando el usuario cambia a online, se sanitiza
    state = sanitizeStateOnModalityChange(state, "online");
    assert(state.locationId === null, "H: Al cambiar a online, locationId se sanitiza a null");
    let stepsOnline = getBookingSteps(reqs, state, data);
    assert(!stepsOnline.includes("location"), "H: Si elige online, se omite el paso de sede");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE I: Negocio sin pagos online (NONE)
  // ─────────────────────────────────────────────────────────────
  console.log("\n💵 Caso I: Negocio sin cobro online (paymentMode NONE)");
  {
    const data: AdaptiveBusinessData = {
      slug: "asesoria-gratis",
      businessName: "Asesoría Libre",
      rubro: "ASESORIA",
      planTier: "FREE",
      services: [
        { id: "s1", name: "Valoración Inicial", description: "", duration: 30, bufferTime: 0, price: 0, currency: "MXN", staffIds: [] },
      ],
      staff: [],
      locations: [],
      resources: [],
      capabilities: {
        services: true,
        multipleServices: false,
        serviceModality: { presencial: false, online: true, domicilio: false },
        staff: false,
        staffSelection: false,
        staffServiceAssignment: false,
        locations: false,
        multipleLocations: false,
        resources: false,
        resourceSelection: false,
        payments: false,
        paymentMode: "NONE",
        customForms: false,
        clinicalRecords: false,
      },
      config: {
        slotDuration: 30,
        bufferTime: 0,
        formFields: [],
        acceptBankTransfer: false,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    assert(!reqs.requiresPayment, "I: requiresPayment es falso");
    assert(reqs.paymentMode === "NONE", "I: paymentMode es NONE");

    const state = createInitialBookingState(data, reqs);
    const steps = getBookingSteps(reqs, state, data);
    assert(!steps.includes("payment"), "I: NO incluye paso de payment");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE J: Staff sin selección manual por cliente (team_assigned)
  // ─────────────────────────────────────────────────────────────
  console.log("\n👥 Caso J: Staff sin selección manual por cliente (team_assigned)");
  {
    const data: AdaptiveBusinessData = {
      slug: "clinica-turnos",
      businessName: "Clínica Dental Express",
      rubro: "DENTAL",
      planTier: "PRO",
      services: [
        { id: "s1", name: "Limpieza", description: "", duration: 30, bufferTime: 5, price: 400, currency: "MXN", staffIds: [] },
      ],
      staff: [
        { id: "dent-1", name: "Dr. A", email: "a@d.com", phone: null, description: null, avatarUrl: null, weeklyHours: [] },
        { id: "dent-2", name: "Dr. B", email: "b@d.com", phone: null, description: null, avatarUrl: null, weeklyHours: [] },
      ],
      locations: [{ id: "l1", name: "Sede Única", address: "X", phone: null }],
      resources: [],
      capabilities: {
        services: true,
        multipleServices: false,
        serviceModality: { presencial: true, online: false, domicilio: false },
        staff: true,
        staffSelection: false, // El cliente NO elige odontólogo
        staffServiceAssignment: false,
        locations: true,
        multipleLocations: false,
        resources: false,
        resourceSelection: false,
        payments: false,
        paymentMode: "NONE",
        customForms: false,
        clinicalRecords: true,
      },
      config: {
        slotDuration: 30,
        bufferTime: 5,
        formFields: [],
        acceptBankTransfer: false,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    assert(!reqs.requiresStaffSelection, "J: staffSelection desactivado => cliente no pasa por selector de staff");

    const state = createInitialBookingState(data, reqs);
    const steps = getBookingSteps(reqs, state, data);
    assert(!steps.includes("staff"), "J: El paso 'staff' se omite en el portal");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE K: Auto-selección cuando solo existe 1 opción válida
  // ─────────────────────────────────────────────────────────────
  console.log("\n🎯 Caso K: Auto-selección cuando solo existe 1 opción válida");
  {
    const data: AdaptiveBusinessData = {
      slug: "auto-select-biz",
      businessName: "Negocio Uno",
      rubro: "GENERAL",
      planTier: "FREE",
      services: [
        { id: "only-srv", name: "Único Servicio", description: "", duration: 30, bufferTime: 0, price: 100, currency: "MXN", staffIds: [] },
      ],
      staff: [
        { id: "only-staff", name: "Único Especialista", email: "e@e.com", phone: null, description: null, avatarUrl: null, weeklyHours: [] },
      ],
      locations: [
        { id: "only-loc", name: "Única Sede", address: "Calle 1", phone: null },
      ],
      resources: [
        { id: "only-res", name: "Única Cabina", type: "CABINA", locationId: "only-loc", isActive: true },
      ],
      capabilities: {
        services: true,
        multipleServices: false,
        serviceModality: { presencial: true, online: false, domicilio: false },
        staff: true,
        staffSelection: true,
        staffServiceAssignment: false,
        locations: true,
        multipleLocations: false,
        resources: true,
        resourceSelection: true,
        payments: false,
        paymentMode: "NONE",
        customForms: false,
        clinicalRecords: false,
      },
      config: {
        slotDuration: 30,
        bufferTime: 0,
        formFields: [],
        acceptBankTransfer: false,
        timezone: "America/Mexico_City",
      },
    };

    const reqs = resolveBookingRequirements(data);
    const state = createInitialBookingState(data, reqs);

    assert(state.serviceId === "only-srv", "K: Servicio auto-seleccionado");
    assert(state.staffId === "only-staff", "K: Staff auto-seleccionado");
    assert(state.locationId === "only-loc", "K: Sede auto-seleccionada");
    assert(state.resourceId === "only-res", "K: Recurso auto-seleccionado");

    const steps = getBookingSteps(reqs, state, data);
    assert(!steps.includes("service"), "K: Paso de servicio omitido");
    assert(!steps.includes("staff"), "K: Paso de staff omitido");
    assert(!steps.includes("location"), "K: Paso de sede omitido");
    assert(!steps.includes("resource"), "K: Paso de recurso omitido");
  }

  // ─────────────────────────────────────────────────────────────
  // CASE L: Intento de doble booking concurrente en slots de recurso y staff
  // ─────────────────────────────────────────────────────────────
  console.log("\n🔒 Caso L: Protección contra doble booking concurrente con advisory lock");
  {
    const testSlug = `test-double-${Date.now()}`;
    const user = await prisma.user.create({
      data: {
        email: `${testSlug}@example.com`,
        name: "Test Double Booking",
        slug: testSlug,
        rubro: "SALUD",
        config: {
          create: {
            slotDuration: 30,
            bufferTime: 0,
            weeklyHours: [{ day: 1, slots: [{ open: "09:00", close: "18:00" }] }],
            formFields: [],
          },
        },
        services: {
          create: {
            name: "Consulta Test",
            duration: 30,
            bufferTime: 0,
            price: 500,
          },
        },
      },
      include: { services: true },
    });

    const srv = user.services[0];
    const testDate = "2026-10-12"; // Lunes
    const testTime = "10:00";

    // Disparar dos peticiones concurrentes para el mismo slot
    const p1 = createAppointment({
      slug: testSlug,
      date: testDate,
      time: testTime,
      clientName: "Cliente A",
      clientEmail: "a@cliente.com",
      clientPhone: "5551234567",
      clientMetadata: {},
      serviceId: srv.id,
    });

    const p2 = createAppointment({
      slug: testSlug,
      date: testDate,
      time: testTime,
      clientName: "Cliente B",
      clientEmail: "b@cliente.com",
      clientPhone: "5559876543",
      clientMetadata: {},
      serviceId: srv.id,
    });

    const [r1, r2] = await Promise.all([p1, p2]);

    const successes = [r1, r2].filter((r) => "success" in r && r.success);
    const errors = [r1, r2].filter((r) => "error" in r);

    assert(successes.length === 1, `L: Exactamente 1 reserva concurrente tuvo éxito (Éxitos: ${successes.length})`);
    assert(errors.length === 1, `L: Exactamente 1 reserva concurrente fue rechazada (Errores: ${errors.length})`);

    // Limpieza
    await prisma.user.delete({ where: { id: user.id } });
  }

  // ─────────────────────────────────────────────────────────────
  // CASE M: Rechazo server-side de staff no asociado al servicio
  // ─────────────────────────────────────────────────────────────
  console.log("\n🛡️ Caso M: Rechazo server-side de staff no autorizado para el servicio");
  {
    const testSlug = `test-staffserv-${Date.now()}`;
    const defaultHours = [{ day: 1, slots: [{ open: "09:00", close: "18:00" }] }];

    const user = await prisma.user.create({
      data: {
        email: `${testSlug}@example.com`,
        name: "Test StaffService Server",
        slug: testSlug,
        rubro: "BARBERIA",
        config: {
          create: {
            slotDuration: 30,
            bufferTime: 0,
            weeklyHours: defaultHours,
            formFields: [],
          },
        },
        staff: {
          create: [
            { name: "Barbero Autorizado", email: `ba_${testSlug}@example.com`, weeklyHours: defaultHours },
            { name: "Barbero No Autorizado", email: `bna_${testSlug}@example.com`, weeklyHours: defaultHours },
          ],
        },
      },
      include: { staff: true },
    });

    const staffAuth = user.staff[0];
    const staffNoAuth = user.staff[1];

    // Crear servicio vinculado únicamente a staffAuth
    const service = await prisma.service.create({
      data: {
        userId: user.id,
        name: "Barba VIP",
        duration: 30,
        staffServices: {
          create: { staffId: staffAuth.id },
        },
      },
    });

    // Intentar reservar el servicio con el staff no autorizado
    const res = await createAppointment({
      slug: testSlug,
      date: "2026-10-12",
      time: "11:00",
      clientName: "Cliente Intruso",
      clientEmail: "intruso@test.com",
      clientPhone: "5550001122",
      clientMetadata: {},
      serviceId: service.id,
      staffId: staffNoAuth.id,
    });

    assert("error" in res, "M: createAppointment rechazó staffId no asociado al servicio");
    assert(
      (res as any).error.includes("no ofrece este servicio"),
      `M: Mensaje de rechazo correcto: ${(res as any).error}`
    );

    await prisma.user.delete({ where: { id: user.id } });
  }

  // ─────────────────────────────────────────────────────────────
  // CASE N: Rechazo server-side de recurso perteneciente a otra sede
  // ─────────────────────────────────────────────────────────────
  console.log("\n📍 Caso N: Rechazo server-side de recurso perteneciente a otra sede");
  {
    const testSlug = `test-locres-${Date.now()}`;
    const user = await prisma.user.create({
      data: {
        email: `${testSlug}@example.com`,
        name: "Test Location Resource",
        slug: testSlug,
        rubro: "SPA",
        config: {
          create: {
            slotDuration: 30,
            bufferTime: 0,
            weeklyHours: [{ day: 1, slots: [{ open: "09:00", close: "18:00" }] }],
            formFields: [],
          },
        },
        locations: {
          create: [
            { name: "Sede Norte", address: "Av Norte 1" },
            { name: "Sede Sur", address: "Av Sur 2" },
          ],
        },
      },
      include: { locations: true },
    });

    const locNorte = user.locations[0];
    const locSur = user.locations[1];

    const cabinaNorte = await prisma.resource.create({
      data: {
        userId: user.id,
        name: "Cabina Norte 1",
        type: "CABINA",
        locationId: locNorte.id,
      },
    });

    // Intentar reservar en Sede Sur con una cabina de Sede Norte
    const res = await createAppointment({
      slug: testSlug,
      date: "2026-10-12",
      time: "12:00",
      clientName: "Cliente Sede",
      clientEmail: "sede@test.com",
      clientPhone: "5551112233",
      clientMetadata: {},
      locationId: locSur.id,
      resourceId: cabinaNorte.id,
    });

    assert("error" in res, "N: Rechaza reserva cuando el recurso no pertenece a la sede seleccionada");
    assert(
      (res as any).error.includes("no pertenece a la sede"),
      `N: Mensaje de validación: ${(res as any).error}`
    );

    await prisma.user.delete({ where: { id: user.id } });
  }

  // ─────────────────────────────────────────────────────────────
  // CASE O: Aislamiento estricto cross-tenant
  // ─────────────────────────────────────────────────────────────
  console.log("\n🏢 Caso O: Aislamiento estricto multi-tenant (Evitar acceder a recursos de otro tenant)");
  {
    const slug1 = `tenant1-${Date.now()}`;
    const slug2 = `tenant2-${Date.now()}`;

    const tenant1 = await prisma.user.create({
      data: {
        email: `${slug1}@example.com`,
        name: "Tenant Uno",
        slug: slug1,
        rubro: "BELLEZA",
        config: {
          create: {
            slotDuration: 30,
            bufferTime: 0,
            weeklyHours: [{ day: 1, slots: [{ open: "09:00", close: "18:00" }] }],
            formFields: [],
          },
        },
        resources: {
          create: { name: "Sillón 1 Tenant 1", type: "SILLON" },
        },
      },
      include: { resources: true },
    });

    const tenant2 = await prisma.user.create({
      data: {
        email: `${slug2}@example.com`,
        name: "Tenant Dos",
        slug: slug2,
        rubro: "BELLEZA",
        config: {
          create: {
            slotDuration: 30,
            bufferTime: 0,
            weeklyHours: [{ day: 1, slots: [{ open: "09:00", close: "18:00" }] }],
            formFields: [],
          },
        },
      },
    });

    // Intentar reservar en Tenant 2 usando un recurso que pertenece a Tenant 1
    const res = await createAppointment({
      slug: slug2,
      date: "2026-10-12",
      time: "14:00",
      clientName: "Cross Tenant Attack",
      clientEmail: "hacker@test.com",
      clientPhone: "5559998877",
      clientMetadata: {},
      resourceId: tenant1.resources[0].id,
    });

    assert("error" in res, "O: Rechaza usar recurso que pertenece a otro tenant");
    assert(
      (res as any).error.includes("no encontrado"),
      `O: Recurso aislado por tenant id: ${(res as any).error}`
    );

    // Limpieza
    await prisma.user.delete({ where: { id: tenant1.id } });
    await prisma.user.delete({ where: { id: tenant2.id } });
  }

  console.log("\n=======================================================");
  console.log(`📊 RESULTADO FINAL: ${passedCount}/${totalCount} PRUEBAS SUPERADAS`);
  console.log("=======================================================\n");

  if (passedCount === totalCount) {
    console.log("🎉 ¡LOS 15 ESCENARIOS DEL ADAPTIVE BOOKING ENGINE ESTÁN 100% VALIDADOS!");
  } else {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
