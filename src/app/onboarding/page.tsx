import { redirect } from "next/navigation";
import { SmartWizard } from "@/components/onboarding/smart-wizard";
import { getProfessional, getAuthUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ reset?: string; test?: string }>;
};

export default async function OnboardingPage({ searchParams }: Props) {
  const params = await searchParams;
  const allowRerun = params.reset === "true" || params.test === "true";

  const user = await getAuthUser();
  if (!user) redirect("/login?next=/onboarding");

  const professional = await getProfessional();
  if (professional?.config && !allowRerun) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F5F7] text-[#1C1C1E] px-4 py-8 sm:py-12 md:py-16 flex items-center justify-center selection:bg-[#007AFF]/20">
      {/* Decorative Apple-style Soft Glow Orbs */}
      <div className="absolute top-[8%] left-[20%] -z-10 h-96 w-96 rounded-full bg-[#007AFF]/6 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[15%] -z-10 h-[28rem] w-[28rem] rounded-full bg-[#5856D6]/6 blur-[120px] pointer-events-none" />

      <SmartWizard
        userEmail={user.email || ""}
        initialName={professional?.name || ""}
        initialSlug={professional?.slug || ""}
      />
    </main>
  );
}
