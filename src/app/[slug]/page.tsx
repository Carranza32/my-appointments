import { notFound } from "next/navigation";
import { BookingPortal } from "@/components/booking/booking-portal";
import { isReservedSlug } from "@/lib/booking";
import { parseFormFieldsFromJson, getDefaultFormFields } from "@/lib/form-fields";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicBookingPage({ params }: Props) {
  const { slug } = await params;
  const normalized = slug.trim().toLowerCase();

  if (isReservedSlug(normalized)) {
    notFound();
  }

  const professional = await prisma.user.findUnique({
    where: { slug: normalized },
    include: {
      config: true,
      locations: {
        orderBy: { name: "asc" },
      },
      staff: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!professional?.config) {
    notFound();
  }

  const storedFields = parseFormFieldsFromJson(professional.config.formFields);
  const formFields =
    storedFields.length > 0
      ? storedFields
      : getDefaultFormFields(professional.rubro);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50 px-4 py-8 md:py-16">
      {/* Decorative Premium Background Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-[120px] dark:bg-primary-500/5 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] -z-10 h-[550px] w-[550px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5 animate-float-delayed pointer-events-none"></div>

      {/* Floating Theme Toggle (Top Right) */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto w-full">
        <BookingPortal
          slug={normalized}
          businessName={professional.name}
          rubro={professional.rubro}
          formFields={formFields}
          slotDuration={professional.config.slotDuration}
          avatarUrl={professional.config.avatarUrl}
          description={professional.config.description}
          timezone={professional.config.timezone}
          initialLocations={professional.locations}
          initialStaff={professional.staff}
        />
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const professional = await prisma.user.findUnique({
    where: { slug: slug.trim().toLowerCase() },
  });

  return {
    title: professional
      ? `Reservar cita — ${professional.name}`
      : "Reservar cita",
  };
}
