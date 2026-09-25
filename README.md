# My Appointment — Plataforma SaaS de Agendamiento Inteligente, Gestión Clínica y Cobros

> **Documento Oficial de Producto, Arquitectura y Especificación para Landing Page**  
> *Este documento está diseñado tanto para que cualquier persona o inversor comprenda el producto en minutos, como para servir de contexto y especificación directa (Product Brief) para agentes de Inteligencia Artificial que desarrollen la Landing Page comercial del SaaS.*

---

## 1. Resumen Ejecutivo (¿Qué es My Appointment?)

**My Appointment** es una plataforma **SaaS (Software as a Service) B2B "todo en uno"** diseñada para que profesionales independientes y clínicas de la salud, bienestar y consultoría (psicólogos, médicos, terapeutas, fisioterapeutas, odontólogos y consultores) automaticen al 100% su flujo de reservas, cobros y seguimiento de pacientes.

A diferencia de las herramientas genéricas de agendamiento (como Calendly) o los directorios saturados (como Doctoralia), **My Appointment** proporciona a cada profesional su **propio portal web de reservas con subdominio personalizado y marca blanca**, eliminando la fricción de reservas por WhatsApp, digitalizando el expediente clínico con **Inteligencia Artificial (Google Gemini)** y asegurando el pago de cada sesión mediante **transferencias bancarias validadas o pasarelas online**.

### Elevator Pitch (En una frase):
> *"Convierte las consultas caóticas por WhatsApp en reservas confirmadas y pagadas las 24 horas, mientras reduces hasta 10 horas semanales de trabajo administrativo gracias a expedientes clínicos estructurados con IA."*

---

## 2. El Problema vs La Solución

| El Problema Habitual del Profesional | La Solución con My Appointment |
| :--- | :--- |
| **Pérdida de tiempo en WhatsApp:** Negociar fechas y horas manualmente consume horas valiosas al día. | **Autoservicio 24/7:** El paciente reserva en 3 pasos desde el portal web del profesional sin necesidad de registrarse. |
| **Inasistencias (*No-Shows*) y citas no pagadas:** Pacientes que no asisten o cancelan a último minuto. | **Cobro anticipado y validación de pago:** Citas aseguradas con transferencia bancaria (subida de comprobante) o pago en línea. |
| **Agendas solapadas y desorden:** Bloqueos manuales y conflictos con la vida personal. | **Sincronización bidireccional con Google Calendar:** La disponibilidad se actualiza en tiempo real de forma automática. |
| **Horas redactando notas clínicas:** Fatiga administrativa después de cada consulta para llevar el expediente. | **Expediente Clínico con IA (SOAP):** El profesional escribe notas rápidas y Gemini AI las estructura en formato médico SOAP en 5 segundos. |
| **Herramientas frías o directorios que cobran comisión:** Depender de plataformas de terceros que compiten con su propia marca. | **Portal de marca propia:** Cada negocio tiene su subdominio exclusivo (`dr-araujo.my-appointment.com`) con su identidad visual. |

---

## 3. Perfil de Cliente Ideal (ICP - A quién va dirigido)

1. **Profesionales de la Salud Mental y Bienestar (Nicho Principal):**
   - Psicólogos, psicoanalistas, psiquiatras, terapeutas de pareja, tanatólogos y coaches de vida.
2. **Especialistas Médicos y Terapias Físicas:**
   - Médicos generales y especialistas, fisioterapeutas, quiroprácticos, nutricionistas, podólogos y odontólogos.
3. **Clínicas y Consultorios Multidisciplinarios:**
   - Centros de salud que comparten consultorios o atienden en múltiples sedes con varios especialistas en su equipo.
4. **Consultores y Profesionales Independientes:**
   - Abogados, asesores financieros, mentores y consultores estratégicos que cobran por hora de asesoría.

---

## 4. Propuesta de Valor Única (UVP) y Diferenciadores

1. **Subdominio Multi-Tenant Nativo:** Cada profesional tiene su propia dirección web personalizada (ej: `clinica-araujo.miappointment.com`), brindando una imagen de máxima seriedad y prestigio.
2. **Expediente Clínico Asistido por IA (Notas SOAP):** Transforma apuntes sueltos en notas formales con formato médico:
   - **S (Subjetivo):** Motivo de consulta y lo que el paciente relata.
   - **O (Objetivo):** Observaciones clínicas y conducta observada.
   - **A (Análisis/Evaluación):** Interpretación diagnóstica y evolución.
   - **P (Plan):** Acuerdos, tareas para la próxima sesión y tratamiento.
