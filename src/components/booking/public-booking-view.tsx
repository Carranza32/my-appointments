import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseFormFieldsFromJson, getDefaultFormFields } from "@/lib/form-fields";
import {
  AdaptiveBusinessData,
  AdaptiveServiceItem,
  AdaptiveStaffItem,
  AdaptiveLocationItem,
  AdaptiveResourceItem,
  inferCapabilitiesFromEntities,
} from "@/lib/booking/adaptive-engine";
import { AdaptiveBookingPortal } from "@/components/booking/adaptive-booking-portal";

type Props = {
  slug: string;
};

export async function PublicBookingView({ slug }: Props) {
  const normalized = slug.trim().toLowerCase();

  const professional = await prisma.user.findUnique({
    where: { slug: normalized },
    include: {
      config: true,
      locations: { orderBy: { name: "asc" } },
      staff: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      services: {
        where: { isActive: true, onlineBooking: true },
        include: { staffServices: true },
        orderBy: { createdAt: "asc" },
      },
      resources: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!professional?.config) {
    notFound();
  }

  const rawFields = Array.isArray(professional.config.formFields)
    ? (professional.config.formFields as any[])
    : [];
  const brandingEntry = rawFields.find((f: any) => f?.name === "__portal_branding__");

  const storedFields = parseFormFieldsFromJson(professional.config.formFields);
  const formFields =
    storedFields.length > 0
      ? storedFields
      : getDefaultFormFields(professional.rubro);

  const adaptiveServices: AdaptiveServiceItem[] = professional.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration: s.duration,
    bufferTime: s.bufferTime,
    price: s.price,
    currency: s.currency,
    staffIds: s.staffServices.map((ss) => ss.staffId),
    requiresPayment: s.requiresPayment,
  }));

  const adaptiveStaff: AdaptiveStaffItem[] = (
    professional.planTier === "PRO" ? professional.staff : []
  ).map((st) => ({
    id: st.id,
    name: st.name,
    email: st.email,
    phone: st.phone,
    description: st.description,
    avatarUrl: st.avatarUrl,
    weeklyHours: st.weeklyHours,
  }));

  const adaptiveLocations: AdaptiveLocationItem[] = professional.locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    address: loc.address,
    phone: loc.phone,
  }));

  const adaptiveResources: AdaptiveResourceItem[] = professional.resources.map((res) => ({
    id: res.id,
    name: res.name,
    type: res.type,
    locationId: res.locationId,
    isActive: res.isActive,
  }));

  const capabilities = inferCapabilitiesFromEntities({
    rubro: professional.rubro,
    planTier: professional.planTier as "FREE" | "PRO",
    services: adaptiveServices,
    staff: adaptiveStaff,
    locations: adaptiveLocations,
    resources: adaptiveResources,
    acceptBankTransfer: professional.config.acceptBankTransfer,
    formFields,
  });

  const businessData: AdaptiveBusinessData = {
    slug: normalized,
    businessName: professional.name,
    rubro: professional.rubro,
    planTier: professional.planTier as "FREE" | "PRO",
    services: adaptiveServices,
    staff: adaptiveStaff,
    locations: adaptiveLocations,
    resources: adaptiveResources,
    capabilities,
    config: {
      slotDuration: professional.config.slotDuration,
      bufferTime: professional.config.bufferTime,
      formFields,
      acceptBankTransfer: professional.config.acceptBankTransfer,
      bankName: professional.config.bankName,
      bankClabe: professional.config.bankClabe,
      bankHolder: professional.config.bankHolder,
      bankInstructions: professional.config.bankInstructions,
      timezone: professional.config.timezone,
      description: professional.config.description,
      avatarUrl: professional.config.avatarUrl,
      whatsappNumber: professional.config.whatsappNumber,
      enableWhatsApp: professional.config.enableWhatsApp,
      removeBranding: professional.config.removeBranding,
      coverUrl: brandingEntry?.coverUrl ?? null,
      phone: brandingEntry?.phone ?? null,
      location: brandingEntry?.location ?? null,
      themeColor: brandingEntry?.themeColor ?? null,
      modality: brandingEntry?.modality ?? null,
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-booking-page">
      {/* ── Apple Glass Ambient Glow Background ── */}
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

      {/* ── Top Navigation Bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2 md:px-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 bg-[#007AFF] rounded-xl flex items-center justify-center shadow-sm shadow-[#007AFF]/20 border border-white/40 transition-transform group-hover:scale-105 active:scale-95">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span
            className="font-extrabold text-[#1D1D1F] text-base tracking-tight select-none"
            style={{ fontFamily: "var(--font-heading, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif)" }}
          >
            My Appointment
          </span>
        </Link>
      </header>

      {/* ── Main Adaptive Booking Content ── */}
      <main className="relative z-10 px-4 py-8 md:py-12 md:px-6">
        <AdaptiveBookingPortal data={businessData} />
      </main>

      {/* ── Apple Style Subtle Footer ── */}
      <footer className="relative z-10 mt-8 pb-8 px-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-[11px] font-semibold text-[#86868B]">
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-[#34C759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Reserva Segura
        </span>
        {(!professional.config.removeBranding || professional.planTier !== "PRO") && (
          <>
            <span className="hidden sm:inline text-[#C7C7CC]">·</span>
            <span>Powered by My Appointment</span>
          </>
        )}
      </footer>
    </div>
  );
}
