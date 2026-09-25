import { PlanTier } from "@prisma/client";
import { getPlanLimits, PlanLimits } from "./plan-limits";
import { prisma } from "./prisma";

export type PlanCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; upgradeRequired: true };

/**
 * Checks if the tenant can create a new appointment in the current calendar month.
 */
export async function canCreateAppointment(
  userId: string,
  planTier: PlanTier
): Promise<PlanCheckResult> {
  const limits = getPlanLimits(planTier);
  
  if (limits.maxAppointmentsPerMonth === Infinity) {
    return { allowed: true };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.appointment.count({
    where: {
      userId,
      createdAt: { gte: monthStart, lte: monthEnd },
      status: { not: "CANCELADA" },
    },
  });

  if (count >= limits.maxAppointmentsPerMonth) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limits.maxAppointmentsPerMonth} citas por mes en el plan gratuito.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Checks if the tenant can create a new client.
 */
export async function canCreateClient(
  userId: string,
  planTier: PlanTier
): Promise<PlanCheckResult> {
  const limits = getPlanLimits(planTier);
  
  if (limits.maxClients === Infinity) return { allowed: true };

  const count = await prisma.client.count({ where: { userId } });

  if (count >= limits.maxClients) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limits.maxClients} clientes en el plan gratuito.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Checks if the tenant can create a new location (sede).
 */
export async function canCreateLocation(
  userId: string,
  planTier: PlanTier
): Promise<PlanCheckResult> {
  const limits = getPlanLimits(planTier);
  
  if (limits.maxLocations === Infinity) return { allowed: true };

  const count = await prisma.location.count({ where: { userId } });

  if (count >= limits.maxLocations) {
    return {
      allowed: false,
      reason: `El plan gratuito permite registrar solo ${limits.maxLocations} sede.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Checks if the tenant can create a new staff member.
 */
export async function canCreateStaff(
  userId: string,
  planTier: PlanTier
): Promise<PlanCheckResult> {
  const limits = getPlanLimits(planTier);
  
  if (limits.maxStaff === Infinity) return { allowed: true };

  if (limits.maxStaff === 0) {
    return {
      allowed: false,
      reason: "La gestión de personal está disponible únicamente en el plan PRO.",
      upgradeRequired: true,
    };
  }

  const count = await prisma.staff.count({ where: { userId } });

  if (count >= limits.maxStaff) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limits.maxStaff} empleados en tu plan.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Checks if a feature flag is enabled for the plan tier.
 */
export function canUseFeature(
  planTier: PlanTier,
  feature: keyof Pick<PlanLimits,
    | 'googleCalendar'
    | 'whatsappReminders'
    | 'clinicalRecords'
    | 'customFormFields'
    | 'multipleServices'
    | 'analytics'
    | 'stripeConnect'
    | 'embeddableWidget'
    | 'customSubdomain'
  >
): PlanCheckResult {
  const limits = getPlanLimits(planTier);
  
  if (limits[feature]) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Esta función está disponible únicamente en el plan PRO.`,
    upgradeRequired: true,
  };
}
