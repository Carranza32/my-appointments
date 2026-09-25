import { getProfessional } from "./auth";

/**
 * Validates that the current authenticated user has the ADMIN role.
 * Throws a FORBIDDEN error if check fails.
 */
export async function requireAdmin() {
  const professional = await getProfessional();
  if (!professional || professional.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return professional;
}
