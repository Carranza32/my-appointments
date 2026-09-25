import { ALL_PRESETS_FLAT, CATEGORIES_LIST, getPresetById } from "../src/lib/onboarding/presets";
import { resolveBusinessCapabilities, createInitialOnboardingAnswers } from "../src/lib/onboarding/capability-resolver";
import { getVisibleSteps, canAdvance, STEPS_CONFIG } from "../src/lib/onboarding/question-engine";
import type { OnboardingAnswers, OnboardingDraft, BusinessCapabilities } from "../src/lib/onboarding/types";
import { normalizeSlug } from "../src/lib/slug";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖\x1b[0m ${testName}`);
    if (detail) console.error(`     👉 ${detail}`);
    failed++;
  }
}

async function runQAValidationSuite() {
  console.log("\n=======================================================");
  console.log("  QA FUNCIONAL Y UX: SMART ONBOARDING 2.0 (12 ESCENARIOS)");
  console.log("=======================================================\n");

  // -------------------------------------------------------------
  // ESCENARIO 1: Psicólogo que trabaja solo
  // -------------------------------------------------------------
  console.log("🧠 Escenario 1: Psicólogo que trabaja solo");
  const s1: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Lic. Martín Gómez",
    slug: "martin-gomez",
    category: "salud",
    subCategory: "psicologia",
    teamStructure: "solo",
    locationType: "single",
    modality: "presencial",
    usesPhysicalResources: "no",
    enableClinicalModule: true,
  };
  const cap1 = resolveBusinessCapabilities(s1, getPresetById("psicologia"));
  const steps1 = getVisibleSteps(s1).map((s) => s.id);

  assert(!steps1.includes("team"), "E1: 'team' NO aparece para psicólogo solo");
  assert(steps1.includes("location"), "E1: 'location' aparece para consultorio");
  assert(!steps1.includes("resources"), "E1: 'resources' NO aparece sin recursos físicos");
  assert(cap1.clinicalRecords === true, "E1: Expediente Clínico activado automáticamente");
  assert(cap1.staff === false && cap1.staffSelection === false, "E1: Sin capacidades de staff");
  assert(cap1.locations === true && cap1.multipleLocations === false, "E1: Ubicación única");

  // -------------------------------------------------------------
  // ESCENARIO 2: Médico que trabaja solo en una clínica
  // -------------------------------------------------------------
  console.log("\n🩺 Escenario 2: Médico que trabaja solo en una clínica");
  const s2: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Dr. Eduardo Santos",
    slug: "dr-eduardo-santos",
    category: "salud",
    subCategory: "medicina_general",
    teamStructure: "solo",
    locationType: "single",
    modality: "presencial",
    usesPhysicalResources: "no",
    enableClinicalModule: true,
    paymentPreference: "upfront",
  };
  const cap2 = resolveBusinessCapabilities(s2, getPresetById("medicina_general"));
  assert(cap2.clinicalRecords === true, "E2: Módulo clínico activo");
  assert(cap2.paymentMode === "UPFRONT", "E2: Pago anticipado configurado");
  assert(!getVisibleSteps(s2).some((s) => s.id === "team"), "E2: Oculta paso de equipo");

  // -------------------------------------------------------------
  // ESCENARIO 3: Barbería con varios barberos y selección de profesional
  // -------------------------------------------------------------
  console.log("\n💈 Escenario 3: Barbería con varios barberos y selección de profesional");
  const s3: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "El Galgo Barber",
    slug: "el-galgo-barber",
    category: "belleza",
    subCategory: "barberia",
    teamStructure: "team_selectable",
    locationType: "single",
    modality: "presencial",
    usesPhysicalResources: "no",
    staffList: [
      { id: "st-1", name: "Javier", assignedServiceNames: [] },
      { id: "st-2", name: "Luis", assignedServiceNames: [] },
    ],
  };
  const cap3 = resolveBusinessCapabilities(s3, getPresetById("barberia"));
  const steps3 = getVisibleSteps(s3).map((s) => s.id);
  assert(steps3.includes("team"), "E3: Paso 'team' aparece para barberos");
  assert(cap3.staff === true, "E3: Capacidad staff activada");
  assert(cap3.staffSelection === true, "E3: staffSelection activado (cliente elige barbero)");
  assert(cap3.clinicalRecords === false, "E3: Expediente clínico desactivado para barbería");

  // -------------------------------------------------------------
  // ESCENARIO 4: Salón de belleza con varios profesionales
  // -------------------------------------------------------------
  console.log("\n💇 Escenario 4: Salón de belleza con varios profesionales");
  const s4: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Glamour Studio",
    slug: "glamour-studio",
    category: "belleza",
    subCategory: "salon_belleza",
    teamStructure: "team_selectable",
    locationType: "single",
    usesPhysicalResources: "no",
    staffList: [
      { id: "s-1", name: "Ana Estilista", assignedServiceNames: [] },
      { id: "s-2", name: "Claudia Colorista", assignedServiceNames: [] },
    ],
  };
  const cap4 = resolveBusinessCapabilities(s4, getPresetById("salon_belleza"));
  assert(cap4.staff === true && cap4.staffSelection === true, "E4: Staff y selección habilitados");

  // -------------------------------------------------------------
  // ESCENARIO 5: Spa con cabinas/recursos (Staff + Recursos)
  // -------------------------------------------------------------
  console.log("\n🧖 Escenario 5: Spa con cabinas/recursos (Staff + Recursos simultáneos)");
  const s5: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Aura Zen Spa",
    slug: "aura-zen-spa",
    category: "belleza",
    subCategory: "spa_estetica",
    teamStructure: "team_assigned",
    locationType: "single",
    usesPhysicalResources: "yes",
    staffList: [
      { id: "st-1", name: "Masajista Rosa", assignedServiceNames: [] },
      { id: "st-2", name: "Terapeuta Karla", assignedServiceNames: [] },
    ],
    resourcesList: [
      { id: "res-1", name: "Cabina Hidroterapia", type: "CABINA" },
      { id: "res-2", name: "Cabina Holística", type: "CABINA" },
    ],
  };
  const cap5 = resolveBusinessCapabilities(s5, getPresetById("spa_estetica"));
  const steps5 = getVisibleSteps(s5).map((s) => s.id);
  assert(steps5.includes("team"), "E5: Incluye paso 'team'");
  assert(steps5.includes("resources"), "E5: Incluye paso 'resources'");
  assert(cap5.staff === true, "E5: Staff activo");
  assert(cap5.staffSelection === false, "E5: staffSelection es falso (asignación automática)");
  assert(cap5.resources === true, "E5: Recursos activos (cabinas)");
  assert(cap5.resourceSelection === true, "E5: Selección de recurso múltiple activa");

  // -------------------------------------------------------------
  // ESCENARIO 6: Gimnasio o entrenador personal
  // -------------------------------------------------------------
  console.log("\n🏋️ Escenario 6: Gimnasio o entrenador personal");
  const s6: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Alex Fit Coach",
    slug: "alex-fit",
    category: "fitness",
    subCategory: "gimnasio_fitness",
    teamStructure: "solo",
    locationType: "single",
    usesPhysicalResources: "no",
  };
  const cap6 = resolveBusinessCapabilities(s6, getPresetById("gimnasio_fitness"));
  assert(cap6.staff === false, "E6: Entrenador personal trabaja solo");
  assert(cap6.clinicalRecords === false, "E6: Sin expediente clínico médico");

  // -------------------------------------------------------------
  // ESCENARIO 7: Academia / Clases
  // -------------------------------------------------------------
  console.log("\n🎓 Escenario 7: Academia / Clases");
  const s7: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Instituto de Idiomas Alfa",
    slug: "instituto-alfa",
    category: "educacion",
    subCategory: "clases_particulares",
    bookingItemType: "class",
    teamStructure: "team_selectable",
    locationType: "single",
    usesPhysicalResources: "no",
  };
  const cap7 = resolveBusinessCapabilities(s7, getPresetById("clases_particulares"));
  assert(cap7.staff === true, "E7: Profesores/tutores activos");
  assert(cap7.customForms === true, "E7: Cuestionario de nivel académico activo");

  // -------------------------------------------------------------
  // ESCENARIO 8: Club de pádel / canchas con recursos reservables (Recursos SIN Staff)
  // -------------------------------------------------------------
  console.log("\n🎾 Escenario 8: Club de pádel (Recursos SIN Staff)");
  const s8: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Smash Padel Club",
    slug: "smash-padel",
    category: "espacios",
    subCategory: "canchas_deportivas",
    bookingItemType: "space",
    teamStructure: "solo", // Sin personal específico
    locationType: "single",
    usesPhysicalResources: "yes",
    resourcesList: [
      { id: "c-1", name: "Cancha Central Pro", type: "CANCHA" },
      { id: "c-2", name: "Cancha Cristal 2", type: "CANCHA" },
      { id: "c-3", name: "Cancha Cristal 3", type: "CANCHA" },
    ],
  };
  const cap8 = resolveBusinessCapabilities(s8, getPresetById("canchas_deportivas"));
  const steps8 = getVisibleSteps(s8).map((s) => s.id);
  assert(!steps8.includes("team"), "E8: Oculta paso 'team' (solo canchas)");
  assert(steps8.includes("resources"), "E8: Muestra paso 'resources'");
  assert(cap8.staff === false, "E8: Staff es false");
  assert(cap8.resources === true, "E8: Resources es true");
  assert(cap8.resourceSelection === true, "E8: Permite elegir cancha");

  // -------------------------------------------------------------
  // ESCENARIO 9: Consultor que trabaja únicamente online (Sin local físico)
  // -------------------------------------------------------------
  console.log("\n💼 Escenario 9: Consultor que trabaja únicamente online");
  const s9: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Consultoría Growth",
    slug: "growth-consulting",
    category: "profesionales",
    subCategory: "consultoria_negocios",
    teamStructure: "solo",
    locationType: "none_online",
    modality: "online",
    usesPhysicalResources: "no",
  };
  const cap9 = resolveBusinessCapabilities(s9, getPresetById("consultoria_negocios"));
  const steps9 = getVisibleSteps(s9).map((s) => s.id);
  assert(!steps9.includes("team"), "E9: Oculta 'team'");
  assert(!steps9.includes("location"), "E9: Oculta 'location' (sin local físico)");
  assert(!steps9.includes("resources"), "E9: Oculta 'resources'");
  assert(cap9.locations === false, "E9: locations capability es false");
  assert(cap9.resources === false, "E9: resources capability es false");
  assert(cap9.serviceModality.online === true, "E9: serviceModality.online es true");
  assert(cap9.serviceModality.presencial === false, "E9: serviceModality.presencial es false");

  // -------------------------------------------------------------
  // ESCENARIO 10: Negocio con múltiples sucursales
  // -------------------------------------------------------------
  console.log("\n🏢 Escenario 10: Negocio con múltiples sucursales físicas");
  const s10: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Dental Polanco & Roma",
    slug: "dental-polanco-roma",
    category: "salud",
    subCategory: "medicina_general",
    teamStructure: "team_selectable",
    locationType: "multiple",
    locationsList: [
      { id: "loc-1", name: "Sucursal Polanco", address: "Campos Elíseos 100" },
      { id: "loc-2", name: "Sucursal Roma Norte", address: "Álvaro Obregón 200" },
    ],
    usesPhysicalResources: "yes",
    resourcesList: [
      { id: "r-1", name: "Sillón P-1", type: "SILLON", locationName: "Sucursal Polanco" },
      { id: "r-2", name: "Sillón R-1", type: "SILLON", locationName: "Sucursal Roma Norte" },
    ],
  };
  const cap10 = resolveBusinessCapabilities(s10, getPresetById("medicina_general"));
  assert(cap10.locations === true, "E10: locations es true");
  assert(cap10.multipleLocations === true, "E10: multipleLocations es true");
  assert(s10.resourcesList[0].locationName === "Sucursal Polanco", "E10: Recurso 1 mapeado a Sucursal Polanco");
  assert(s10.resourcesList[1].locationName === "Sucursal Roma Norte", "E10: Recurso 2 mapeado a Sucursal Roma Norte");

  // -------------------------------------------------------------
  // ESCENARIO 11: Negocio presencial + online (Híbrido)
  // -------------------------------------------------------------
  console.log("\n🌐 Escenario 11: Negocio presencial + online (Híbrido)");
  const s11: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Psicología & Coaching Integral",
    slug: "psico-integral",
    category: "salud",
    subCategory: "psicologia",
    teamStructure: "solo",
    locationType: "single",
    modality: "hybrid",
    usesPhysicalResources: "no",
  };
  const cap11 = resolveBusinessCapabilities(s11, getPresetById("psicologia"));
  assert(cap11.locations === true, "E11: Ubicación física habilitada");
  assert(cap11.serviceModality.presencial === true, "E11: Modalidad presencial activa");
  assert(cap11.serviceModality.online === true, "E11: Modalidad online activa (ambas simultáneas)");

  // -------------------------------------------------------------
  // ESCENARIO 12: Negocio que no cobra online
  // -------------------------------------------------------------
  console.log("\n💵 Escenario 12: Negocio sin cobro online (o gratuito)");
  const s12: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    businessName: "Asesoría Legal Comunitaria",
    slug: "asesoria-comunitaria",
    category: "profesionales",
    subCategory: "servicios_legales",
    paymentPreference: "none",
  };
  const cap12 = resolveBusinessCapabilities(s12, getPresetById("servicios_legales"));
  assert(cap12.payments === false, "E12: payments capability es false");
  assert(cap12.paymentMode === "NONE", "E12: paymentMode es NONE");

  // -------------------------------------------------------------
  // CASOS EXTREMOS Y TRANSICIONES DINÁMICAS
  // -------------------------------------------------------------
  console.log("\n⚡ Casos Extremos y Resiliencia de Navegación");

  // 1. Solo + 1 servicio vs Solo + varios servicios
  const sSolo1Serv: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    servicesList: [{ id: "1", name: "Consulta Única", duration: 30, bufferTime: 0, price: 50 }],
  };
  const capSolo1 = resolveBusinessCapabilities(sSolo1Serv);
  assert(capSolo1.services === true && capSolo1.multipleServices === false, "Caso Extremo: Solo + 1 servicio");

  const sSoloMultiServ: OnboardingAnswers = {
    ...createInitialOnboardingAnswers(),
    servicesList: [
      { id: "1", name: "Consulta Breve", duration: 20, bufferTime: 0, price: 30 },
      { id: "2", name: "Consulta Completa", duration: 60, bufferTime: 10, price: 80 },
    ],
  };
  const capSoloMulti = resolveBusinessCapabilities(sSoloMultiServ);
  assert(capSoloMulti.services === true && capSoloMulti.multipleServices === true, "Caso Extremo: Solo + múltiples servicios");

  // 2. Draft Recovery: persistencia de datos al cambiar de paso y regresar
  const draftTest: OnboardingDraft = {
    userId: "u-123",
    currentStepId: "services",
    completedStepIds: ["identity", "category", "workflow"],
    answers: s5,
    inferredCapabilities: cap5,
    lastUpdated: new Date().toISOString(),
    isFinished: false,
  };
  const serialized = JSON.stringify(draftTest);
  const parsedDraft: OnboardingDraft = JSON.parse(serialized);
  assert(parsedDraft.answers.businessName === "Aura Zen Spa", "Draft Recovery: Nombre persistido intacto");
  assert(parsedDraft.answers.staffList.length === 2, "Draft Recovery: Lista de personal persistida intacta");
  assert(parsedDraft.answers.resourcesList.length === 2, "Draft Recovery: Lista de recursos persistida intacta");

  // 3. Resiliencia de Desincronización de Paso (Desmarcar Team)
  // Si el usuario guardó un draft en "team" pero luego seleccionó "solo":
  const sRecoveredSolo: OnboardingAnswers = { ...s5, teamStructure: "solo" };
  const visibleForSolo = getVisibleSteps(sRecoveredSolo);
  const hasTeamInVisible = visibleForSolo.some((s) => s.id === "team");
  assert(!hasTeamInVisible, "Resiliencia: 'team' deja de ser visible si se cambia a 'solo'");

  console.log("\n-------------------------------------------------------");
  console.log(`TOTAL TESTS EJECUTADOS: ${passed + failed} | PASARON: \x1b[32m${passed}\x1b[0m | FALLARON: \x1b[31m${failed}\x1b[0m`);
  console.log("-------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runQAValidationSuite();
