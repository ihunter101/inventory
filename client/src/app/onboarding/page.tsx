// app/onboarding/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const token = await (await auth()).getToken();

  if (!token) redirect("/sign-in");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  // If /me fails (user not in DB yet), just show onboarding
  if (!res.ok) {
    return <OnboardingForm initialName="" initialLocation="Tapion" />;
  }

  const data = await res.json();
  const dbUser = data?.user;

  console.log("this is the user details", dbUser);

  if (dbUser?.onboardedAt) {
    redirect("/dashboard");
  }

  return (
    <OnboardingForm
      initialName=""
      initialLocation="Tapion"
    />
  );
}