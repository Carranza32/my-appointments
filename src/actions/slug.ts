"use server";

import { prisma } from "@/lib/prisma";
import { isValidSlug, normalizeSlug } from "@/lib/slug";
import { getAuthUser } from "@/lib/auth";

export async function checkSlugAvailability(rawSlug: string) {
  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    return { slug, available: false, valid: false, message: "Ingresa un slug." };
  }

  if (!isValidSlug(slug)) {
    return {
      slug,
      available: false,
      valid: false,
      message: "Usa solo letras minúsculas, números y guiones (mín. 3 caracteres).",
    };
  }

  const authUser = await getAuthUser();
  const existing = await prisma.user.findUnique({ where: { slug } });

  if (!existing) {
    return { slug, available: true, valid: true, message: "Disponible" };
  }

  if (authUser && existing.id === authUser.id) {
    return { slug, available: true, valid: true, message: "Es tu slug actual" };
  }

  return { slug, available: false, valid: true, message: "Ya está en uso" };
}
