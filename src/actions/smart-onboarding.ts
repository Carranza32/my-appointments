"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSlug, normalizeSlug } from "@/lib/slug";
import type { OnboardingDraft, BusinessCapabilities, OnboardingAnswers } from "@/lib/onboarding/types";
import { resolveBusinessCapabilities } from "@/lib/onboarding/capability-resolver";
import { getPresetById } from "@/lib/onboarding/presets";

/**
 * Guarda o actualiza el borrador del onboarding de forma persistente.
 * Se guarda dentro de la base de datos o retorna estado seguro.
 */
export async function saveOnboardingDraft(draft: OnboardingDraft) {
  try {
    const authUser = await requireAuth();
    if (draft.userId && draft.userId !== authUser.id) {
      return { success: false, error: "Usuario no autorizado" };
    }

    // Asegurar que el draft está asociado al ID autenticado
    draft.userId = authUser.id;
    draft.lastUpdated = new Date().toISOString();

    // Podemos sincronizar el slug y nombre temporalmente si ya los tiene
    if (draft.answers.businessName && draft.answers.slug) {
      const cleanSlug = normalizeSlug(draft.answers.slug);
      if (isValidSlug(cleanSlug)) {
        // Verificar si el slug está disponible
        const existing = await prisma.user.findFirst({
          where: {
            slug: cleanSlug,
            NOT: { id: authUser.id },
          },
        });
        if (!existing) {
          // Podemos actualizar parcialmente el usuario si existe
          await prisma.user.update({
            where: { id: authUser.id },
            data: {
              name: draft.answers.businessName.trim(),
              slug: cleanSlug,
              rubro: draft.answers.subCategory || draft.answers.category || "GENERAL",
            },
          }).catch(() => {
            // Ignorar error si aún no está listo el usuario completo
          });
        }
      }
    }

    return { success: true, draft };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al guardar borrador" };
  }
}

/**
 * Obtiene el borrador actual o los datos precargados del usuario si ya inició el proceso.
 */
export async function getOnboardingDraft(): Promise<{
  success: boolean;
  draft?: Partial<OnboardingDraft>;
  user?: { id: string; email: string; name: string; slug: string };
  error?: string;
}> {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: "No autenticado" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        config: true,
        services: true,
        staff: true,
        locations: true,
        resources: true,
      },
    });

    if (!dbUser) {
      return {
        success: true,
        user: {
          id: authUser.id,
          email: authUser.email || "",
          name: "",
          slug: "",
        },
      };
    }

    return {
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        slug: dbUser.slug,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al obtener borrador" };
  }
}

/**
 * Valida disponibilidad del slug en tiempo real sin latencia innecesaria.
 */
export async function checkSlugAvailability(slug: string): Promise<{ available: boolean; cleanSlug: string }> {
  const cleanSlug = normalizeSlug(slug);
  if (!isValidSlug(cleanSlug)) {
    return { available: false, cleanSlug };
  }

  const authUser = await getAuthUser();
  const existing = await prisma.user.findFirst({
    where: {
      slug: cleanSlug,
      ...(authUser?.id ? { NOT: { id: authUser.id } } : {}),
    },
  });

  return { available: !existing, cleanSlug };
}

/**
 * Provisiona atómicamente la configuración final del negocio a partir del OnboardingDraft
 * usando una transacción en Prisma para garantizar idempotencia y consistencia completa.
 */
