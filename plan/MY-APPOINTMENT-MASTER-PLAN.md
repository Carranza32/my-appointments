# My Appointment — Plan Maestro de Evolución Arquitectónica

## Contexto

Este documento es el plan de implementación para evolucionar el sistema actual **My Appointment** hacia una plataforma SaaS B2B de agendamiento general, configurable para distintos tipos de negocios.

El proyecto actual ya funciona como base y NO debe reconstruirse desde cero.

La implementación debe hacerse **sobre el código existente**, conservando las funcionalidades que ya funcionan y haciendo una refactorización progresiva y segura.

El objetivo es pasar de un sistema principalmente orientado a psicólogos, médicos, terapeutas y consultores a un **motor general de citas/reservas**, donde los módulos especializados puedan activarse según el tipo de negocio.

El sistema actual ya cuenta con:

- Next.js 16+ / App Router
- React
- Tailwind CSS
- Supabase Auth
- PostgreSQL / Supabase
- Prisma
- Multi-tenancy por subdominios
- Portal público de reservas
- Dashboard
- Clientes
- Citas
- Staff
- Sedes
- Formularios dinámicos
- Pagos por transferencia
- Google Calendar
- WhatsApp como integración parcial
- Expediente clínico
- Notas SOAP asistidas por IA

La arquitectura actual y estos módulos deben considerarse la línea base del proyecto.

---

# 1. Objetivo principal

Transformar My Appointment en:

> **Un motor de reservas configurable que pueda adaptarse a diferentes modelos de negocio sin duplicar la lógica de citas.**

Ejemplos de negocios objetivo:

- Psicólogos
- Médicos
- Dentistas
- Terapeutas
- Barberías
- Salones de belleza
- Spas
- Masajes
- Entrenadores
- Fitness
- Profesores / tutores
- Consultores
- Abogados
- Contadores
- Fotógrafos
- Técnicos
- Talleres
- Otros negocios basados en reservas

El sistema debe tener un **Core universal** y módulos especializados.

---

# 2. Principio arquitectónico fundamental

NO crear lógica como:

```ts
if (businessType === "PSYCHOLOGY") {
   ...
}

if (businessType === "BARBERSHOP") {
   ...
}
```

repetida por toda la aplicación.

En su lugar:

```text
CORE
  ↓
CAPABILITIES / FEATURES
  ↓
BUSINESS PRESETS
  ↓
SPECIALIZED MODULES
```

El tipo de negocio debe utilizarse principalmente para determinar una configuración inicial.

El Core debe funcionar independientemente del sector.

---

# 3. Arquitectura conceptual nueva

La plataforma debe organizarse conceptualmente así:

```text
TENANT / BUSINESS
│
├── BusinessConfig
├── Services
├── Clients
├── Staff
├── Locations
├── Resources
├── Availability
├── Appointments
├── Payments
├── Notifications
└── Integrations
        │
        └── Google Calendar / WhatsApp / etc.

SPECIALIZED MODULES
│
├── Clinical
├── Beauty
├── Fitness
├── Education
├── Automotive
└── Future modules
```

No todos los módulos especializados deben implementarse inmediatamente.

La arquitectura debe permitir agregarlos sin romper el Core.

---

# 4. Fase 0 — Auditoría obligatoria antes de modificar

Antes de modificar código:

1. Revisar el repositorio completo.
2. Revisar Prisma schema.
3. Revisar Server Actions.
4. Revisar Route Handlers.
5. Revisar componentes del portal público.
6. Revisar dashboard.
7. Revisar onboarding actual.
8. Revisar configuración de BusinessConfig.
9. Revisar Appointment.
10. Revisar Client.
11. Revisar Staff.
12. Revisar Location.
13. Revisar ClinicalRecord.
14. Revisar pagos.
15. Revisar Google Calendar.
16. Revisar middleware y multi-tenancy.
17. Revisar tests existentes.
18. Identificar funcionalidades actualmente funcionando que no deben romperse.

IMPORTANTE:

No hacer una migración destructiva ni borrar modelos existentes sin analizar primero sus relaciones.

Antes de cada migración importante, explicar:

- Qué cambia.
- Por qué cambia.
- Qué datos actuales afecta.
- Cómo se conserva la compatibilidad.

---

# 5. Core Domain

El Core debe quedar compuesto conceptualmente por:

```text
Tenant
Client
Service
Staff
Location
Resource
Availability
Appointment
Payment
Notification
Integration
BookingForm
```

---

# 6. Tenant / Business

