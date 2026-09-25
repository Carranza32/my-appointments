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
      {/* Ambient subtle lighting */}
      <div className="absolute top-0 right-10 -z-10 h-72 w-72 rounded-full bg-[#007AFF]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 -z-10 h-80 w-80 rounded-full bg-[#5856D6]/5 blur-3xl pointer-events-none"></div>

      {/* Calendar Area */}
      <div className="w-full">
        <AppointmentsCalendar
          initialAppointments={appointments}
          initialYear={year}
          initialMonth={month}
          professionalSlug={professional?.slug ?? ""}
          rubro={professional?.rubro ?? "GENERAL"}
        />
      </div>
    </div>
  );
}
