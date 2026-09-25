import { notFound } from "next/navigation";
import Link from "next/link";
import { BookingPortal } from "@/components/booking/booking-portal";
import { parseFormFieldsFromJson, getDefaultFormFields } from "@/lib/form-fields";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ subdomain: string; staffSlug: string }>;
};

export default async function StaffBookingPage({ params }: Props) {
  const { subdomain, staffSlug } = await params;
  const normalizedSubdomain = subdomain.trim().toLowerCase();
  const normalizedStaffSlug = staffSlug.trim().toLowerCase();

  const professional = await prisma.user.findUnique({
    where: { slug: normalizedSubdomain },
    include: {
      config: true,
      locations: { orderBy: { name: "asc" } },
      services: {
        where: { isActive: true, onlineBooking: true },
        include: { staffServices: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!professional?.config) {
    notFound();
  }

  // Solo los planes PRO pueden usar staff slugs. Si no es PRO, retornar 404
  if (professional.planTier !== "PRO") {
    notFound();
  }

  // Buscar el staff específico
  const staff = await prisma.staff.findFirst({
    where: {
      userId: professional.id,
      slug: normalizedStaffSlug,
      isActive: true,
    },
    include: {
      staffServices: true,
    },
  });

  if (!staff) {
    notFound();
  }

  const storedFields = parseFormFieldsFromJson(professional.config.formFields);
  const formFields =
    storedFields.length > 0
      ? storedFields
      : getDefaultFormFields(professional.rubro);

  // Pasamos el staff específico como único miembro de initialStaff.
  // Esto hace que el BookingPortal pre-seleccione al staff y oculte la selección de staff.
  const initialStaff = [
    {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      description: staff.description,
      avatarUrl: staff.avatarUrl,
      weeklyHours: staff.weeklyHours,
    },
  ];

  // Filtrar solo los servicios que este staff puede realizar (o todos si no tiene restricciones)
  const staffServiceIds = staff.staffServices.map((ss) => ss.serviceId);
  const availableServices = professional.services
    .filter((s) => staffServiceIds.length === 0 || staffServiceIds.includes(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      duration: s.duration,
      bufferTime: s.bufferTime,
      price: s.price,
      currency: s.currency,
      staffIds: [staff.id],
    }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-booking-page">
      {/* ── Decorative background orbs ─────────────────────────────────── */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(0,122,255,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "float 9s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[550px] w-[550px] rounded-full opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(88,86,214,0.10) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "float 12s ease-in-out infinite",
          animationDelay: "3s",
        }}
      />
      <div
        className="pointer-events-none absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(255,45,85,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "float 7s ease-in-out infinite",
          animationDelay: "1.5s",
        }}
      />

      {/* ── Top navigation bar ─────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2 md:px-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-[#007AFF] rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/10 border border-white/20 transition-transform group-hover:scale-105">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span
            className="font-extrabold text-[#007AFF] text-base tracking-tight select-none"
            style={{ fontFamily: "var(--font-heading, 'Plus Jakarta Sans', sans-serif)" }}
          >
            My Appointment
          </span>
        </Link>
      </header>

      {/* ── Main portal content ─────────────────────────────────────────── */}
      <main className="relative z-10 px-4 py-8 md:py-12 md:px-6">
        <BookingPortal
          slug={normalizedSubdomain}
          businessName={professional.name}
          rubro={professional.rubro}
          formFields={formFields}
          slotDuration={professional.config.slotDuration}
          avatarUrl={staff.avatarUrl || professional.config.avatarUrl}
          description={staff.description || professional.config.description}
          timezone={professional.config.timezone}
          initialLocations={professional.locations}
          initialStaff={initialStaff}
          initialServices={availableServices}
        />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 mt-8 pb-8 px-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-[11px] font-semibold text-[#727785]">
        <span className="flex items-center gap-1.5">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Secure Portal
        </span>
        {(!professional.config.removeBranding || professional.planTier !== "PRO") && (
          <>
            <span className="hidden sm:inline text-[#c1c6d6]">·</span>
            <span>Powered by My Appointment © 2026</span>
          </>
        )}
      </footer>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { subdomain, staffSlug } = await params;
  const normalizedSubdomain = subdomain.trim().toLowerCase();
  const normalizedStaffSlug = staffSlug.trim().toLowerCase();

  const staff = await prisma.staff.findFirst({
    where: {
      slug: normalizedStaffSlug,
      user: { slug: normalizedSubdomain },
    },
  });

  return {
    title: staff
      ? `Book an appointment with ${staff.name}`
      : "Book an appointment",
  };
}