El sistema actual utiliza User + BusinessConfig.

Mantener el funcionamiento actual para evitar una migración innecesaria.

Conceptualmente separar:

```text
User
=
cuenta/autenticación

Business/Tenant
=
negocio que utiliza My Appointment
```

Si una separación física `Tenant` todavía no es necesaria, NO introducirla solamente por estética.

La prioridad es mantener estabilidad.

El Tenant/Business debe ser el propietario lógico de:

- Services
- Clients
- Staff
- Locations
- Resources
- Appointments
- Payments
- Booking Forms
- Settings

Todo debe permanecer aislado por tenant.

---

# 7. BusinessConfig

El BusinessConfig actual debe evolucionar para dejar de ser un contenedor excesivamente grande.

Organizar conceptualmente la configuración en:

```text
identity
branding
localization
booking
terminology
features
```

Ejemplo conceptual:

```text
identity:
  businessName
  description
  slug

branding:
  logo
  avatar
  primaryColor

localization:
  timezone
  locale
  currency

booking:
  allowOnlineBooking
  allowCancellation
  cancellationWindow
  minimumAdvanceBooking

terminology:
  clientLabel
  staffLabel
  appointmentLabel

features:
  services
  staff
  locations
  resources
  payments
  questionnaires
  clinicalRecords
  classes
  memberships
  etc.
```

No es obligatorio guardar todos estos objetos como JSON.

Utilizar columnas/modelos normales cuando la información tenga relaciones o consultas frecuentes.

---

# 8. Service — NUEVO CONCEPTO FUNDAMENTAL

Agregar el concepto `Service`.

El sistema actual utiliza una duración global (`slotDuration`). Esa lógica debe dejar de ser el modelo principal.

Un negocio puede tener múltiples servicios con distintas duraciones y precios.

Ejemplos:

```text
Consulta psicológica
60 min
$40

Corte
30 min
$10

Corte + barba
60 min
$18

Consulta inicial
30 min
$50

Asesoría
60 min
$100
```

El modelo Service debe soportar como mínimo:

```text
id
tenantId
name
description
duration
bufferTime
price
currency
active
onlineBooking
requiresPayment
```

Agregar campos adicionales solo si realmente son necesarios.

---

# 9. Relación Staff ↔ Service

Un Staff no necesariamente puede realizar todos los servicios.

Agregar una relación entre:

```text
Staff
Service
```

Ejemplo:

```text
Juan
  - Corte
  - Barba

María
  - Corte
  - Tinte
  - Manicure
```

El motor de disponibilidad debe respetar esta relación.

---

# 10. Appointment

Mantener el modelo actual y generalizarlo.

Debe relacionarse conceptualmente con:

```text
Client
Service
Staff (opcional)
Location (opcional)
Resource (opcional)
Payment (opcional)
```

Campos conceptuales:

```text
id
tenantId
clientId
serviceId
staffId?
locationId?
resourceId?
startTime
endTime
status
paymentStatus
notes
cancellationReason?
source
metadata
createdAt
updatedAt
```

`source` debe permitir distinguir al menos:

```text
ONLINE
MANUAL
ADMIN
IMPORT
```

No eliminar campos actuales sin migración compatible.

---

# 11. Client

Mantener `Client` como nombre técnico universal.

No utilizar `Patient` como entidad base.

El sistema debe permitir cambiar la etiqueta mostrada al usuario mediante terminology:

```text
Paciente
Cliente
Alumno
Estudiante
Miembro
etc.
```

Ejemplo:

```text
technical model:
Client

psychology:
Paciente

barbershop:
Cliente

fitness:
Miembro
```

Esto evita duplicar el modelo por sector.

---

# 12. Resource — NUEVO CONCEPTO

Agregar `Resource`.

Un recurso es algo necesario para realizar una reserva pero que no necesariamente es una persona.

Ejemplos:

```text
Consultorio 1
Sala de masaje 2
Cancha 1
Estudio fotográfico
Equipo de diagnóstico
Vehículo/equipo
```

Conceptualmente:

```text
Resource
├── id
├── tenantId
├── locationId?
├── name
├── type
├── active
└── availability
```

El modelo debe permitir que una cita requiera:

```text
Staff
```

o:

```text
Resource
```

o:

```text
Staff + Resource
```

según la configuración.

---

# 13. Availability Engine

El cálculo actual de disponibilidad ya considera duración, buffer, citas existentes y Google Calendar.

Esa lógica debe evolucionar a un `Availability Engine`.

