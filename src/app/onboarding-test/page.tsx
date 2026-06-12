import { getAuthUser } from "@/lib/auth";
import OnboardingWizard from "@/components/onboarding/onboarding-test";
import { redirect } from "next/navigation";

export default async function OnboardingTestPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?next=/onboarding-test");
  }

  return (
    <OnboardingWizard userEmail={user.email!} userId={user.id} />
  );
}
