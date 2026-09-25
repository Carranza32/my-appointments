"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PlanTier } from "@prisma/client";

/**
 * Server Action for local development sandbox simulation.
 * Toggles the authenticated tenant plan tier.
 */
export async function togglePlanDev(targetTier: "FREE" | "PRO") {
  try {
    const tenant = await withTenant();

    await prisma.user.update({
      where: { id: tenant.userId },
      data: {
        planTier: targetTier === "PRO" ? PlanTier.PRO : PlanTier.FREE,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true, newTier: targetTier };
  } catch (error: any) {
    console.error("[togglePlanDev Action Error]:", error);
    return { error: error.message || "Failed to update plan" };
  }
}