El motor debe considerar:

```text
Business availability
+
Staff availability
+
Location availability
+
Resource availability
+
Existing appointments
+
Google Calendar
+
Service duration
+
Service buffer
+
Booking rules
```

El resultado debe ser:

```text
Available Slots
```

La lógica debe estar centralizada.

Evitar implementar cálculos de disponibilidad duplicados en distintos componentes.

---

# 14. Availability

Separar conceptualmente:

```text
Business Availability
Staff Availability
Location Availability
Resource Availability
```

El sistema actual soporta horarios semanales y múltiples turnos. Mantener esa capacidad.

Debe seguir permitiendo:

```text
Lunes
08:00-12:00
14:00-18:00

Martes
09:00-17:00
```

No eliminar la configuración actual.

---

# 15. Booking Rules

Agregar una capa de reglas de reserva.

Debe permitir eventualmente:

```text
minimumAdvanceBooking
maximumAdvanceBooking
cancellationWindow
allowRescheduling
allowCancellation
requireClientPhone
requireClientEmail
requirePayment
```

No es necesario implementar todas las reglas en una sola fase si aumenta demasiado el riesgo.

Crear la estructura de forma extensible.

---

# 16. Dynamic Booking Forms

Mantener el sistema actual de formularios dinámicos.

Generalizarlo para que las preguntas puedan depender de:

```text
Tenant
Service
```

Ejemplos:

Psicología:

```text
¿Es tu primera consulta?
Motivo de consulta
```

Fotografía:

```text
Tipo de sesión
Número de personas
```

Taller:

```text
Marca
Modelo
Año
```

Las respuestas deben seguir asociadas a la Appointment/Booking correspondiente.

No convertirlas en columnas fijas.

---

# 17. Booking Flow

El portal público actual debe dejar de asumir un flujo fijo.

Actualmente existe:

```text
Sede
Especialista
Fecha
Hora
Formulario
Pago
Confirmación
```

Mantener esos componentes, pero convertirlos en pasos dinámicos.

Ejemplos:

### Psicólogo

```text
Service
→ Staff
→ Date
→ Time
→ Form
→ Payment
→ Confirmation
```

### Barbería

```text
Service
→ Staff
→ Date
→ Time
→ Client Data
→ Payment
→ Confirmation
```

### Consultor independiente

```text
Service
→ Date
→ Time
→ Client Data
→ Confirmation
```

### Taller

```text
Service
→ Date
→ Time
→ Vehicle Form
→ Client Data
→ Confirmation
```

El sistema debe decidir qué pasos mostrar según la configuración del tenant.

---

# 18. Business Presets

Crear una arquitectura de presets.

El preset NO debe contener toda la lógica del negocio.

Debe definir configuración inicial.

Ejemplos:

```text
PSYCHOLOGY
MEDICAL
DENTAL
BARBERSHOP
BEAUTY
SPA
FITNESS
CONSULTING
EDUCATION
AUTOMOTIVE
GENERIC
```

Cada preset puede definir:

```text
defaultTerminology
defaultFeatures
defaultBookingFlow
suggestedServices
suggestedQuestions
```

Ejemplo:

```text
PSYCHOLOGY

clientLabel = "Paciente"

features:
  appointments = true
  services = true
  questionnaires = true
  clinicalRecords = true
  aiClinicalNotes = true
  payments = true
  googleCalendar = true
```

BARBERSHOP:

```text
clientLabel = "Cliente"

features:
  appointments = true
  services = true
  staff = true
  locations = true
  payments = true
  reminders = true
```

---

# 19. Onboarding nuevo

Reemplazar progresivamente el onboarding actual de 5 pasos por un onboarding adaptativo.

No preguntar al usuario cosas técnicas.

## Paso 1

### ¿Qué tipo de negocio tienes?

Opciones:

```text
Salud
Belleza
Bienestar
Fitness
Consultoría
Educación
Servicios
Otro
```

## Paso 2

### ¿Cómo trabajas?

```text
Solo yo
Tengo un equipo
Tengo varios especialistas
Trabajo con clases/grupos
```

## Paso 3

### ¿Dónde atiendes?

```text
Una ubicación
Varias ubicaciones
Online
A domicilio
Combinado
```

## Paso 4

### ¿Qué quieres que puedan reservar tus clientes?

```text
Servicios
Consultas
Sesiones
Clases
Otro
```

## Paso 5

Configurar servicios.

## Paso 6

Configurar horarios.

## Paso 7

Configurar pagos.

## Paso 8

