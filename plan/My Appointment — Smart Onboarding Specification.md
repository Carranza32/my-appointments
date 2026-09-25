# My Appointment — Smart Onboarding Specification

## Objetivo

El Core del sistema ya fue endurecido y validado con 17/17 pruebas.

No crear nuevas funcionalidades del motor de reservas en esta etapa.

La siguiente prioridad es diseñar e implementar un **Smart Onboarding** que permita que My Appointment determine qué necesita cada negocio y configure automáticamente su experiencia.

El onboarding debe funcionar como un "configurador inteligente" del producto.

El usuario no debe necesitar conocer conceptos técnicos como:

- Staff
- Resource
- Availability Engine
- Features
- Booking Flow
- Location
- Service assignment

El usuario debe responder preguntas sencillas sobre su negocio y My Appointment debe traducir esas respuestas a configuración interna.

---

# 1. Principio principal

El onboarding debe responder:

> "¿Qué tipo de negocio es?"

pero también:

> "¿Cómo funciona ese negocio?"

No debemos depender únicamente del rubro.

Dos negocios del mismo rubro pueden funcionar de formas diferentes.

Ejemplo:

### Barbería A

Una persona trabajando sola.

### Barbería B

Cinco barberos y dos sucursales.

Ambos son BARBERSHOP, pero necesitan configuraciones diferentes.

Por lo tanto:

```text
Business Type
+
Business Workflow
=
Final Configuration
```

---

# 2. Separar Preset de Configuration

El preset solamente debe proporcionar:

- Terminología inicial
- Servicios sugeridos
- Preguntas sugeridas
- Features recomendadas
- Booking flow recomendado

Pero las respuestas del onboarding deben poder modificar esas recomendaciones.

Conceptualmente:

```text
PRESET
   ↓
RECOMMENDATIONS
   ↓
USER ANSWERS
   ↓
FINAL CONFIGURATION
```

Nunca:

```text
PRESET
   ↓
HARD-CODED FINAL CONFIGURATION
```

---

# 3. Paso 1 — Tipo de negocio

Pregunta:

> ¿Qué tipo de negocio tienes?

Mostrar categorías amigables:

### Salud
- Psicología
- Medicina
- Odontología
- Veterinaria
- Otro servicio de salud

### Belleza
- Barbería
- Salón de belleza
- Spa
- Estética

### Bienestar
- Masajes
- Terapias
- Coaching
- Bienestar

### Fitness
- Entrenamiento personal
- Gimnasio
- Yoga
- Pilates

### Educación
- Tutorías
- Clases particulares
- Academia

### Profesionales
- Consultoría
- Abogados
- Contadores
- Servicios profesionales

### Servicios
- Fotografía
- Reparaciones
- Talleres
- Servicios técnicos

### Reservas físicas
- Canchas
- Salas
- Estudios
- Espacios
- Otros

### Otro

Si selecciona "Otro", permitir describir el negocio.

---

# 4. Paso 2 — Cómo funciona el negocio

Esta sección es más importante que el rubro.

Preguntar:

## ¿Quién realiza el servicio?

Opciones:

```text
Solo yo
Tengo varias personas
Los clientes pueden elegir quién los atiende
No importa quién lo atienda
```

Esto debe ayudar a determinar si se necesita:

```text
Staff
StaffService
Staff selection
```

---

# 5. Paso 3 — Qué se reserva

Pregunta:

> ¿Qué quieres que tus clientes puedan reservar?

Opciones:

```text
Servicios
Consultas
Sesiones
Clases
Espacios
Equipos
Otro
```

No mostrar términos técnicos.

Internamente mapear:

```text
Service
Resource
Appointment
```

---

# 6. Paso 4 — ¿Necesitas una persona específica?

Pregunta:

> ¿Tus clientes necesitan elegir quién los atenderá?

Opciones:

```text
Sí
No
Depende del servicio
```

Mapear:

```text
requiresStaffSelection
```

No crear lógica duplicada por sector.

---

# 7. Paso 5 — Ubicación

Pregunta:

> ¿Dónde atiendes a tus clientes?

Opciones:

```text
En un solo lugar
En varios lugares
Online
A domicilio
Combinado
```

Si selecciona varios lugares:

