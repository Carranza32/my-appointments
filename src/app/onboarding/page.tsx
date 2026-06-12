import { redirect } from "next/navigation";
import { OnboardingWizardPremium } from "@/components/onboarding/onboarding-wizard-premium";
import { getProfessional, getAuthUser } from "@/lib/auth";

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/onboarding");

  const professional = await getProfessional();
  if (professional?.config) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50 px-4 py-12 md:py-24 flex items-center justify-center">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-[120px] dark:bg-primary-500/5 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] -z-10 h-[550px] w-[550px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5 animate-float-delayed pointer-events-none"></div>

      <OnboardingWizardPremium userEmail={user.email!} />
    </main>
  );
}

