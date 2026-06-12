import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfessional() {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  return prisma.user.findFirst({
    where: {
      OR: [{ id: authUser.id }, { email: authUser.email ?? "" }],
    },
    include: { config: true, googleAccount: true },
  });
}

export async function requireAuth() {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error("UNAUTHORIZED");
  }
  return authUser;
}
