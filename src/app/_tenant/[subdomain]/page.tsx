import { prisma } from "@/lib/prisma";
import { PublicBookingView } from "@/components/booking/public-booking-view";

type Props = {
  params: Promise<{ subdomain: string }>;
};

export default async function TenantPortalPage({ params }: Props) {
  const { subdomain } = await params;
  return <PublicBookingView slug={subdomain} />;
}

export async function generateMetadata({ params }: Props) {
  const { subdomain } = await params;
  const professional = await prisma.user.findUnique({
    where: { slug: subdomain.trim().toLowerCase() },
  });

  return {
    title: professional
      ? `Reservar cita — ${professional.name}`
      : "Reservar cita",
  };
}