Publicar página.

Al final mostrar:

```text
Tu sistema de reservas está listo.
```

---

# 20. Onboarding debe generar configuración

El resultado del onboarding debe configurar:

```text
BusinessConfig
+
Features
+
Terminology
+
Services
+
Availability
+
Booking Flow
```

El usuario NO debería tener que entender la arquitectura interna.

---

# 21. Clinical Module

No eliminar el sistema clínico actual.

Convertirlo en módulo especializado.

Mantener:

```text
ClinicalRecord
SOAP
AI Clinical Notes
Consent
Clinical history
```

La IA de Gemini para estructuración SOAP debe seguir existiendo.

Pero debe activarse solamente cuando:

```text
features.clinicalRecords = true
```

o mediante el módulo clínico.

Una barbería no debe ver:

```text
Clinical Record
SOAP
```

Un psicólogo sí.

---

# 22. Payments

Separar conceptualmente Payment de Appointment.

Actualmente el sistema tiene:

```text
paymentStatus
paymentProofUrl
```

Mantener compatibilidad, pero evolucionar hacia:

```text
Payment
```

relacionado con Appointment.

Estados:

```text
PENDING
PROCESSING
PAID
FAILED
REFUNDED
```

Métodos iniciales:

```text
BANK_TRANSFER
CARD
CASH
ONLINE
```

No es necesario implementar todos inmediatamente.

Mantener funcionando:

```text
Bank Transfer
Upload Proof
Approve
Reject
```

y Wompi donde ya exista scaffolding.

---

# 23. Notifications

Crear conceptualmente un módulo de notificaciones.

Eventos:

```text
AppointmentCreated
AppointmentConfirmed
AppointmentCancelled
AppointmentRescheduled
AppointmentReminder
PaymentApproved
PaymentRejected
```

Canales futuros:

```text
Email
WhatsApp
SMS
```

La implementación actual de WhatsApp puede permanecer como está mientras se prepara esta arquitectura.

No implementar una integración compleja de WhatsApp solamente por este refactor.

---

# 24. Google Calendar

Mantener Google Calendar.

Debe integrarse con Availability Engine.

Conceptualmente:

```text
Google Calendar
      ↓
Busy periods
      ↓
Availability Engine
      ↓
Available Slots
```

Los tokens deben continuar almacenándose de forma segura en backend.

---

# 25. Dashboard

Mantener la estructura actual:

```text
Overview
Appointments
Clients
Payments
Settings
Staff
Locations
```

Pero hacer el dashboard consciente de Features.

Core:

```text
Appointments
Clients
Services
Payments
```

Opcionales:

```text
Staff
Locations
Resources
Forms
Clinical
Reports
```

No mostrar navegación de módulos desactivados.

---

# 26. Dashboard configurable

Ejemplo:

## Psicología

```text
Inicio
Citas
Pacientes
Servicios
Expedientes
Pagos
Configuración
```

## Barbería

```text
Inicio
Citas
Clientes
Servicios
Barberos
Pagos
Configuración
```

## Consultor

```text
Inicio
Citas
Clientes
Servicios
Pagos
Configuración
```

La terminología debe provenir de configuración.

---

# 27. Settings

Mantener el diseño actual tipo macOS.

Reorganizar:

```text
General
├── Business Profile
├── Branding
└── Terminology

Booking
├── Services
├── Availability
├── Booking Rules
└── Forms

Team
├── Staff
└── Roles

Locations
├── Locations
└── Resources

Payments
├── Payment Methods
└── Configuration

Notifications
├── Email
├── WhatsApp
└── Reminders

Integrations
├── Google Calendar
└── WhatsApp

Specialized
└── Clinical
```

---

# 28. Terminology System

Implementar un pequeño sistema de etiquetas configurables.

Ejemplo:

```text
clientLabel
staffLabel
appointmentLabel
locationLabel
serviceLabel
```

Valores posibles:

```text
Paciente
Cliente
Alumno
Miembro
Profesional
Especialista
Barbero
Médico
Terapeuta
etc.
```

El modelo técnico no cambia.

Solo cambia la presentación.

---

# 29. Multi-tenancy

NO romper la arquitectura actual por subdominios.

Mantener:

```text
tenant.myappointment.com
```

El middleware actual debe continuar resolviendo el tenant y cargando el portal público.

Toda consulta de datos privados debe seguir filtrada por tenant/user.

La seguridad multi-tenant tiene prioridad absoluta.

---

# 30. Migración de datos

La migración debe ser segura.

