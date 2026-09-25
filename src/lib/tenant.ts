import { getProfessional, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanTier } from "@prisma/client";

export type TenantContext = {
  userId: string;
  email: string;
  name: string;
  slug: string;          // El subdominio del negocio
  planTier: PlanTier;
  configId: string;
  rubro: string;
};

export async function withTenant(): Promise<TenantContext> {
  await requireAuth();
  const professional = await getProfessional();
  
  if (!professional?.config) {
    throw new Error("TENANT_NOT_CONFIGURED");
  }

  return {
    userId: professional.id,
    email: professional.email,
    name: professional.name,
    slug: professional.slug,
    planTier: professional.planTier,
    configId: professional.config.id,
    rubro: professional.rubro,
  };
}

export async function resolveTenantBySubdomain(subdomain: string) {
  const professional = await prisma.user.findUnique({
    where: { slug: subdomain.trim().toLowerCase() },
    include: { config: true },
  });

  if (!professional?.config) return null;

  return {
    userId: professional.id,
    name: professional.name,
    slug: professional.slug,
    planTier: professional.planTier,
    rubro: professional.rubro,
    config: professional.config,
  };
}