3. **Comprobante de Transferencia Bancaria Directa:** En Latinoamérica y mercados hispanos, muchas personas pagan por transferencia (SPEI, PSE, SINPE, etc.). My Appointment incluye carga de comprobante y mesa de aprobación en un clic para el profesional, sin comisiones intermedias.
4. **Diseño Visual Ultra-Premium ("Liquid Glass"):** Experiencia inspirada en interfaces Apple (macOS / iOS), con acabados esmerilados limpios, modo claro moderno, tipografía nítida y micro-interacciones fluidas.
5. **Cero Fricción para el Paciente:** El paciente agenda directamente sin descargar apps pesadas, sin crear contraseñas y sin registros obligatorios.
6. **Multi-Sede y Multi-Especialista:** Permite gestionar múltiples consultorios físicos y asignar servicios a diferentes miembros del equipo de trabajo.

---

## 5. Arquitectura de Módulos del Sistema

```
                                  MY APPOINTMENT
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
    [PORTAL DEL PACIENTE]                                 [PANEL ADMINISTRATIVO]
(Subdominio público del negocio)                        (Backoffice del Profesional)
  • Selección de Sede/Especialista                        • Métricas del Día y Semana
  • Selector de Servicios y Precios                       • Calendario (Día / Semana / Mes)
  • Calendario Interactivo en Vivo                        • CRM de Pacientes Unificado
  • Cuestionario Dinámico de Consulta                     • Expediente Clínico con IA (SOAP)
  • Carga de Comprobante Bancario                         • Mesa de Validación de Pagos
  • Sincronización Google / Archivo .ics                  • Gestión de Horarios y Disponibilidad
                                                          • Sedes Físicas y Equipo (Staff)
```

### 5.1. El Portal de Agendamiento del Paciente (`/_tenant/[subdomain]`)
- **Detección Automática de Marca:** Carga el logo, colores, nombre y descripción del profesional.
- **Asistente de Reserva Inteligente (Stepper):**
  1. *Selección de Servicio y Especialista:* El paciente elige la consulta y el profesional que lo atenderá.
  2. *Disponibilidad en Tiempo Real:* Cálculo inteligente de horarios libres restando citas existentes y eventos ocupados de Google Calendar.
  3. *Formulario Dinámico:* Nombre, correo, WhatsApp y preguntas personalizadas (ej. "¿Tomas medicamentos actualmente?", "Motivo de la sesión").
  4. *Aviso de Privacidad y Consentimiento:* Checkbox obligatorio para cumplimiento legal de datos de salud.
  5. *Pago y Confirmación:* Despliega datos bancarios (banco, titular, CLABE/cuenta), subida del voucher o confirmación automática. Ofrece botón para agregar a Google Calendar o descargar archivo `.ics` para Apple/Outlook.

### 5.2. Panel de Control del Profesional (`/dashboard`)
- **Dashboard Principal:** Métricas inmediatas (Citas totales, Clientes activos, Citas pendientes de validación, Agenda del día con timeline interactivo).
- **Calendario Multimodal (`/dashboard/citas`):** Vistas por Día, Semana y Mes, con barra de hora actual en vivo, minicalendario para navegación rápida y drawer modal para editar estados (`CONFIRMADA`, `PENDIENTE`, `CANCELADA`) o chatear por WhatsApp con el paciente.
- **Directorio de Pacientes y CRM (`/dashboard/clientes`):** Listado unificado con buscador rápido por nombre, teléfono o email.
- **Expediente Clínico Inteligente:** Historial de sesiones y botón **"Estructurar con IA"** con Google Gemini Flash para notas clínicas SOAP automáticas.
- **Mesa de Verificación de Pagos (`/dashboard/pagos`):** Previsualización en alta definición del comprobante de transferencia y botones de un clic para **Aprobar Cita** o **Rechazar**.
- **Gestor de Horarios y Disponibilidad (`/dashboard/settings`):** Configuración de intervalos de atención por día (turnos partidos), duración base de cita y tiempos de descanso (buffer).
- **Gestión de Sedes y Especialistas (`/dashboard/sedes` y `/dashboard/personal`):** Creación de consultorios físicos y colaboradores con horarios independientes.

---

## 6. Planes y Modelo de Monetización (SaaS Pricing)

