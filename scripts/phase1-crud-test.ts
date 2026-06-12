import { prisma } from "../src/lib/prisma";
import { Rubro } from "@prisma/client";

const TEST_EMAIL = "phase1-test@example.com";
const TEST_SLUG = "phase1-test-slug";

async function main() {
  const created = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      name: "Phase 1 Test",
      slug: TEST_SLUG,
      rubro: Rubro.CONSULTORIA,
    },
  });

  const found = await prisma.user.findUnique({
    where: { slug: TEST_SLUG },
  });

  if (!found || found.id !== created.id) {
    throw new Error("findUnique did not return the created user");
  }

  await prisma.user.delete({ where: { id: created.id } });

  console.log("Phase 1 CRUD test OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
