"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getDefaultFormFields } from "@/lib/form-fields";
import { prisma } from "@/lib/prisma";
import { isValidSlug, normalizeSlug } from "@/lib/slug";
import { RUBRO_CATALOG } from "@/lib/rubros";
import type { WeeklyHours } from "@/types/business";

export type OnboardingInput = {
  name: string;
  rubro: string;
  slug: string;
};

export async function completeOnboarding(input: OnboardingInput) {
  const authUser = await requireAuth();
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug);
  const rubroNormalized = input.rubro.trim().toUpperCase();

  if (!name || name.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres." };
  }

  if (!isValidSlug(slug)) {
    return { error: "El slug no es válido." };
  }

  if (!RUBRO_CATALOG[rubroNormalized]) {
    return { error: "Selecciona un rubro válido." };
  }

  const slugTaken = await prisma.user.findFirst({
    where: { slug, NOT: { id: authUser.id } },
  });

  if (slugTaken) {
    return { error: "Ese slug ya está en uso." };
  }

  const email = authUser.email;
  if (!email) {
    return { error: "Tu cuenta no tiene email asociado." };
  }

  const weeklyHours: WeeklyHours = [];
  const formFields = getDefaultFormFields(rubroNormalized);
  const rubroConfig = RUBRO_CATALOG[rubroNormalized];

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email,
      name,
      slug,
      rubro: rubroNormalized,
      config: {
        create: {
          weeklyHours,
          formFields,
        },
      },
    },
    update: {
      name,
      slug,
      rubro: rubroNormalized,
      config: {
        upsert: {
          create: { weeklyHours, formFields },
          update: { formFields },
        },
      },
    },
  });

  // Seed default services from rubro catalog if user has no services
  const existingServicesCount = await prisma.service.count({
    where: { userId: user.id },
  });

  if (existingServicesCount === 0 && rubroConfig?.suggestedServices) {
    for (const s of rubroConfig.suggestedServices) {
      await prisma.service.create({
        data: {
          userId: user.id,
          name: s.name,
          duration: s.duration,
          price: s.price,
          currency: "USD",
          isActive: true,
          onlineBooking: true,
        },
      });
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/settings");
}
