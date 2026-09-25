import { PublicBookingView } from "@/components/booking/public-booking-view";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SlugBookingPage({ params }: Props) {
  const { slug } = await params;
  return <PublicBookingView slug={slug} />;
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