Para datos existentes:

### Appointment actual

Crear/migrar un Service por defecto.

Ejemplo:

```text
Servicio general
```

y asociar las citas actuales.

La duración anterior debe conservarse donde sea necesario.

### BusinessConfig

Migrar la información actual a la nueva estructura.

### ClinicalRecord

No modificar innecesariamente.

### Staff

Conservar horarios y relaciones.

### Location

Conservar relaciones existentes.

Nunca eliminar datos existentes solamente para simplificar el nuevo modelo.

---

# 31. Compatibilidad hacia atrás

Durante la transición:

- Las rutas actuales deben continuar funcionando.
- Las Server Actions existentes deben mantenerse hasta ser reemplazadas.
- Los componentes reutilizables deben mantenerse cuando sea posible.
- Las migraciones deben ser incrementales.
- Evitar una reescritura total.

Si una API interna cambia:

1. Crear la nueva implementación.
2. Migrar consumidores.
3. Verificar.
4. Eliminar la implementación vieja solamente cuando ya no se use.

---

# 32. Orden de implementación

NO intentar implementar todo simultáneamente.

Seguir este orden:

## Fase 1

Auditoría del proyecto actual.

Entregar primero un reporte:

```text
Current Architecture
Current Prisma Models
Current Booking Flow
Current Dependencies
Potential Breaking Changes
Migration Strategy
```

NO modificar código durante esta auditoría.

---

## Fase 2

Crear `Service`.

Implementar:

- Prisma model
- CRUD
- Dashboard
- relación con Appointment
- relación Staff ↔ Service

Migrar citas existentes a un servicio por defecto.

---

## Fase 3

Refactorizar Appointment.

Agregar:

```text
serviceId
```

y preparar:

```text
resourceId
source
```

sin romper reservas actuales.

---

## Fase 4

Crear Availability Engine.

Centralizar:

```text
Business hours
Staff hours
Location
Resource
Appointments
Google Calendar
Service duration
Buffer
```

---

## Fase 5

Crear Resource.

Implementar:

- modelo
- CRUD
- disponibilidad
- relación con Location
- relación con Service/Appointment cuando sea necesario

---

## Fase 6

Generalizar Booking Flow.

Hacer pasos configurables.

---

## Fase 7

Rediseñar Onboarding.

Crear presets.

---

## Fase 8

Generalizar Dashboard y Settings.

Implementar feature visibility y terminology.

---

## Fase 9

Separar módulos especializados.

Primero:

```text
Clinical
```

porque ya existe.

Después dejar preparada la arquitectura para:

```text
Beauty
Fitness
Education
Automotive
```

No es necesario implementar todos ahora.

---

## Fase 10

Notifications.

Preparar eventos y canales.

---

# 33. Criterios de aceptación

La refactorización será correcta si:

### Caso 1 — Psicólogo

Puede:

```text
Crear servicio
Configurar duración
Configurar horario
Recibir reservas
Seleccionar paciente
Usar formulario
Gestionar pago
Usar Google Calendar
Ver expediente
Generar SOAP con IA
```

---

### Caso 2 — Barbería

Puede:

```text
Crear servicios
Definir duración y precio
Crear barberos
Asignar servicios a barberos
Configurar horarios
Recibir reservas
Gestionar clientes
Gestionar pagos
```

Y NO debe aparecer:

```text
Clinical Records
SOAP
```

---

### Caso 3 — Consultor independiente

Puede:

```text
Crear servicios
Configurar duración
Configurar disponibilidad
Recibir reservas
Gestionar clientes
Google Calendar
```

No debe necesitar Staff ni Location.

---

### Caso 4 — Negocio con varias sedes

Debe poder:

```text
Crear Location
Asignar Staff
Asignar Services
Recibir Appointment
```

y el motor de disponibilidad debe respetar la sede.

---

### Caso 5 — Negocio con recursos

Debe poder:

```text
Crear Resource
Asignarlo a Location
Definir disponibilidad
Evitar doble reserva
```

---

# 34. Reglas importantes para la implementación

