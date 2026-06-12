export const RESERVED_SLUGS = new Set([
  "login",
  "signup",
  "dashboard",
  "onboarding",
  "auth",
  "api",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function getBusinessTimeZone(): string {
  return process.env.BUSINESS_TIMEZONE ?? "America/Mexico_City";
}

export function buildAppointmentRange(
  dateStr: string,
  timeStr: string,
  durationMinutes: number,
): { startTime: Date; endTime: Date } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  return { startTime, endTime };
}

export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
