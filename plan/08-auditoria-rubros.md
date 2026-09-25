# Auditoría Integral de Producto y Arquitectura por Rubro

**Documento:** `plan/08-auditoria-rubros.md`  
**Rol:** Product Planner 100% & Lead Architect  
**Propósito:** Certificación funcional y matriz de requerimientos vertical por vertical para validar el sistema rubro por rubro al 100% sin comprometer utilidades compartidas.

---

## 🧠 PARTE 1: Auditoría del Rubro Activo: Psicología y Salud Mental (`PSICOLOGIA`)

Cuenta activa de prueba: **Clínica Mente Sana** (`PSICOLOGIA`).

### ✅ Lo que ya está completado y 100% funcional:
1. **Nomenclatura y Vocabulario Especializado:**
   - Términos dinámicos en todo el sistema: *Pacientes*, *Sesiones*, *Terapeutas*, *Consultorios*, *Servicios Terapéuticos* y acción *Agendar Sesión*.
2. **Flujo de Reserva Adaptativo (Portal Público `/mente-sana`):**
   - Detección inteligente de modalidad (Online vs. Presencial).
   - Bloqueo estricto de horarios pasados (incluso del mismo día si ya transcurrió la hora).
   - Deshabilitación de fechas sin disponibilidad real de agenda.
   - Selección de terapeuta específico o cualquiera disponible.
3. **Formulario de Admisión Clínica (Intake Form):**
   - Preguntas específicas del rubro: *"¿Es tu primera vez en terapia?"* y *"Motivo de la consulta"*.
4. **Videollamadas Online Integradas:**
   - Generación y guardado directo de enlaces para **Google Meet** y **Zoom** en el modal de detalle de la sesión.
5. **Confirmación y Recordatorio Automatizado por WhatsApp:**
   - Mensaje estructurado con links seguros de un clic para confirmar o cancelar la sesión de forma instantánea.
6. **Expedientes Clínicos SOAP con Asistente de IA en Vivo:**
   - Notas estructuradas en esquema médico SOAP (Subjetivo, Objetivo, Análisis, Plan) generadas o formateadas por IA.
   - Pestaña de expediente clínico dentro de la ficha del paciente (`/dashboard/clientes`) y módulo general (`/dashboard/expedientes`).
7. **Diseño Apple Design System:**
   - Modales ergonómicos con arquitectura de 3 niveles (Header fijo, Body desplazable con Inset Cards y Footer sticky).

### 🔍 Puntos de refinamiento para cerrar Psicología al 100%:
- **Consentimiento Informado Digital:** Permitir que el paciente acepte términos de confidencialidad o consentimiento en su primera cita.
- **Frecuencia / Recurrencia:** Soporte para agendar bloques periódicos (ej. cada semana al mismo horario).
- **Privacidad del Expediente:** Garantizar que las notas clínicas SOAP sean estrictamente confidenciales y exclusivas del panel del terapeuta, sin exposición pública.

---

## 📊 PARTE 2: Matriz Comparativa de los 9 Rubros Soportados

| # | Rubro ID | Nombre Comercial | Cliente | Cita | Profesional | Módulo Clínico SOAP | Tipo de Flujo de Reserva |
|---|---|---|---|---|---|:---:|---|
| **1** | `PSICOLOGIA` | Psicología y Salud Mental | Paciente | Sesión | Terapeuta | ✅ Activo | Servicio (Online/Presencial) → Terapeuta |
| **2** | `SALUD` | Salud y Medicina | Paciente | Consulta | Médico / Especialista | ✅ Activo | Especialidad → Médico → Consultorio |
| **3** | `BELLEZA` | Belleza, Spas y Barberías | Cliente | Cita | Estilista / Barbero | ❌ Oculto | Servicio → Estilista → Hora |
| **4** | `FITNESS` | Fitness, Deportes y Canchas | Alumno / Jugador | Clase / Reserva | Instructor / Cancha | ❌ Oculto | Cancha / Clase → Cupo / Hora |
| **5** | `EDUCACION` | Educación y Tutorías | Estudiante | Clase | Profesor / Tutor | ❌ Oculto | Materia / Grado → Tutor → Hora |
| **6** | `VETERINARIA` | Veterinaria y Cuidado Animal | Dueño | Consulta | Veterinario | ✅ Activo (Mascota) | Mascota / Especie → Servicio |
| **7** | `LEGAL` | Servicios Legales y Notariales | Cliente | Consulta Jurídica | Abogado / Notario | ❌ Oculto | Área Legal → Caso → Abogado |
| **8** | `CONSULTORIA` | Consultoría y Coaching | Cliente | Sesión | Consultor / Coach | ❌ Oculto | Sesión Virtual → Asesor → Hora |
| **9** | `GENERAL` | General / Otros Negocios | Cliente | Cita | Especialista | ❌ Oculto | Servicio estándar → Horario |

---

## 🔬 PARTE 3: Especificación de Comportamiento por Rubro

### 1. 🧠 Psicología y Salud Mental (`PSICOLOGIA`)
- **Vocabulario:** Paciente, Sesión, Terapeuta, Consultorio.
- **Formulario Intake:** *Motivo de consulta*, *¿Primera vez en terapia? (Sí/No)*.
- **Comportamiento:** Videollamada Meet/Zoom prioritaria, expedientes SOAP con IA, cobro posterior o en sesión (sin forzar pago previo).

