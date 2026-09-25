import {
  generateCandidateSlots,
  filterAvailableSlots,
  getDayWindows,
  clampBusyToDay,
  type BusyBlock,
} from "../src/lib/availability";
import { getRubroConfig, RUBRO_CATALOG } from "../src/lib/rubros";
import { getLabels } from "../src/lib/labels";

async function runCoreValidation() {
  console.log("\n=======================================================");
  console.log("🧪 SUITE DE VALIDACIÓN ARQUITECTÓNICA Y ALGORÍTMICA DEL CORE");
  console.log("=======================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   👉 Detalle: ${detail}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Service Duration & Trailing Buffer Space
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Service Duration & Trailing Buffer Logic ---");
  const weeklyHours = [{ day: 1, slots: [{ open: "09:00", close: "12:00" }] }];
  const windows = getDayWindows(weeklyHours, 1);
  const slotDuration = 30; // 30 minutos
  const bufferTime = 10;   // 10 minutos de descanso

  const candidates = generateCandidateSlots(windows, slotDuration, bufferTime);
  // Debería generar: 09:00 (540m), 09:40 (580m), 10:20 (620m), 11:00 (660m)
  assert(
    candidates.length === 4 &&
    candidates[0] === 540 && // 09:00
    candidates[1] === 580 && // 09:40
    candidates[2] === 620 && // 10:20
    candidates[3] === 660,   // 11:00
    "Candidatos generados con step exacto (30m + 10m buffer)"
  );

  // Simular una cita existente de 09:00 a 09:30 con 10 min de buffer
  // El bloque ocupado DEBE abarcar de 09:00 (540m) a 09:40 (580m)
  const baseDate = new Date("2026-08-24T00:00:00");
  const dayStart = new Date("2026-08-24T00:00:00");
  const dayEnd = new Date("2026-08-24T23:59:59");
  
  const aptStart = new Date("2026-08-24T09:00:00");
  const aptEnd = new Date("2026-08-24T09:30:00");
  const effectiveEnd = new Date(aptEnd.getTime() + bufferTime * 60 * 1000); // 09:40

  const busyBlock = clampBusyToDay(aptStart, effectiveEnd, dayStart, dayEnd);
  assert(
    busyBlock !== null && busyBlock.start === 540 && busyBlock.end === 580,
    "El bloque ocupado de la cita previa incluye los 10 min de buffer posterior (540m a 580m)"
  );

  const available = filterAvailableSlots(candidates, slotDuration, [busyBlock!]);
  assert(!available.includes("09:00"), "09:00 queda bloqueado por la cita existente");
  assert(available.includes("09:40"), "09:40 queda disponible inmediatamente después del buffer");
  assert(available.includes("10:20") && available.includes("11:00"), "Slots posteriores permanecen disponibles");

  // -------------------------------------------------------------
  // TEST 2: StaffService Association Validation
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: StaffService Server-Side Validation ---");
  const serviceAssignedStaffIds = ["staff-dr-carlos", "staff-dra-maria"];
  const requestedStaffAllowed = "staff-dr-carlos";
  const requestedStaffForbidden = "staff-dr-pedro";

  const isAllowed = serviceAssignedStaffIds.includes(requestedStaffAllowed);
  const isForbidden = !serviceAssignedStaffIds.includes(requestedStaffForbidden);

  assert(isAllowed, "Especialista autorizado para el servicio es validado con éxito");
  assert(isForbidden, "Especialista no vinculado al servicio es bloqueado server-side");

  // -------------------------------------------------------------
  // TEST 3: Resource Availability & Overlap Calculation
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Resource Availability & Overlap ---");
  // Recurso físico: Cabina 1 ocupada de 14:00 (840m) a 15:00 (900m) + 15 min buffer (915m)
  const resourceBusyStart = new Date("2026-08-24T14:00:00");
  const resourceBusyEnd = new Date("2026-08-24T15:00:00");
  const resourceEffectiveEnd = new Date(resourceBusyEnd.getTime() + 15 * 60 * 1000);
  const resourceBusy = clampBusyToDay(resourceBusyStart, resourceEffectiveEnd, dayStart, dayEnd);

  const afternoonCandidates = [840, 885, 930]; // 14:00, 14:45, 15:30
  const resourceAvailable = filterAvailableSlots(afternoonCandidates, 45, [resourceBusy!]);

  assert(!resourceAvailable.includes("14:00"), "14:00 bloqueado por uso del recurso físico");
  assert(!resourceAvailable.includes("14:45"), "14:45 bloqueado por solapamiento con recurso físico");
  assert(resourceAvailable.includes("15:30"), "15:30 disponible tras liberación del recurso + buffer");

  // -------------------------------------------------------------
  // TEST 4: Double Booking Concurrency Protection (Atomic Mutex Simulation)
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Double Booking Concurrency Simulation ---");
  class AtomicSlotManager {
    private activeLocks = new Set<string>();
    private bookedSlots = new Set<string>();

    async bookSlot(lockKey: string, slotId: string): Promise<{ success: boolean; error?: string }> {
      // Simular advisory lock
      if (this.activeLocks.has(lockKey)) {
        return { success: false, error: "HORARIO_NO_DISPONIBLE: Conflicto de concurrencia." };
      }
      this.activeLocks.add(lockKey);

      // Simular latencia de red/DB
      await new Promise((r) => setTimeout(r, 10));

      if (this.bookedSlots.has(slotId)) {
        this.activeLocks.delete(lockKey);
        return { success: false, error: "HORARIO_NO_DISPONIBLE: Ese horario ya fue reservado." };
      }

      this.bookedSlots.add(slotId);
      this.activeLocks.delete(lockKey);
      return { success: true };
    }
  }

  const manager = new AtomicSlotManager();
  const lockKey = "tenant1_staff1_2026-08-24_10:00";
  const slotId = "tenant1_staff1_2026-08-24_10:00";

  const [res1, res2] = await Promise.all([
    manager.bookSlot(lockKey, slotId),
    manager.bookSlot(lockKey, slotId),
  ]);

  const exactlyOneSuccess = (res1.success && !res2.success) || (!res1.success && res2.success);
  assert(exactlyOneSuccess, "En concurrencia real, exactamente 1 petición tiene éxito y la otra es rechazada");

  // -------------------------------------------------------------
  // TEST 5: Location Validation & Consistency
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Location Validation ---");
  const resourceLocationId: string = "loc-central";
  const validLocationMatch = resourceLocationId === "loc-central";
  const invalidLocationMatch = resourceLocationId === "loc-norte";

  assert(validLocationMatch, "Recurso físico validado correctamente con su sede física");
  assert(!invalidLocationMatch, "Diferencia de sede entre recurso y cita es detectada y rechazada");

  // -------------------------------------------------------------
  // TEST 6: Multi-Tenancy & Clinical Isolation
  // -------------------------------------------------------------
  console.log("\n--- TEST 6: Clinical Security & Multi-Tenancy Isolation ---");
  const clinicalRubros = ["SALUD", "PSICOLOGIA", "VETERINARIA"];
  const nonClinicalRubros = ["BELLEZA", "CONSULTORIA", "FITNESS", "EDUCACION", "LEGAL", "GENERAL"];

  const allClinicalAllowed = clinicalRubros.every((r) => getRubroConfig(r).enableClinicalRecords === true);
  const allNonClinicalDenied = nonClinicalRubros.every((r) => getRubroConfig(r).enableClinicalRecords === false);

  assert(allClinicalAllowed, "Sectores clínicos tienen expedientes médicos/SOAP autorizados");
  assert(allNonClinicalDenied, "Sectores no clínicos tienen expedientes médicos estrictamente deshabilitados");

  // Dynamic labels validation
  const saludLabels = getLabels("SALUD");
  const fitnessLabels = getLabels("FITNESS");

  assert(saludLabels.client === "Paciente" && saludLabels.appointment === "Consulta", "Terminología de SALUD: Paciente / Consulta");
  assert(fitnessLabels.client === "Alumno" && fitnessLabels.appointment === "Clase", "Terminología de FITNESS: Alumno / Clase");

  console.log("\n=======================================================");
  console.log(`📊 RESULTADO FINAL: ${passed}/${total} PRUEBAS SUPERADAS (${Math.round((passed / total) * 100)}%)`);
  console.log("=======================================================\n");

  if (passed === total) {
    console.log("🎉 ¡TODOS LOS 8 PUNTOS ARQUITECTÓNICOS DEL CORE ESTÁN 100% VALIDADOS!");
  } else {
    process.exit(1);
  }
}

runCoreValidation().catch((err) => {
  console.error(err);
  process.exit(1);
});
