import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeSlug, isValidSlug } from "@/lib/slug";
import { getDefaultFormFields } from "@/lib/form-fields";
import { Rubro } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ available: false });
  }

  const normalized = normalizeSlug(slug);
  if (!isValidSlug(normalized)) {
    return NextResponse.json({ available: false });
  }

  const authUser = await getAuthUser();
  const existing = await prisma.user.findUnique({ where: { slug: normalized } });

  if (!existing) {
    return NextResponse.json({ available: true });
  }

  if (authUser && existing.id === authUser.id) {
    return NextResponse.json({ available: true });
  }

  return NextResponse.json({ available: false });
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { profile, schedule, slot } = await req.json();

    const name = profile.displayName?.trim();
    const slug = normalizeSlug(profile.slug);

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "El nombre debe tener al menos 2 caracteres." }, { status: 400 });
    }

    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "El enlace no es válido." }, { status: 400 });
    }

    const slugTaken = await prisma.user.findFirst({
      where: { slug, NOT: { id: authUser.id } },
    });

    if (slugTaken) {
      return NextResponse.json({ error: "Ese enlace ya está en uso." }, { status: 400 });
    }

    // Map rubro from wizard to database enum
    let rubroDb: Rubro = Rubro.CONSULTORIA;
    const mappedRubro = profile.rubro?.toLowerCase();
    if (["medico", "psicologo", "nutricionista", "dentista", "fisioterapeuta"].includes(mappedRubro)) {
      rubroDb = Rubro.SALUD;
    } else if (["estetica"].includes(mappedRubro)) {
      rubroDb = Rubro.BELLEZA;
    } else {
      rubroDb = Rubro.CONSULTORIA;
    }

    // Parse weekly hours to array of DaySchedule
    const weeklyHours: any[] = [];
    const dayIndices: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    if (schedule?.weeklyHours) {
      for (const [dayKey, dayData] of Object.entries(schedule.weeklyHours) as [string, any][]) {
        if (dayData.enabled) {
          const slots = dayData.ranges.map((r: any) => ({ open: r.start, close: r.end }));
          if (slots.length > 0) {
            weeklyHours.push({
              day: dayIndices[dayKey],
              slots,
            });
          }
        }
      }
    }

    const formFields = getDefaultFormFields(rubroDb);
    const description = profile.bio?.trim() || null;

    // Save configuration
    await prisma.user.upsert({
      where: { id: authUser.id },
      create: {
        id: authUser.id,
        email: authUser.email!,
        name,
        slug,
        rubro: rubroDb,
        config: {
          create: {
            weeklyHours,
            formFields,
            slotDuration: slot.duration,
            bufferTime: slot.buffer,
            description,
          },
        },
      },
      update: {
        name,
        slug,
        rubro: rubroDb,
        config: {
          upsert: {
            create: {
              weeklyHours,
              formFields,
              slotDuration: slot.duration,
              bufferTime: slot.buffer,
              description,
            },
            update: {
              weeklyHours,
              slotDuration: slot.duration,
              bufferTime: slot.buffer,
              description,
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      publicUrl: `/${slug}`,
    });
  } catch (err: any) {
    console.error("[api/onboarding] Error:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