### 2. 🩺 Salud y Medicina (`SALUD`)
- **Vocabulario:** Paciente, Consulta, Médico, Consultorio.
- **Formulario Intake:** *Motivo de consulta*, *Alergias*, *Medicamentos actuales*, *Seguro médico*.
- **Comportamiento:** Expedientes médicos con antecedentes clínicos, recetas y diagnósticos. Asignación de consultorios físicos por sede.

### 3. 💇 Belleza y Estética (`BELLEZA`)
- **Vocabulario:** Cliente, Cita, Estilista / Barbero, Sucursal.
- **Formulario Intake:** *Tipo de corte o tratamiento*, *Alergias a tintes/químicos*.
- **Comportamiento:** 
  - 🚫 **Ocultar totalmente Expedientes Clínicos:** No debe figurar en el sidebar ni en clientes.
  - **Preferencia de Profesional:** El cliente casi siempre busca a su estilista de confianza.
  - **Anticipo / Depósito (No-Show):** Cobro previo de anticipo para apartar sillón o cabina.

### 4. 🏋️ Fitness y Deportes (`FITNESS`)
- **Vocabulario:** Alumno / Jugador, Clase / Partido, Instructor, Estudio / Cancha.
- **Formulario Intake:** *Nivel de experiencia (Principiante / Intermedio / Avanzado)*, *Lesiones recientes*.
- **Comportamiento:**
  - 🚫 **Ocultar Expedientes Clínicos.**
  - **Flujo Resource-First:** En alquiler de canchas (Pádel, Tenis, Fútbol), el cliente elige primero el recurso (Cancha 1, Cancha 2) y horario, sin seleccionar personal.
  - **Clases con Cupo:** Capacidad máxima por horario (ej. 15 alumnos por clase de yoga).

### 5. 🎓 Educación y Tutorías (`EDUCACION`)
- **Vocabulario:** Estudiante / Padre, Clase, Profesor / Tutor, Aula / Sede.
- **Formulario Intake:** *Materia*, *Nivel académico (Primaria, Secundaria, Universidad)*, *Tema de refuerzo*.
- **Comportamiento:**
  - 🚫 **Ocultar Expedientes Clínicos.**
  - Enfoque prioritario en sesiones remotas (Meet/Zoom) o aulas presenciales.
  - Registro de progreso pedagógico y tareas.

### 6. 🐾 Veterinaria (`VETERINARIA`)
- **Vocabulario:** Dueño (Contacto), Mascota (Paciente), Consulta, Veterinario, Clínica.
- **Formulario Intake:** *Nombre de la mascota*, *Especie (Perro, Gato, etc.)*, *Raza / Edad*, *Motivo*.
- **Comportamiento:**
  - **Expediente Clínico Veterinario:** Historial de vacunas, desparasitación, peso y cirugías vinculado al nombre de la mascota.
  - Diferenciación entre servicios clínicos (Cirugía, Vacunación) y servicios estéticos (Baño y Corte).

### 7. ⚖️ Servicios Legales (`LEGAL`)
- **Vocabulario:** Cliente, Consulta Jurídica, Abogado / Asociado, Despacho.
- **Formulario Intake:** *Área del derecho (Civil, Penal, Laboral, Corporativo)*, *Resumen confidencial del caso*.
- **Comportamiento:**
  - 🚫 **Ocultar Expedientes Médicos.**
  - Repositorio de documentos confidenciales (demandas, contratos, identificaciones).
  - Cobro por honorarios de consulta inicial o tarifa por hora.

### 8. 💼 Consultoría y Coaching (`CONSULTORIA`)
- **Vocabulario:** Cliente / Empresa, Sesión Estratégica, Asesor / Coach.
- **Formulario Intake:** *Tema de la sesión*, *Objetivos de negocio*, *Cargo / Rol*.
- **Comportamiento:**
  - 🚫 **Ocultar Expedientes Médicos.**
  - 100% orientado a videollamadas virtuales (Google Meet / Zoom).
  - Bitácora de compromisos y tareas acordadas entre sesiones.

### 9. 🗓️ General (`GENERAL`)
- **Vocabulario:** Cliente, Cita, Especialista, Servicio.
- **Formulario Intake:** *Notas adicionales*.
- **Comportamiento:** Flujo estándar neutro para cualquier negocio de servicios.

---

## 🚀 Hoja de Ruta de Pruebas Vertical por Vertical

1. **Fase 1 (Activa):** Cerrar y certificar **Psicología y Salud Mental**.
2. **Fase 2:** Crear cuenta de prueba para **Belleza y Estética** (`BELLEZA`) y validar que desaparezcan los expedientes médicos, los términos cambien a citas/estilistas y se activen anticipos.
3. **Fase 3:** Probar **Fitness y Canchas** (`FITNESS`) validando selección de canchas/recursos y cupos.
4. **Fase 4:** Probar **Veterinaria** (`VETERINARIA`) con campos de mascota y especie.
5. **Fase 5:** Probar **Educación**, **Legal** y **Consultoría**.
