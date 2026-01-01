// app/onboarding/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if already onboarded
  const onboardingComplete = sessionClaims?.public_metadata?.onboardingComplete === true;
  
  if (onboardingComplete) {
    redirect("/dashboard");
  }

  return (
    <OnboardingForm
      initialName=""
      initialLocation="Tapion"
    />
  );
}