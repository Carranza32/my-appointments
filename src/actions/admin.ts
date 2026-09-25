"use server";

import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { PlanTier } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Retrieves global SaaS metrics and recent signups.
 */
export async function getAdminDashboardStats() {
  await requireAdmin();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    totalTenants,
    freeTenants,
    proTenants,
    totalAppointments,
    todayAppointments,
    totalClients,
    recentTenants,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.user.count({ where: { role: "TENANT", planTier: "FREE" } }),
    prisma.user.count({ where: { role: "TENANT", planTier: "PRO" } }),
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        startTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
    prisma.client.count(),
    prisma.user.findMany({
      where: { role: "TENANT" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        rubro: true,
        planTier: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalTenants,
    freeTenants,
    proTenants,
    totalAppointments,
    todayAppointments,
    totalClients,
    recentTenants: recentTenants.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    mrr: proTenants * 15, // USD active pricing (Wompi)
  };
}

/**
 * Returns a list of all tenants matching optional filters.
 */
export async function getAdminTenantsList(params?: {
  search?: string;
  plan?: "FREE" | "PRO" | "ALL";
}) {
  await requireAdmin();

  const search = params?.search?.trim().toLowerCase() || "";
  const plan = params?.plan || "ALL";

  const whereClause: any = {
    role: "TENANT",
  };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  if (plan !== "ALL") {
    whereClause.planTier = plan;
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          appointments: true,
          clients: true,
          locations: true,
          staff: true,
        },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    slug: u.slug,
    rubro: u.rubro,
    planTier: u.planTier,
    createdAt: u.createdAt.toISOString(),
    appointmentsCount: u._count.appointments,
    clientsCount: u._count.clients,
    locationsCount: u._count.locations,
    staffCount: u._count.staff,
  }));
}

/**
 * Gets details of a single tenant.
 */
export async function getAdminTenantDetail(tenantId: string) {
  await requireAdmin();

  const tenant = await prisma.user.findUnique({
    where: { id: tenantId },
    include: {
      config: true,
      googleAccount: true,
      _count: {
        select: {
          appointments: true,
          clients: true,
          locations: true,
          staff: true,
        },
      },
    },
  });

  if (!tenant) {
    throw new Error("Tenant no encontrado");
  }

  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    slug: tenant.slug,
    rubro: tenant.rubro,
    planTier: tenant.planTier,
    createdAt: tenant.createdAt.toISOString(),
    config: tenant.config ? {
      slotDuration: tenant.config.slotDuration,
      bufferTime: tenant.config.bufferTime,
      timezone: tenant.config.timezone,
      removeBranding: tenant.config.removeBranding,
    } : null,
    googleConnected: !!tenant.googleAccount,
    appointmentsCount: tenant._count.appointments,
    clientsCount: tenant._count.clients,
    locationsCount: tenant._count.locations,
    staffCount: tenant._count.staff,
  };
}

/**
 * Manually updates a tenant's subscription plan tier.
 */
export async function updateTenantPlanManual(tenantId: string, newTier: "FREE" | "PRO") {
  await requireAdmin();

  await prisma.user.update({
    where: { id: tenantId },
    data: {
      planTier: newTier === "PRO" ? PlanTier.PRO : PlanTier.FREE,
    },
  });

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { success: true };
}

/**
 * Retrieves revenue metrics and lists active PRO subscription tenants.
 */
export async function getAdminRevenueStats() {
  await requireAdmin();

  const [totalTenants, proTenants, freeTenants] = await Promise.all([
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.user.count({ where: { role: "TENANT", planTier: "PRO" } }),
    prisma.user.count({ where: { role: "TENANT", planTier: "FREE" } }),
  ]);

  const proUsers = await prisma.user.findMany({
    where: { role: "TENANT", planTier: "PRO" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
      createdAt: true,
    },
  });

  const conversionRate = totalTenants > 0 ? (proTenants / totalTenants) * 100 : 0;
  const mrr = proTenants * 15; // Wompi PRO subscription price: 15 USD/mo

  return {
    totalTenants,
    proTenants,
    freeTenants,
    conversionRate: parseFloat(conversionRate.toFixed(1)),
    mrr,
    proUsers: proUsers.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

