"use server";

import { Rubro } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getDefaultFormFields } from "@/lib/form-fields";
import { prisma } from "@/lib/prisma";
import { isValidSlug, normalizeSlug } from "@/lib/slug";
import type { WeeklyHours } from "@/types/business";

export type OnboardingInput = {
  name: string;
  rubro: Rubro;
  slug: string;
};

export async function completeOnboarding(input: OnboardingInput) {
  const authUser = await requireAuth();
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug);

  if (!name || name.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres." };
  }

  if (!isValidSlug(slug)) {
    return { error: "El slug no es válido." };
  }

  if (!Object.values(Rubro).includes(input.rubro)) {
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
  const formFields = getDefaultFormFields(input.rubro);

  await prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email,
      name,
      slug,
      rubro: input.rubro,
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
      rubro: input.rubro,
      config: {
        upsert: {
          create: { weeklyHours, formFields },
          update: { formFields },
        },
      },
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard/settings");
}