```text
habilitar Locations
```

Si selecciona uno:

```text
crear/configurar una Location
```

Si selecciona online:

```text
permitir modalidad online
```

No obligar al usuario a configurar Locations si no las necesita.

---

# 8. Paso 6 — Recursos físicos

Esta pregunta debe aparecer solamente cuando sea relevante.

Ejemplo:

> ¿Para prestar tu servicio necesitas reservar un espacio, equipo o recurso físico?

Opciones:

```text
Sí
No
```

Si responde Sí:

> ¿Qué necesitas reservar?

Ejemplos:

```text
Consultorios
Cabinas
Canchas
Salas
Equipos
Vehículos
Otro
```

Internamente:

```text
Resource
```

No utilizar la palabra "Resource" en la interfaz.

---

# 9. Paso 7 — Servicios

Mostrar los servicios sugeridos por el preset.

Ejemplo:

```text
Corte
30 min
$10

Corte + barba
60 min
$18
```

Permitir:

```text
Editar
Eliminar
Agregar servicio
```

Cada servicio debe permitir:

```text
Nombre
Descripción
Duración
Buffer
Precio
```

No obligar a utilizar los servicios sugeridos.

---

# 10. Paso 8 — Personas

Si el negocio utiliza Staff:

Preguntar:

> ¿Quién atiende a tus clientes?

Permitir agregar:

```text
Nombre
Foto opcional
Servicios que realiza
Horario
```

Ejemplo:

```text
Juan
✓ Corte
✓ Barba

Carlos
✓ Corte
```

El onboarding debe configurar automáticamente las relaciones StaffService.

---

# 11. Paso 9 — Horarios

Pregunta:

> ¿Cuándo atiendes?

Utilizar una interfaz visual sencilla.

Ejemplo:

```text
Lunes
08:00 ─ 12:00
14:00 ─ 18:00

Martes
08:00 ─ 12:00
14:00 ─ 18:00
```

Permitir:

```text
Copiar horario
```

y:

```text
Agregar segundo turno
```

No utilizar términos técnicos como Availability Engine.

---

# 12. Paso 10 — Pagos

Pregunta:

> ¿Cómo quieres cobrar?

Opciones:

```text
El cliente paga al reservar
El cliente paga después
Acepto ambos
No necesito pagos
```

Si requiere pago:

Mostrar únicamente los métodos configurados/disponibles.

No obligar a configurar pagos si el negocio no los necesita.

---

# 13. Paso 11 — Información del cliente

Pregunta:

> ¿Qué información necesitas de tus clientes?

Base:

```text
Nombre
Teléfono
Email
```

Después:

```text
¿Necesitas hacer preguntas adicionales antes de la cita?
```

Si sí:

