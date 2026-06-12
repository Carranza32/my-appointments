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
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50 px-4 py-8 md:py-16 flex items-center justify-center">
      {/* Decorative Premium Background Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-[120px] dark:bg-primary-500/5 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] -z-10 h-[550px] w-[550px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5 animate-float-delayed pointer-events-none"></div>

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
