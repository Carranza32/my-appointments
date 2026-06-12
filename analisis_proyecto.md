# Análisis Técnico y Funcional de "My Appointment"

Este documento contiene un análisis de la arquitectura y la lógica de negocio del proyecto **My Appointment**, diseñado para ser utilizado como contexto de entrada en modelos de inteligencia artificial (como Claude o GPT) para la elaboración de un plan de negocio y de comercialización SaaS.

---

## 1. Resumen Ejecutivo
**My Appointment** es una plataforma SaaS (Software as a Service) de agendamiento y reserva de citas de autoservicio para profesionales independientes y pequeñas empresas (médicos, terapeutas, consultores, salones de belleza, entrenadores, etc.). 

El sistema permite a cada profesional configurar su perfil, sus horarios de trabajo, duración de citas y campos personalizados de reserva. La plataforma genera un enlace público único (ej. `http://localhost:3000/nombre-slug`) donde los clientes finales pueden reservar citas de forma autónoma basándose en la disponibilidad en tiempo real del profesional, la cual se sincroniza de forma bidireccional con **Google Calendar**.

---

## 2. Arquitectura Tecnológica
El proyecto utiliza un stack tecnológico moderno y escalable para aplicaciones web:

*   **Framework Principal**: Next.js 16+ (usando App Router y Turbopack). Combina Server Components para optimización de carga y Client Components (React 19) para interactividad fluida.
*   **Gestión de Estilos**: Tailwind CSS v4 (configuración en CSS nativo con `@theme`, facilitando variables, transiciones fluidas y micro-interacciones premium).
*   **Base de Datos y ORM**: PostgreSQL como base de datos principal, gestionado mediante Prisma ORM para las consultas, relaciones y migraciones de esquema.
*   **Autenticación**: Supabase Auth (OAuth y Autenticación con Contraseña) integrado en el cliente y middleware de Next.js.
*   **Integraciones de Terceros**: Google Calendar API (vía OAuth 2.0 con biblioteca `googleapis`) para sincronización de calendarios de Google.

---

## 3. Modelo de Datos (Esquema de Base de Datos)
El esquema de base de datos está modelado en PostgreSQL usando Prisma (`prisma/schema.prisma`) y refleja una estructura lista para operar a nivel SaaS comercial:

### Detalle de las Entidades Core:
1.  **User**: Representa al profesional. Contiene su información, tipo de industria (`rubro`), nivel de suscripción (`planTier`: FREE/PRO), y un campo pre-integrado para facturación (`stripeCustomerId`).
2.  **BusinessConfig**: Define la configuración operativa del profesional:
    *   `slotDuration`: Duración base de cada cita (en minutos).
    *   `bufferTime`: Tiempo muerto obligatorio entre citas consecutivas.
    *   `weeklyHours`: JSON que detalla los horarios laborales semanales.
    *   `formFields`: Formulario de reserva dinámico en JSON (permite cuestionarios personalizados).
    *   `removeBranding` y `enableWhatsApp`: Flags boleanas diseñadas para características premium.
3.  **GoogleAccount**: Almacena los tokens de acceso y actualización OAuth para la sincronización con Google Calendar.
4.  **Appointment**: Almacena las reservas. Posee estados de cita (`PENDIENTE`, `CONFIRMADA`, `CANCELADA`) y metadatos dinámicos del cliente final.
5.  **Client**: Un directorio automatizado (CRM interno) donde se guardan y unifican todos los clientes que reservan citas con el profesional.

---

## 4. Módulos y Funcionalidades del Sistema

### A. Autenticación y Flujo de Onboarding
*   Formularios de Registro e Inicio de sesión integrados con Supabase.
*   **Paso de Onboarding**: Tras registrarse, se obliga al usuario a definir su `slug` único (ej. `mi-negocio`), su nombre comercial y su rubro. Esto autogenera el portal público de agendamiento y crea una configuración de horarios por defecto.

### B. Panel de Control Administrativo (Dashboard)
*   **Banner de Estado**: Muestra un resumen del estado del panel (activo, online).
*   **Métricas en Tiempo Real**: Tarjetas visuales que muestran:
    *   Total de Citas Registradas en el sistema.
    *   Total de Clientes en el directorio.
    *   Citas Pendientes de confirmación.
*   **Agenda Diaria**: Un itinerario cronológico detallado para el día actual con barras de estado dinámicas.
*   **Accesos Rápidos**: Enlace público copiable mediante un botón con retroalimentación visual, enlace de sincronización de Google, y accesos directos de navegación.

