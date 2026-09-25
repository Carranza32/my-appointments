import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getProfessional } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingLinkWidget } from "@/components/dashboard/booking-link-widget";
import { getLabels } from "@/lib/labels";
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar, 
  ChevronRight, 
  MoreVertical, 
  UserPlus, 
  Mail, 
  FileText, 
  BarChart2, 
  Plus 
} from "lucide-react";

export default async function DashboardPage() {
  const professional = await getProfessional();
  if (!professional) redirect("/onboarding");

  // Reconstruct full public booking URL
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/${professional?.slug}`;
  const rubro = professional?.rubro ?? "GENERAL";
  const labels = getLabels(rubro);

  // Fetch real stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startOfWeek = new Date(todayStart);
  startOfWeek.setDate(todayStart.getDate() - todayStart.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  let totalAppointments = 0;
  let totalClients = 0;
  let pendingAppointments = 0;
  let todayAppointments: any[] = [];
  let thisWeekCount = 0;
  let pendingPaymentsCount = 0;
  let googleAccount: any = null;

  try {
    const [
      totalApts,
      totalCls,
      pendingApts,
      todayApts,
      thisWeekC,
      pendingPayments,
      googleAcc
    ] = await Promise.all([
      prisma.appointment.count({ where: { userId: professional.id } }),
      prisma.client.count({ where: { userId: professional.id } }),
      prisma.appointment.count({ where: { userId: professional.id, status: "PENDIENTE" } }),
      prisma.appointment.findMany({
        where: {
          userId: professional.id,
          startTime: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELADA" }
        },
        include: {
          service: true,
          staff: true,
        },
        orderBy: { startTime: "asc" }
      }),
      prisma.appointment.count({
        where: {
          userId: professional.id,
          startTime: { gte: startOfWeek, lte: endOfWeek },
          status: { not: "CANCELADA" }
        }
      }),
      prisma.appointment.count({
        where: {
          userId: professional.id,
          paymentStatus: "PENDIENTE",
          paymentProofUrl: { not: null }
        }
      }),
      prisma.googleAccount.findUnique({
        where: { userId: professional.id }
      })
    ]);

    totalAppointments = totalApts;
    totalClients = totalCls;
    pendingAppointments = pendingApts;
    todayAppointments = todayApts;
    thisWeekCount = thisWeekC;
    pendingPaymentsCount = pendingPayments;
    googleAccount = googleAcc;
  } catch (err) {
    console.warn("Database query failed:", err);
  }

  // Pure real metrics (no mock fallback)
  const displayTotal = totalAppointments.toLocaleString();
  const displayClients = totalClients.toLocaleString();
  const displayPending = pendingAppointments.toString();
  const displayThisWeek = thisWeekCount.toString();

  // Greeting name
  const docName = professional?.name ?? "Especialista";
  const countToday = todayAppointments.length;

  const formatTimeStr = (date: Date) => {
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  // Real dynamic business alerts
  const smartAlerts: { title: string; subtitle: string; color: string; href: string }[] = [];

  if (pendingAppointments > 0) {
    smartAlerts.push({
      title: `${pendingAppointments} ${pendingAppointments === 1 ? labels.appointment.toLowerCase() : labels.appointments.toLowerCase()} por confirmar`,
      subtitle: "Revisar en calendario",
      color: "#FF9500",
      href: "/dashboard/citas"
    });
  }

  if (pendingPaymentsCount > 0) {
    smartAlerts.push({
      title: `${pendingPaymentsCount} ${pendingPaymentsCount === 1 ? "comprobante" : "comprobantes"} de pago pendiente`,
      subtitle: "Verificar transferencias",
      color: "#007AFF",
      href: "/dashboard/pagos"
    });
  }

  if (!googleAccount) {
    smartAlerts.push({
      title: "Conectar Google Calendar",
      subtitle: "Sincroniza citas automáticamente",
      color: "#5856D6",
      href: "/dashboard/settings?tab=integrations"
    });
  }

  const isClinical = rubro === "SALUD" || rubro.includes("PSICOL") || rubro.includes("MEDIC");

  return (
    <div className="relative mx-auto max-w-7xl pb-16 font-sans">
      
      {/* Header Greeting (iOS Large Title style) */}
      <div className="mb-8">
        <h1 className="font-bold text-[#1D1D1F] text-2xl sm:text-3xl tracking-tight leading-tight">
          ¡Buenos días, {docName}!
        </h1>
        <p className="mt-1 text-[#86868B] text-xs font-normal">
          {countToday === 0
            ? `No tienes ${labels.appointments.toLowerCase()} programadas para hoy.`
            : countToday === 1
            ? `Tienes 1 ${labels.appointment.toLowerCase()} programada para hoy.`
            : `Tienes ${countToday} ${labels.appointments.toLowerCase()} programadas para hoy.`}
        </p>
      </div>

      {/* 4 iOS Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric 1: TOTAL */}
        <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] select-none">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5 text-[#007AFF]" />
            </div>
            <span className="text-[11px] font-normal text-[#86868B]">
              {totalAppointments > 0 ? "Histórico" : "Inicio"}
            </span>
          </div>
          <span className="mt-4 block text-[11px] font-medium text-[#86868B] uppercase tracking-wider leading-none">
            Total {labels.appointments}
          </span>
          <h2 className="mt-2 text-2xl font-semibold text-[#1D1D1F] tracking-tight leading-none">
            {displayTotal}
          </h2>
        </div>

        {/* Metric 2: CLIENTS */}
        <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] select-none">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-[#5856D6]/10 flex items-center justify-center">
              <Users className="h-4.5 w-4.5 text-[#5856D6]" />
            </div>
            <span className="text-[11px] font-normal text-[#86868B]">
              {totalClients === 1 ? "Registrado" : "Registrados"}
            </span>
          </div>
          <span className="mt-4 block text-[11px] font-medium text-[#86868B] uppercase tracking-wider leading-none">
            {labels.clients}
          </span>
          <h2 className="mt-2 text-2xl font-semibold text-[#1D1D1F] tracking-tight leading-none">
            {displayClients}
          </h2>
        </div>

        {/* Metric 3: PENDING */}
        <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] select-none">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-[#FF9500]/10 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5 text-[#FF9500]" />
            </div>
            {pendingAppointments > 0 ? (
              <span className="inline-flex items-center rounded-full bg-[#FF9500]/10 px-2 py-0.5 text-[10px] font-medium text-[#FF9500] uppercase tracking-wider">
                Por confirmar
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-[#34C759]/10 px-2 py-0.5 text-[10px] font-medium text-[#34C759] uppercase tracking-wider">
                Al día
              </span>
            )}
          </div>
          <span className="mt-4 block text-[11px] font-medium text-[#86868B] uppercase tracking-wider leading-none">
            Pendientes
          </span>
          <h2 className="mt-2 text-2xl font-semibold text-[#1D1D1F] tracking-tight leading-none">
            {displayPending}
          </h2>
        </div>

        {/* Metric 4: THIS WEEK */}
        <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] select-none">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-[#34C759]/10 flex items-center justify-center">
              <Calendar className="h-4.5 w-4.5 text-[#34C759]" />
            </div>
            <span className="text-[11px] font-normal text-[#86868B]">Próximos 7d</span>
          </div>
          <span className="mt-4 block text-[11px] font-medium text-[#86868B] uppercase tracking-wider leading-none">
            Esta Semana
          </span>
          <h2 className="mt-2 text-2xl font-semibold text-[#1D1D1F] tracking-tight leading-none">
            {displayThisWeek}
          </h2>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Schedule Timeline (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card Wrapper */}
          <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            
            {/* Timeline Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-5">
              <div>
                <h2 className="font-semibold text-base text-[#1D1D1F] tracking-tight">
                  Agenda de hoy
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5 font-normal">
                  {now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <Link 
                href="/dashboard/citas" 
                className="inline-flex items-center gap-1 text-xs font-medium text-[#007AFF] hover:underline active:scale-[0.98] transition-all cursor-pointer select-none"
              >
                <span>Ver calendario completo</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* List or Empty State */}
            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-black/[0.015] border border-black/[0.04]">
                <div className="h-12 w-12 rounded-2xl bg-black/[0.03] text-[#86868B] flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  Sin {labels.appointments.toLowerCase()} para hoy
                </h3>
                <p className="text-xs text-[#86868B] max-w-sm mt-1 leading-relaxed font-normal">
                  Tu agenda está libre. Comparte tu enlace de reservas con tus {labels.clients.toLowerCase()} o agenda una sesión de forma manual.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <Link
                    href="/dashboard/citas"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] px-4 py-2 text-xs font-medium text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Agendar Cita Manual</span>
                  </Link>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] active:scale-[0.98] px-4 py-2 text-xs font-medium text-[#1D1D1F] transition-all cursor-pointer shadow-xs"
                  >
                    <span>Ver Portal de Pacientes</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayAppointments.map((apt) => {
                  const serviceName = apt.service?.name || labels.appointment;
                  const staffName = apt.staff?.name ? ` · ${apt.staff.name}` : "";
                  const isConfirmed = apt.status === "CONFIRMADA";

                  return (
                    <div
                      key={apt.id}
                      className="group relative flex items-center justify-between p-4 pl-5 rounded-xl bg-white border border-black/[0.06] hover:border-[#007AFF]/30 hover:shadow-xs active:scale-[0.99] transition-all duration-150 cursor-pointer select-none"
                    >
                      {/* Left accent bar */}
                      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                        isConfirmed ? "bg-[#007AFF]" : "bg-[#FF9500]"
                      }`} />

                      {/* Left Section: Time & Details */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 flex-shrink-0 text-left">
                          <span className="block font-semibold text-xs text-[#1D1D1F] leading-none">
                            {formatTimeStr(new Date(apt.startTime))}
                          </span>
                        </div>

                        <div className="h-7 w-px bg-black/[0.06]"></div>

                        <div>
                          <h4 className="font-medium text-xs text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors leading-snug">
                            {apt.clientName}
                          </h4>
                          <p className="text-[11px] text-[#86868B] mt-0.5 leading-none font-normal">
                            {serviceName}{staffName}
                          </p>
                        </div>
                      </div>

                      {/* Right Section: Status Badge & Menu */}
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${
                          isConfirmed ? "bg-[#007AFF]/10 text-[#007AFF]" : "bg-[#FF9500]/10 text-[#FF9500]"
                        }`}>
                          {apt.status}
                        </span>
                        <Link
                          href="/dashboard/citas"
                          className="p-1 rounded-lg hover:bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Widgets Stack (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Widget 1: Booking Link */}
          <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <BookingLinkWidget url={publicUrl} slug={professional.slug} />
          </div>

          {/* Widget 2: Quick Actions */}
          <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <h3 className="font-medium text-xs text-[#86868B] uppercase tracking-wider">
              Acciones Rápidas
            </h3>
            
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              {/* Tile 1: Add Client */}
              <Link
                href="/dashboard/clientes"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] active:scale-[0.98] transition-all cursor-pointer group border border-black/[0.04]"
              >
                <div className="h-9 w-9 rounded-xl bg-[#007AFF]/10 flex items-center justify-center mb-2 text-[#007AFF]">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] font-medium text-[#1D1D1F] text-center leading-tight">
                  + {labels.client}
                </span>
              </Link>

              {/* Tile 2: Add Appointment */}
              <Link
                href="/dashboard/citas"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] active:scale-[0.98] transition-all cursor-pointer group border border-black/[0.04]"
              >
                <div className="h-9 w-9 rounded-xl bg-[#34C759]/10 flex items-center justify-center mb-2 text-[#34C759]">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] font-medium text-[#1D1D1F] text-center leading-tight">
                  + {labels.appointment}
                </span>
              </Link>

              {/* Tile 3: Clinical Records or Services */}
              <Link
                href={isClinical ? "/dashboard/expedientes" : "/dashboard/servicios"}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] active:scale-[0.98] transition-all cursor-pointer group border border-black/[0.04]"
              >
                <div className="h-9 w-9 rounded-xl bg-[#5856D6]/10 flex items-center justify-center mb-2 text-[#5856D6]">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] font-medium text-[#1D1D1F] text-center leading-tight">
                  {isClinical ? "Expedientes" : "Servicios"}
                </span>
              </Link>

              {/* Tile 4: Payments */}
              <Link
                href="/dashboard/pagos"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] active:scale-[0.98] transition-all cursor-pointer group border border-black/[0.04]"
              >
                <div className="h-9 w-9 rounded-xl bg-[#FF9500]/10 flex items-center justify-center mb-2 text-[#FF9500]">
                  <BarChart2 className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] font-medium text-[#1D1D1F] text-center leading-tight">
                  Verificar Pagos
                </span>
              </Link>
            </div>
          </div>

          {/* Widget 3: Real Business Health & Reminders */}
          <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <h3 className="font-medium text-xs text-[#86868B] uppercase tracking-wider">
              Estado del Consultorio
            </h3>

            {smartAlerts.length === 0 ? (
              <div className="mt-3.5 p-3.5 rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[#34C759] shrink-0"></span>
                <p className="text-xs text-[#34C759] font-medium">
                  ✓ Todo al día. Sin tareas ni cobros pendientes.
                </p>
              </div>
            ) : (
              <ul className="mt-3.5 space-y-2.5">
                {smartAlerts.map((alert, idx) => (
                  <li key={idx}>
                    <Link
                      href={alert.href}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-black/[0.03] transition-colors group cursor-pointer"
                    >
                      <span
                        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: alert.color }}
                      ></span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-medium text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors leading-snug truncate">
                          {alert.title}
                        </h4>
                        <p className="text-[11px] text-[#86868B] font-normal leading-none mt-0.5">
                          {alert.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#86868B] group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

      </div>

      {/* Footer block */}
      <footer className="mt-16 border-t border-[#E5E5EA] pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <span className="font-heading font-semibold text-xs tracking-wider text-[#86868B] uppercase">
          My Appointment
        </span>
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/privacy" className="text-xs font-medium text-[#86868B] hover:text-[#007AFF] transition-colors">
            Política de Privacidad
          </Link>
          <Link href="/terms" className="text-xs font-medium text-[#86868B] hover:text-[#007AFF] transition-colors">
            Términos de Servicio
          </Link>
          <Link href="/support" className="text-xs font-medium text-[#86868B] hover:text-[#007AFF] transition-colors">
            Soporte
          </Link>
          <Link href="/api-status" className="text-xs font-medium text-[#86868B] hover:text-[#007AFF] transition-colors">
            Estado de la API
          </Link>
          <span className="text-xs text-[#86868B] font-normal md:ml-6">
            © 2026
          </span>
        </div>
      </footer>

    </div>
  );
}
