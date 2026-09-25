"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { withTenant } from "@/lib/tenant";
import { canUseFeature } from "@/lib/plan-guard";

const TOKEN_LIFETIME_MS = 55 * 60 * 1000;

export async function persistGoogleAccountFromSession() {
  const tenant = await withTenant();

  const featureCheck = canUseFeature(tenant.planTier, "googleCalendar");
  if (!featureCheck.allowed) {
    return { error: featureCheck.reason };
  }

  const supabase = await createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { error: "No se pudo obtener la sesión de autenticación." };
  }

  const accessToken = session.provider_token;
  const refreshToken = session.provider_refresh_token;

  if (!accessToken) {
    return {
      error:
        "Google no devolvió access token. Verifica los scopes en Supabase y vuelve a conectar.",
    };
  }

  if (!refreshToken) {
    return {
      error:
        "Google no devolvió refresh token. Usa prompt=consent y access_type=offline, luego reconecta.",
    };
  }

  const expiryDate = BigInt(Date.now() + TOKEN_LIFETIME_MS);

  await prisma.googleAccount.upsert({
    where: { userId: tenant.userId },
    create: {
      userId: tenant.userId,
      accessToken,
      refreshToken,
      expiryDate,
    },
    update: {
      accessToken,
      refreshToken,
      expiryDate,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/integrations");

  return { success: true };
}

export async function disconnectGoogleCalendar() {
  const authUser = await requireAuth();

  await prisma.googleAccount.deleteMany({
    where: { userId: authUser.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/integrations");

  return { success: true };
}
