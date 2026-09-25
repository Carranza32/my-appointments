import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CancelAppointmentWidget } from "./cancel-widget";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CancelPage({ params }: Props) {
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

  if (!appointment) {
    notFound();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F5F7] text-[#1D1D1F] px-4 py-8 md:py-16 flex items-center justify-center">
      <CancelAppointmentWidget
        appointmentId={appointment.id}
        clientName={appointment.clientName}
        businessName={appointment.user.name}
        startTime={appointment.startTime.toISOString()}
        status={appointment.status}
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
      ? `Cancelar cita con ${appointment.user.name}`
      : "Cancelar cita",
  };
}