1. No reescribir el proyecto desde cero.
2. No eliminar funcionalidades existentes sin justificación.
3. No hacer migraciones destructivas.
4. No duplicar lógica por tipo de negocio.
5. No hardcodear textos de sectores.
6. No asumir que todos los negocios tienen Staff.
7. No asumir que todos tienen Location.
8. No asumir que todos tienen Resource.
9. No asumir que todos requieren Payment.
10. No asumir que todos necesitan formularios.
11. No asumir que todos necesitan Clinical Records.
12. El Core debe ser independiente del sector.
13. El onboarding debe configurar el sistema.
14. Los presets deben ser configuraciones iniciales, no bloques de lógica.
15. Mantener el aislamiento multi-tenant.
16. Mantener TypeScript estricto.
17. Mantener Prisma como ORM.
18. Mantener Supabase.
19. Mantener el sistema visual Liquid Glass existente.
20. Priorizar código mantenible sobre soluciones rápidas.

---

# 35. Importante sobre UX

El usuario final NO debe sentir que está configurando una plataforma empresarial compleja.

Debe sentir:

> "Estoy configurando mi sistema de citas."

La complejidad debe permanecer detrás del sistema.

El onboarding debe preguntar cosas humanas:

```text
¿Qué haces?
¿Cómo trabajas?
¿Dónde atiendes?
¿Qué quieres que puedan reservar?
```

No:

```text
¿Necesita Resource?
¿Tiene Staff Assignment?
¿Desea Availability Scope?
```

---

# 36. Resultado esperado

Al terminar esta evolución, My Appointment debe poder describirse así:

> **My Appointment es una plataforma SaaS multi-tenant para gestionar reservas, clientes, servicios, disponibilidad, equipos, ubicaciones, pagos y comunicaciones, con módulos especializados que se adaptan al tipo de negocio.**

La arquitectura debe permitir que un nuevo vertical pueda agregarse sin modificar el núcleo de citas.

Por ejemplo, para agregar "Dentistry" debería bastar con crear:

```text
Dental preset
+
Dental module
```

sin reescribir:

```text
Appointment
Availability
Client
Service
Payment
```

---

# 37. Prioridad

Prioridad máxima:

```text
1. Estabilidad
2. Core Domain
3. Service
4. Appointment
5. Availability
6. Booking Flow
7. Onboarding
8. Features
9. Specialized Modules
10. UX polish
```

No sacrificar estabilidad por implementar demasiadas features.

---

# 38. Forma de trabajo solicitada

Trabajar de forma incremental.

Antes de cada fase:

1. Explicar qué archivos/modelos serán afectados.
2. Explicar la estrategia.
3. Implementar.
4. Ejecutar validaciones.
5. Ejecutar Prisma validation/migration según corresponda.
6. Ejecutar lint/typecheck/tests disponibles.
7. Verificar que el flujo actual siga funcionando.
8. Documentar cambios.
9. Continuar con la siguiente fase.

No avanzar sobre errores ocultos.

Si se encuentra una contradicción entre este documento y el código actual, analizar primero el código existente y explicar la diferencia antes de tomar una decisión.

---

# 39. Primera tarea inmediata

NO comenzar modificando Prisma inmediatamente.

Primero:

## AUDITAR EL PROYECTO ACTUAL

Necesito un reporte con:

### A. Modelos actuales

```text
User
BusinessConfig
Appointment
Client
ClinicalRecord
Staff
Location
GoogleAccount
etc.
```

### B. Relaciones actuales

### C. Booking Flow actual

### D. Availability actual

### E. Payment Flow actual

### F. Onboarding actual

### G. Multi-tenancy

### H. Server Actions relevantes

### I. Componentes que deberán refactorizarse

### J. Riesgos

### K. Plan de migración concreto

Después de ese reporte, comenzar únicamente con la Fase 2: `Service`.

No realizar una reescritura completa antes de validar la arquitectura contra el código real.

---

# 40. Filosofía final

El objetivo NO es construir "un sistema para cada profesión".

El objetivo es construir:

```text
                MY APPOINTMENT
                       │
                APPOINTMENT CORE
                       │
       ┌───────────────┼────────────────┐
       │               │                │
    BUSINESS         SERVICE         CLIENT
       │               │                │
       ├───────────────┼────────────────┤
       │               │                │
     STAFF          LOCATION         RESOURCE
                       │
                  AVAILABILITY
                       │
                  APPOINTMENT
                       │
             ┌─────────┼─────────┐
             │         │         │
          PAYMENT  NOTIFICATION CALENDAR

                       +

             SPECIALIZED MODULES
                       │
          ┌────────────┼────────────┐
          │            │            │
       CLINICAL      BEAUTY       FITNESS
```

Construir el Core correctamente permitirá que My Appointment pueda crecer hacia múltiples mercados sin convertir el código en una colección de condiciones específicas por profesión.

**La regla principal: generalizar el motor, especializar la experiencia.**
