import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmAppointmentWidget } from "./confirm-widget";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ConfirmPage({ params }: Props) {
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          config: true,
        },
      },
      service: true,
      staff: true,
    },
  });

  if (!appointment) {
    notFound();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F5F7] text-[#1D1D1F] px-4 py-8 md:py-16 flex items-center justify-center">
      <ConfirmAppointmentWidget
        appointmentId={appointment.id}
        clientName={appointment.clientName}
        businessName={appointment.user.name}
        businessSlug={appointment.user.slug}
        businessPhone={appointment.user.config?.whatsappNumber || null}
        serviceName={appointment.service?.name || "Servicio"}
        serviceDuration={appointment.service?.duration || appointment.user.config?.slotDuration || 30}
        staffName={appointment.staff?.name || null}
        startTime={appointment.startTime.toISOString()}
        endTime={appointment.endTime.toISOString()}
        status={appointment.status}
        price={appointment.price || appointment.service?.price || 0}
        meetingUrl={(appointment.clientMetadata as any)?.meetingUrl || null}
      />
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { user: true },
  });

  return {
    title: appointment
      ? `Confirmar cita con ${appointment.user.name}`
      : "Confirmar cita",
  };
}