Mostrar constructor simple de preguntas.

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
Marca del vehículo
Modelo
Año
```

---

# 14. Paso 12 — Funciones recomendadas

Antes de finalizar, mostrar:

> Hemos configurado estas funciones para tu negocio.

Ejemplo:

### Psicología

```text
✓ Reservas online
✓ Servicios
✓ Formularios
✓ Expedientes clínicos
✓ Notas SOAP
✓ Google Calendar
✓ Recordatorios
```

### Barbería

```text
✓ Reservas online
✓ Servicios
✓ Barberos
✓ Horarios
✓ Pagos
✓ Recordatorios
```

### Canchas

```text
✓ Reservas online
✓ Servicios
✓ Canchas
✓ Disponibilidad
✓ Pagos
✓ Recordatorios
```

El usuario debe poder activar/desactivar funciones opcionales antes de finalizar.

---

# 15. Resumen final

Antes de crear la configuración definitiva:

Mostrar:

```text
Así quedará tu sistema
```

Ejemplo:

### Tu negocio

Barbería

### Servicios

3

### Equipo

4 barberos

### Ubicaciones

2

### Reservas

Los clientes podrán:

1. Elegir servicio
2. Elegir barbero
3. Elegir sucursal
4. Elegir fecha
5. Elegir hora
6. Completar sus datos
7. Pagar

### Funciones activadas

```text
✓ Servicios
✓ Barberos
✓ Sucursales
✓ Pagos
✓ Recordatorios
✓ Reservas online
```

Esto permite al usuario entender qué acaba de configurar.

---

# 16. Configuración final

El onboarding debe producir una configuración equivalente a:

```text
BusinessConfig
+
Terminology
+
Features
+
Services
+
Staff
+
StaffService
+
Locations
+
Resources
+
Availability
+
BookingRules
+
BookingForm
```

No crear entidades que el negocio no necesita.

---

# 17. Regla fundamental de Features

Las features deben derivarse de las respuestas.

Ejemplo:

```text
hasStaff = false
```

No mostrar:

```text
Staff
```

en el dashboard.

Si:

```text
hasResources = false
```

no mostrar:

```text
Resources
```

Si:

```text
clinical = false
```

no mostrar:

```text
Clinical
```

Si:

```text
hasPayments = false
```

no mostrar configuración de pagos innecesaria.

---

# 18. Booking Flow generado

El onboarding debe determinar qué pasos necesita el cliente.

Ejemplo:

### Consultor independiente

```text
Service
→ Date
→ Time
→ Client Information
→ Confirmation
```

### Barbería

```text
Service
→ Staff
→ Location
→ Date
→ Time
→ Client Information
→ Payment
→ Confirmation
```

### Cancha

```text
Service
→ Location
→ Resource
→ Date
→ Time
→ Client Information
→ Payment
→ Confirmation
```

### Psicología

```text
Service
→ Staff
→ Date
→ Time
→ Client Information
→ Questionnaire
→ Payment
→ Confirmation
```

El booking flow debe ser generado/configurado, no hardcodeado por sector.

---

# 19. UX Requirements

El onboarding debe sentirse como un asistente.

No debe parecer un formulario administrativo.

Cada pantalla debe tener:

```text
Título claro
Descripción corta
Opciones visuales
Botón Continuar
Botón Atrás
Indicador de progreso
```

No hacer preguntas técnicas.

Evitar:

```text
Configure StaffService
Configure Resources
Configure Availability
```

Usar:

```text
¿Quién atiende?
¿Dónde atiendes?
¿Qué necesita reservar tu cliente?
¿Cuándo trabajas?
```

---

# 20. Progresive Disclosure

No mostrar todas las preguntas a todos los usuarios.

Ejemplo:

Si:

```text
"Tengo un equipo"
```

mostrar preguntas de Staff.

Si:

```text
"Trabajo solo"
```

saltar esas preguntas.

Si:

```text
"Necesito reservar espacios"
```

mostrar Resources.

Si:

```text
"No"
```

no mostrar Resource.

El onboarding debe adaptarse a las respuestas.

---

# 21. Objetivo de UX

El usuario debe poder pasar de:

```text
Cuenta nueva
```

a:

```text
Sistema listo para recibir reservas
```

sin tener que entrar manualmente al dashboard y configurar diez módulos.

El onboarding debe hacer aproximadamente el 80% de la configuración inicial.

El dashboard debe utilizarse posteriormente para ajustes avanzados.

---

# 22. Antes de programar

IMPORTANTE:

NO implementar todavía.

Primero auditar la implementación actual del onboarding y entregar:

1. Flujo actual.
2. Componentes actuales.
3. API actual.
4. Modelos utilizados.
5. Qué partes pueden reutilizarse.
6. Qué partes deben modificarse.
7. Qué nueva estructura de configuración se necesita.
8. Qué preguntas deben ser dinámicas.
9. Qué información debe persistirse.
10. Cómo se generará el booking flow.
11. Cómo se calcularán las features finales.
12. Riesgos de migración.

Después presentar una propuesta de arquitectura del Smart Onboarding.

Esperar aprobación antes de comenzar la implementación.

---

# 23. Criterio final

El onboarding debe responder correctamente:

> "¿Qué necesita este negocio para comenzar a recibir reservas?"

Y no simplemente:

> "¿Qué rubro seleccionó?"

La plataforma debe ser capaz de configurar diferentes negocios con diferentes necesidades aunque pertenezcan al mismo rubro.

La regla final es:

```text
PRESET = recomendación

USER ANSWERS = realidad del negocio

FINAL CONFIGURATION = combinación de ambas
```

No crear lógica específica duplicada por profesión.

El Core sigue siendo universal.

La experiencia se adapta.