| Característica | Plan FREE (Gratuito) | Plan PRO (Suscripción Premium) |
| :--- | :---: | :---: |
| **Citas por Mes** | Hasta 30 citas/mes | **Ilimitadas** |
| **Directorio de Pacientes** | Hasta 50 pacientes | **Ilimitado** |
| **Servicios Activos** | 1 Servicio | **Ilimitados** |
| **Sedes / Consultorios** | 1 Sede | **Ilimitadas** |
| **Equipo / Colaboradores** | Solo 1 profesional | **Colaboradores ilimitados** |
| **Subdominio Personalizado** | URL estándar compartida | **Subdominio propio con marca blanca** |
| **Sincronización Google Calendar** | No | **Bidireccional en tiempo real** |
| **Expediente Clínico con IA (SOAP)** | No | **Incluido con Google Gemini** |
| **Mesa de Validación de Pagos** | Básica | **Avanzada con notificaciones** |
| **Preguntas Personalizadas** | Hasta 3 preguntas | **Ilimitadas** |
| **Eliminar Marca de Agua** | Marca de My Appointment | **Marca Blanca 100% limpia** |
| **Soporte** | Comunitario por email | **Soporte prioritario** |

---

## 7. ESPECIFICACIÓN DIRECTA PARA AGENTES DE IA (Landing Page Blueprint)

> **Instrucción para el Agente:** Utiliza la siguiente guía para diseñar, redactar y maquetar la **Landing Page comercial** del producto. La página debe convencer a profesionales de la salud y consultores de iniciar su prueba gratuita o registrarse en la plataforma.

### 7.1. Estructura y Secciones Recomendadas para la Landing Page

#### 1. Header / Navbar
- **Logo:** `My Appointment` (Isotipo de calendario limpio y moderno).
- **Enlaces de navegación:** *Funcionalidades*, *Cómo funciona*, *Expediente IA*, *Precios*, *Preguntas Frecuentes*.
- **Acciones:** Botón secundario `Iniciar Sesión` y Botón primario de acento `Comenzar Gratis (Sin tarjeta)`.

#### 2. Hero Section (Sección Principal de Impacto)
- **Badge superior de novedad:** `✨ Nuevo: Expedientes Clínicos estructurados con Inteligencia Artificial`.
- **Titular Principal (H1):**  
  *"La plataforma de citas, cobros y notas clínicas con IA creada para profesionales de la salud."*
- **Subtítulo (Párrafo de soporte):**  
  *"Automatiza tu agenda las 24 horas en tu propio subdominio web, valida pagos por transferencia antes de la sesión y genera notas clínicas en formato SOAP en 10 segundos."*
- **Llamadas a la Acción (CTAs):**
  - Botón primario: `Crear mi portal gratis` (con micro-copy: *Empieza en 2 minutos • Sin tarjeta de crédito*).
  - Botón secundario: `Ver Demo en Vivo` (abre una muestra del portal del paciente).
- **Prueba Social Inicial:**  
  *"Más de 1,500 horas de consulta gestionadas este mes por psicólogos, médicos y terapeutas."*
- **Visual del Hero:** Mockup interactivo en perspectiva mostrando el portal de reserva en móvil y la pantalla de estructuración con IA en escritorio.

#### 3. Barra de Confianza / Problemas que Resolvemos
- **Grid de 4 métricas o pilares:**
  - `0% No-Shows`: Reduce el ausentismo solicitando comprobante de pago al reservar.
  - `-10 hrs semanales`: Despídete de la redacción manual de expedientes clínicos.
  - `100% Tu Marca`: Tu propio subdominio (`tunombre.miappointment.com`).
  - `Google Calendar Sync`: Cero duplicidad o cruces en tu agenda personal.

#### 4. Demostración en Foco: El Poder de la IA Clínica (Feature Spotlight)
- **Título:** *"De notas desordenadas a expedientes médicos formales en 1 clic."*
- **Comparativa visual Antes vs Después:**
  - *A la izquierda:* Notas rápidas escritas por el terapeuta: *"Paciente refiere ansiedad por exámenes, insomnio 3 días, trabajamos respiración diafragmática, acordamos diario de sueño"*.
  - *A la derecha:* Resultado instantáneo de Gemini AI estructurado en formato formal **SOAP** (Subjetivo, Objetivo, Análisis, Plan) listo para guardar o exportar.

#### 5. Malla de Características Principales (Feature Grid)
1. **Portal de Reserva Autoservicio:** Calendario mensual interactivo que funciona sin que el paciente cree contraseñas ni descargue aplicaciones.
2. **Cobro por Transferencia y Pasarela:** Despliega tus cuentas bancarias y recibe el comprobante de pago antes de confirmar la sesión.
3. **Sincronización Bidireccional:** Bloquea automáticamente en tu portal los horarios marcados como "Ocupado" en tu Google Calendar personal.
4. **Directorio y CRM de Pacientes:** Fichas individuales con historial de citas, asistencias y evolución clínica en un solo lugar.
5. **Cuestionarios Personalizados:** Formula preguntas clave antes de la consulta para preparar la sesión de antemano.
6. **Multi-Consultorio y Equipo:** Si tienes clínica o consultorio compartido, añade sedes y agenda citas por especialista.

