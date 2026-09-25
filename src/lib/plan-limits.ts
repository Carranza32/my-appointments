import { PlanTier } from "@prisma/client";

export type PlanLimits = {
  maxAppointmentsPerMonth: number;
  maxClients: number;
  maxLocations: number;
  maxStaff: number;
  maxServices: number;
  maxFormFields: number;

  googleCalendar: boolean;
  whatsappReminders: boolean;
  emailReminders: boolean;
  removeBranding: boolean;
  clinicalRecords: boolean;
  customFormFields: boolean;
  multipleServices: boolean;
  analytics: boolean;
  stripeConnect: boolean;
  embeddableWidget: boolean;
  customSubdomain: boolean;
  prioritySupport: boolean;
  staffSlugs: boolean;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    maxAppointmentsPerMonth: 30,
    maxClients: 50,
    maxLocations: 1,
    maxStaff: 0,
    maxServices: 1,
    maxFormFields: 3,

    googleCalendar: false,
    whatsappReminders: false,
    emailReminders: true,
    removeBranding: false,
    clinicalRecords: false,
    customFormFields: false,
    multipleServices: false,
    analytics: false,
    stripeConnect: false,
    embeddableWidget: false,
    customSubdomain: false,
    prioritySupport: false,
    staffSlugs: false,
  },
  PRO: {
    maxAppointmentsPerMonth: Infinity,
    maxClients: Infinity,
    maxLocations: Infinity,
    maxStaff: Infinity,
    maxServices: Infinity,
    maxFormFields: Infinity,

    googleCalendar: true,
    whatsappReminders: true,
    emailReminders: true,
    removeBranding: true,
    clinicalRecords: true,
    customFormFields: true,
    multipleServices: true,
    analytics: true,
    stripeConnect: true,
    embeddableWidget: true,
    customSubdomain: true,
    prioritySupport: true,
    staffSlugs: true,
  },
};

export function getPlanLimits(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier] || PLAN_LIMITS.FREE;
}