### C. Módulo de Calendario Completo (`/dashboard/citas`)
*   **Vistas Flexibles**: Selector dinámico de visualización por **Día**, **Semana** o **Mes**.
*   **Navegador Rápido**: Minicalendario lateral para saltar a cualquier fecha, mostrando indicadores de puntos si un día tiene citas reservadas.
*   **Línea de Tiempo del Día**: Muestra una línea horizontal roja que indica la hora actual en tiempo real.
*   **Gestor de Estados**: Permite hacer clic en cualquier cita para ver sus detalles y cambiar su estado (`PENDIENTE`, `CONFIRMADA`, `CANCELADA`).
*   **Agendamiento Manual**: El profesional puede agendar una cita directamente desde el panel administrativo para clientes que llaman por teléfono.

### D. Directorio de Clientes (Mini CRM)
*   Visualiza todos los contactos unificados en una tabla paginada.
*   **Buscador Integrado**: Filtra instantáneamente por nombre, correo electrónico o teléfono.
*   **Fichas de Cliente**: Permite registrar notas u observaciones para cada cliente, útil para historial clínico, ficha de belleza, o notas de consultoría.

### E. Configuración Operativa y Horarios
*   **Editor de Disponibilidad**: Selector de días de la semana y rangos de horas laborales de atención (permite múltiples intervalos por día, ej. 9:00-13:00 y 15:00-19:00).
*   **Configuración del Servicio**: Ajuste de la duración de cita (15m, 30m, 45m, 1h, etc.) y tiempo de holgura (buffer) entre citas.
*   **Formularios Dinámicos (Questionnaire Builder)**: Permite al profesional añadir preguntas específicas que el cliente final debe responder al agendar (ej. "¿Tiene alguna alergia?", "Motivo de la sesión").

### F. Sincronización Google Calendar (Flujo Completo)
*   **Verificación Bidireccional**: Al calcular disponibilidad para el cliente final, el sistema consulta los bloques ocupados del Google Calendar del profesional mediante la API de Google y elimina esos horarios de la lista disponible en la web.
*   **Creación en Espejo**: Cuando un cliente realiza una reserva en el portal web, el sistema crea en tiempo real el evento correspondiente en el Google Calendar del profesional, inyectando los datos de contacto y respuestas del cuestionario en la descripción.

---

## 5. El Portal de Agendamiento Público (`/[slug]`)
Es el embudo (funnel) donde interactúa el cliente final del profesional. Su flujo es:
1.  **Carga del Portal**: El cliente ingresa a `my-app.com/slug-profesional`.
2.  **Selección de Fecha**: Se despliega un calendario interactivo.
3.  **Generación Dinámica de Horarios**: El backend genera los horarios libres basándose en la configuración horaria del profesional, restando las citas ya confirmadas/pendientes en la BD y los eventos marcados como "Ocupado" en Google Calendar.
4.  **Formulario Dinámico**: El cliente rellena su información obligatoria (nombre, correo, teléfono) y las preguntas dinámicas personalizadas por el profesional.
5.  **Confirmación**: Se crea la cita en estado `PENDIENTE` o `CONFIRMADA` (según las reglas), se agrega al cliente al directorio, y se escribe el evento en Google Calendar.

---

## 6. Oportunidades y Estrategia de Negocio (Para análisis en Claude)
El proyecto está técnicamente listo para ser transformado en un negocio de suscripción (SaaS B2B). Aquí hay puntos clave para estructurar el modelo de negocio:

### A. Modelo de Suscripción (Monetización)
El campo `planTier` (FREE, PRO) y la columna `stripeCustomerId` en la tabla `User` permiten implementar una monetización rápida por niveles:
*   **Plan Free (Gratuito)**:
    *   Hasta X citas al mes.
    *   Formulario de reserva básico (sin preguntas adicionales).
    *   Enlace público con marca de agua ("Desarrollado por My Appointment").
*   **Plan Pro (Pago Mensual/Anual)**:
    *   Citas ilimitadas.
    *   Sincronización bidireccional con Google Calendar.
    *   Eliminación de marca de agua (`removeBranding = true`).
    *   Formularios de reserva dinámicos ilimitados.
    *   Envío de recordatorios (integración con Twilio/WhatsApp API mediante `enableWhatsApp = true`).

### B. Integraciones Futuras de Alto Valor
1.  **Pagos en la Reserva**: Permitir que el profesional requiera el pago de la sesión (ej. vía Stripe) al momento de reservar en el portal público, reduciendo cancelaciones de última hora.
2.  **WhatsApp Notifications**: Enviar recordatorios automáticos 24 horas antes de la cita para reducir el índice de inasistencia (no-shows).
3.  **App Móvil o PWA**: Notificaciones push inmediatas para el profesional cuando reciba una nueva cita en su móvil.