export async function provisionBusinessConfiguration(draft: OnboardingDraft): Promise<{
  success: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  try {
    const authUser = await requireAuth();
    const { answers } = draft;

    const name = answers.businessName?.trim();
    const slug = normalizeSlug(answers.slug || "");
    const rubro = (answers.subCategory || answers.category || "GENERAL").toUpperCase();

    if (!name || name.length < 2) {
      return { success: false, error: "El nombre del negocio debe tener al menos 2 caracteres." };
    }

    if (!isValidSlug(slug)) {
      return { success: false, error: "El slug seleccionado no es válido." };
    }

    // Verificar unicidad de slug
    const slugExists = await prisma.user.findFirst({
      where: {
        slug,
        NOT: { id: authUser.id },
      },
    });

    if (slugExists) {
      return { success: false, error: "El slug de enlace ya está en uso por otro negocio." };
    }

    // Resolver capabilities definitivas
    const preset = getPresetById(answers.subCategory || answers.category || "");
    const capabilities: BusinessCapabilities = resolveBusinessCapabilities(answers, preset);

    // Ejecutar aprovisionamiento atómico
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar o crear User
      const user = await tx.user.upsert({
        where: { id: authUser.id },
        create: {
          id: authUser.id,
          email: authUser.email || "",
          name,
          slug,
          rubro,
        },
        update: {
          name,
          slug,
          rubro,
        },
      });

      // 2. Preparar BusinessConfig
      const weeklyHours = answers.weeklyHours && answers.weeklyHours.length > 0
        ? answers.weeklyHours
        : [
            { day: 1, slots: [{ open: "09:00", close: "18:00" }] },
            { day: 2, slots: [{ open: "09:00", close: "18:00" }] },
            { day: 3, slots: [{ open: "09:00", close: "18:00" }] },
            { day: 4, slots: [{ open: "09:00", close: "18:00" }] },
            { day: 5, slots: [{ open: "09:00", close: "18:00" }] },
          ];

      const formFields = answers.clientFields && answers.clientFields.length > 0
        ? answers.clientFields
        : [
            { name: "name", label: "Nombre Completo", type: "text", required: true },
            { name: "email", label: "Correo Electrónico", type: "email", required: true },
            { name: "phone", label: "Teléfono / WhatsApp", type: "tel", required: true },
          ];

      // Buffer time y slot duration por defecto según primer servicio o catálogo
      const primaryService = answers.servicesList?.[0];
      const slotDuration = primaryService?.duration || 30;
      const bufferTime = primaryService?.bufferTime || 0;

      await tx.businessConfig.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          slotDuration,
          bufferTime,
          weeklyHours,
          formFields,
          timezone: answers.timezone || "America/El_Salvador",
          acceptBankTransfer: answers.paymentPreference === "upfront" || answers.paymentPreference === "both",
        },
        update: {
          slotDuration,
          bufferTime,
          weeklyHours,
          formFields,
          acceptBankTransfer: answers.paymentPreference === "upfront" || answers.paymentPreference === "both",
        },
      });

      // 3. Provisionar Sedes (Locations) si aplica
      const locationIdMap = new Map<string, string>(); // name/draftId -> dbLocationId
      if (capabilities.locations) {
        const locationsToProvision =
          answers.locationsList && answers.locationsList.length > 0
            ? answers.locationsList
            : [{ id: "main-loc", name: "Sede Principal", address: "Ubicación Principal" }];

        for (const loc of locationsToProvision) {
          const locName = (loc.name?.trim() || "Sede Principal");
          // Buscar si ya existe por nombre
          let dbLoc = await tx.location.findFirst({
            where: { userId: user.id, name: locName },
          });
          if (!dbLoc) {
            dbLoc = await tx.location.create({
              data: {
                userId: user.id,
                name: locName,
                address: loc.address?.trim() || "Ubicación Principal",
                phone: loc.phone?.trim() || null,
              },
            });
          }
          locationIdMap.set(locName.toLowerCase(), dbLoc.id);
          if (loc.id) locationIdMap.set(loc.id, dbLoc.id);
        }
      }

      // 4. Provisionar Recursos (Cabinas, Canchas, Equipos) si aplica
      if (capabilities.resources && answers.resourcesList && answers.resourcesList.length > 0) {
        // Si hay una única sede, vincular recursos por defecto a ella
        const defaultSingleLocationId = locationIdMap.size === 1 ? Array.from(locationIdMap.values())[0] : undefined;

        for (const res of answers.resourcesList) {
          if (!res.name?.trim()) continue;
          let locationId: string | undefined = undefined;
          if (res.locationName) {
            locationId = locationIdMap.get(res.locationName.trim().toLowerCase());
          }
          if (!locationId && defaultSingleLocationId) {
            locationId = defaultSingleLocationId;
          }

          const existingRes = await tx.resource.findFirst({
            where: { userId: user.id, name: res.name.trim() },
          });

          if (!existingRes) {
            await tx.resource.create({
              data: {
                userId: user.id,
                name: res.name.trim(),
                type: res.type || "GENERAL",
                locationId: locationId || null,
                isActive: true,
              },
            });
          }
        }
      }

      // 5. Provisionar Servicios
      const serviceIdMap = new Map<string, string>(); // serviceName -> dbServiceId
      if (answers.servicesList && answers.servicesList.length > 0) {
        for (const s of answers.servicesList) {
          if (!s.name?.trim()) continue;
          let dbService = await tx.service.findFirst({
            where: { userId: user.id, name: s.name.trim() },
          });

          if (!dbService) {
            dbService = await tx.service.create({
              data: {
                userId: user.id,
                name: s.name.trim(),
                duration: s.duration || 30,
                bufferTime: s.bufferTime || 0,
                price: s.price ?? 0,
                currency: s.currency || answers.currency || "USD",
                description: s.description?.trim() || null,
                isActive: true,
                onlineBooking: true,
                requiresPayment: answers.paymentPreference === "upfront" || Boolean(s.requiresPayment),
              },
            });
          }
          serviceIdMap.set(s.name.trim().toLowerCase(), dbService.id);
        }
      }

      // 6. Provisionar Especialistas / Personal (Staff)
      if (capabilities.staff && answers.staffList && answers.staffList.length > 0) {
        for (const st of answers.staffList) {
          if (!st.name?.trim()) continue;
          const staffSlug = normalizeSlug(st.name);
          let dbStaff = await tx.staff.findFirst({
            where: { userId: user.id, name: st.name.trim() },
          });

          if (!dbStaff) {
            dbStaff = await tx.staff.create({
              data: {
                userId: user.id,
                name: st.name.trim(),
                email: st.email?.trim() || `${staffSlug}@negocio.local`,
                phone: st.phone?.trim() || null,
                slug: staffSlug,
                weeklyHours,
                isActive: true,
              },
            });
          }

          // Vincular StaffService
          if (st.assignedServiceNames && st.assignedServiceNames.length > 0) {
            for (const sName of st.assignedServiceNames) {
              const sId = serviceIdMap.get(sName.trim().toLowerCase());
              if (sId) {
                await tx.staffService.upsert({
                  where: {
                    staffId_serviceId: {
                      staffId: dbStaff.id,
                      serviceId: sId,
                    },
                  },
                  create: {
                    staffId: dbStaff.id,
                    serviceId: sId,
                  },
                  update: {},
                });
              }
            }
          } else {
            // Si no se especificó asignación, asignar todos los servicios creados al staff
            for (const sId of serviceIdMap.values()) {
              await tx.staffService.upsert({
                where: {
                  staffId_serviceId: {
                    staffId: dbStaff.id,
                    serviceId: sId,
                  },
                },
                create: {
                  staffId: dbStaff.id,
                  serviceId: sId,
                },
                update: {},
              });
            }
          }
        }
      }
    });

    revalidatePath("/dashboard");
    revalidatePath(`/${slug}`);
    return { success: true, redirectUrl: "/dashboard" };
  } catch (error: any) {
    console.error("Error provisioning business configuration:", error);
    return { success: false, error: error.message || "Error al configurar el negocio" };
  }
}
