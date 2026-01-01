// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check onboarding from PUBLIC metadata
  const onboardingComplete = sessionClaims?.public_metadata?.onboardingComplete === true;
  
  if (!onboardingComplete) {
    redirect("/onboarding");
  }

  return <DashboardClient />;
}