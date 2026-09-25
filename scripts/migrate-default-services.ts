import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando migración de Servicios por defecto...");

  const users = await prisma.user.findMany({
    include: {
      config: true,
      services: true,
      staff: true,
      appointments: {
        where: { serviceId: null },
      },
    },
  });

  console.log(`📊 Encontrados ${users.length} usuarios/tenants.`);

  let createdServicesCount = 0;
  let linkedAppointmentsCount = 0;
  let linkedStaffCount = 0;

  for (const user of users) {
    let defaultService = user.services[0];

    // If user has no services, create one from their BusinessConfig
    if (!defaultService) {
      const slotDuration = user.config?.slotDuration || 30;
      const bufferTime = user.config?.bufferTime || 0;

      const serviceName =
        user.rubro === "PSICOLOGIA"
          ? "Sesión de Terapia"
          : user.rubro === "SALUD"
          ? "Consulta Médica"
          : user.rubro === "BELLEZA"
          ? "Corte / Servicio General"
          : user.rubro === "FITNESS"
          ? "Entrenamiento / Clase"
          : "Servicio General";

      defaultService = await prisma.service.create({
        data: {
          userId: user.id,
          name: serviceName,
          description: "Servicio predeterminado configurado automáticamente.",
          duration: slotDuration,
          bufferTime: bufferTime,
          price: 0,
          currency: "MXN",
          isActive: true,
          onlineBooking: true,
          requiresPayment: false,
        },
      });

      createdServicesCount++;
      console.log(`✅ Creado servicio «${serviceName}» para tenant ${user.slug} (${user.id})`);
    }

    // Link unassigned appointments to this service
    if (user.appointments.length > 0) {
      const aptUpdate = await prisma.appointment.updateMany({
        where: {
          userId: user.id,
          serviceId: null,
        },
        data: {
          serviceId: defaultService.id,
        },
      });
      linkedAppointmentsCount += aptUpdate.count;
      console.log(`🔗 Asociadas ${aptUpdate.count} citas al servicio «${defaultService.name}» de ${user.slug}`);
    }

    // Link staff to this service if not already linked
    for (const staffMember of user.staff) {
      try {
        await prisma.staffService.upsert({
          where: {
            staffId_serviceId: {
              staffId: staffMember.id,
              serviceId: defaultService.id,
            },
          },
          update: {},
          create: {
            staffId: staffMember.id,
            serviceId: defaultService.id,
          },
        });
        linkedStaffCount++;
      } catch (err) {
        console.error(`Error al vincular staff ${staffMember.name}:`, err);
      }
    }
  }

  console.log("\n🎉 Migración completada exitosamente:");
  console.log(`- Servicios creados: ${createdServicesCount}`);
  console.log(`- Citas vinculadas: ${linkedAppointmentsCount}`);
  console.log(`- Asignaciones de Staff: ${linkedStaffCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Error durante la migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
