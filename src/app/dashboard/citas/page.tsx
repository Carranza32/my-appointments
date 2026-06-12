import { AppointmentsCalendar } from "@/components/dashboard/appointments-calendar";
import { getAppointmentsForMonth } from "@/actions/appointments";
import { getProfessional } from "@/lib/auth";

export default async function CitasPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const [appointments, professional] = await Promise.all([
    getAppointmentsForMonth(year, month),
    getProfessional()
  ]);

  return (
    <div className="relative w-full pb-12">
      {/* Decorative Glows in Background */}
      <div className="absolute top-10 right-10 -z-10 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/5 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 -z-10 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/5 animate-float-delayed pointer-events-none"></div>

      {/* Calendar Area */}
      <div className="w-full">
        <AppointmentsCalendar
          initialAppointments={appointments}
          initialYear={year}
          initialMonth={month}
          professionalSlug={professional?.slug ?? ""}
        />
      </div>
    </div>
  );
}