#### 6. Cómo Funciona en 3 Simples Pasos (How It Works)
1. **Configura tu perfil:** Define tus horarios, tus servicios y los datos bancarios donde recibirás tus pagos.
2. **Comparte tu enlace:** Colócalo en tu biografía de Instagram, WhatsApp Business o sitio web.
3. **Recibe citas y enfócate en tus pacientes:** Las citas entran confirmadas, sincronizadas con tu calendario y listas para atender.

#### 7. Tabla de Precios Clara y Transparente (Pricing)
- Selector mensual / anual (con descuento de 2 meses gratis al pagar anual).
- **Tarjeta Plan Free:** $0/mes. Ideal para profesionales que inician (hasta 30 citas/mes, 1 servicio, 1 sede).
- **Tarjeta Plan Pro (Destacada):** Precio sugerido competitivo (ej. $19 USD/mes o equivalente local). Citas ilimitadas, Expediente Clínico con IA, Sincronización Google Calendar, Marca Blanca y Subdominio propio.

#### 8. Preguntas Frecuentes (FAQ)
- *¿Mis pacientes necesitan crear una cuenta para agendar?* (No, agendan directamente en segundos).
- *¿Cómo funciona la validación de pagos bancarios?* (El paciente sube su comprobante y tú lo apruebas en un clic desde tu panel).
- *¿Mis notas clínicas son confidenciales?* (Absolutamente. Cada tenant cuenta con aislamiento estricto de base de datos y cifrado seguro).
- *¿Puedo conectar mi Google Calendar actual?* (Sí, en un solo clic autorizas tu cuenta y se sincroniza al instante).
- *¿Puedo usar mi propio nombre en la dirección web?* (Sí, obtienes tu subdominio personalizado como `tu-nombre.miappointment.com`).

#### 9. Footer y Llamada a la Acción Final
- Banner de fondo oscuro o gradiente elegante: *"Empieza a digitalizar tu consulta hoy mismo"*.
- Links a Aviso de Privacidad (`/privacy-notice.html`), Términos y Condiciones, Contacto y Redes Sociales.

### 7.2. Tono de Voz y Pautas de Copywriting
- **Tono:** Profesional, empático, moderno, seguro y tecnológico sin ser abrumador.
- **Vocabulario clave:** *Autonomía, tranquilidad, puntualidad, expediente clínico, formato SOAP, sin comisiones ocultas, sincronización en tiempo real, marca blanca*.
- **Evitar:** Jerga técnica excesiva de desarrollo (no hables de Next.js o Postgres al usuario final; habla de velocidad, seguridad y respaldo en la nube).

---

## 8. Arquitectura Tecnológica del Proyecto

Para los desarrolladores o agentes de programación que interactúen con el repositorio:

| Capa | Tecnología | Función |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2+ (App Router, Turbopack) | Arquitectura con Server Components y Server Actions (`/actions`). |
| **Librería UI** | React 19 + Lucide Icons | Componentes reactivos, transiciones y micro-interacciones. |
| **Estilos** | Tailwind CSS v4 | Sistema de diseño "Liquid Glass" (fondos esmerilados y modo claro refinado). |
| **Base de Datos** | PostgreSQL (Supabase Connection Pooler) | Base de datos relacional de alto rendimiento. |
| **ORM** | Prisma ORM 6.x | Tipado estricto, migraciones y esquemas relacionales. |
| **Autenticación** | Supabase Auth (`@supabase/ssr`) | Manejo de sesiones seguras mediante cookies HTTP-Only. |
| **Inteligencia Artificial** | Google Gemini API (1.5 Flash) | Generación y formateo automático de notas SOAP en `/api/ai/clinical-notes`. |
| **Integraciones Externas** | Google Calendar API (`googleapis`), Resend (Email) | Sincronización de eventos y correos transaccionales. |

---

## 9. Comandos para Ejecución y Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Generar cliente de base de datos y migraciones
npx prisma generate
npx prisma migrate dev

# 4. Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

---
*Documento mantenido para el equipo de My Appointment. Listo para alimentar modelos de IA y herramientas de generación de páginas de aterrizaje.*
