import { getRubroConfig } from "./rubros";

export function getLabels(rubro: string) {
  const config = getRubroConfig(rubro);
  
  // Pluralizaciones especiales en español
  const appointmentsPlural = 
    config.appointmentLabel === "Sesión" 
      ? "Sesiones" 
      : `${config.appointmentLabel}s`;

  let serviceLabel = "Servicio";
  let servicePlural = "Servicios";
  let staffLabel = "Especialista";
  let staffPlural = "Especialistas";
  let locationLabel = "Sede";
  let locationPlural = "Sedes";

  const norm = (rubro || "").toUpperCase();
  const isMedicina = norm === "SALUD" || norm === "MEDICINA_GENERAL" || norm.includes("MEDIC") || (norm.includes("SALUD") && !norm.includes("PSICO"));
  const isPsicologia = norm === "PSICOLOGIA" || norm.includes("PSICO");

  if (isMedicina || isPsicologia) {
    serviceLabel = isMedicina ? "Tratamiento / Consulta" : "Tipo de Sesión";
    servicePlural = isMedicina ? "Tratamientos y Servicios" : "Servicios Terapéuticos";
    staffLabel = isMedicina ? "Médico / Especialista" : "Terapeuta";
    staffPlural = isMedicina ? "Especialistas y Médicos" : "Terapeutas";
    locationLabel = "Consultorio / Sede";
    locationPlural = "Consultorios";
  } else if (norm === "FITNESS" || norm === "EDUCACION") {
    serviceLabel = "Clase / Disciplina";
    servicePlural = "Clases y Disciplinas";
    staffLabel = "Instructor / Tutor";
    staffPlural = "Instructores";
    locationLabel = "Estudio / Sede";
    locationPlural = "Estudios y Sedes";
  } else if (norm === "BELLEZA") {
    serviceLabel = "Servicio / Tratamiento";
    servicePlural = "Servicios de Belleza";
    staffLabel = "Estilista / Especialista";
    staffPlural = "Estilistas";
    locationLabel = "Sucursal";
    locationPlural = "Sucursales";
  }
      
  return {
    client: config.clientLabel,                      // "Paciente" | "Cliente" | "Alumno"
    clients: `${config.clientLabel}s`,                // "Pacientes" | "Clientes"
    appointment: config.appointmentLabel,            // "Consulta" | "Cita" | "Sesión" | "Clase"
    appointments: appointmentsPlural,                // "Consultas" | "Citas" | "Sesiones" | "Clases"
    service: serviceLabel,
    services: servicePlural,
    staff: staffLabel,
    staffs: staffPlural,
    location: locationLabel,
    locations: locationPlural,
    enableClinicalRecords: config.enableClinicalRecords,
    bookAction: `Agendar ${config.appointmentLabel}`,  // "Agendar Consulta" | "Reservar Cita"
  };
}
