// app/onboarding/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const token = await auth().then(a => a.getToken());
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  try {
    const res = await fetch(`${apiUrl}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    console.log("Onboarding - GET /me status:", res.status);

    if (!res.ok) {
  const txt = await res.text();
  throw new Error(`GET /me failed: ${res.status} ${txt}`);
}

    // ✅ User exists and responded successfully
    if (res.ok) {
      const me = await res.json();

      // If already onboarded, go to dashboard
      if (me?.onboardedAt) {
        console.log("User already onboarded, redirecting to dashboard");
        redirect("/dashboard");
      }

      console.log("apiUrl:", apiUrl);
console.log("me status:", res.status);

      // User exists but not onboarded - show form with their data
      return (
        <OnboardingForm
          initialName={me?.name ?? ""}
          initialLocation={me?.location ?? "Tapion"}
        />
      );
    }

    // ✅ User doesn't exist yet (404/401) - that's OKAY for onboarding
    // The ensureUser middleware will create them when they submit the form
    if (res.status === 404 || res.status === 401) {
      console.log("User not in DB yet - showing onboarding form");
      return (
        <OnboardingForm
          initialName=""
          initialLocation="Tapion"
        />
      );
    }

    // ✅ Other server errors (500, etc.)
    console.error("Unexpected error fetching user for onboarding:", res.status);
    const errorText = await res.text();
    console.error("Error details:", errorText);
    
    // Still show the form - don't block onboarding
    return (
      <OnboardingForm
        initialName=""
        initialLocation="Tapion"
      />
    );

  } catch (error: any) {
    // Re-throw redirect errors (they're expected)
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error("Error in onboarding page:", error);
    
    // Don't block onboarding - show the form anyway
    return (
      <OnboardingForm
        initialName=""
        initialLocation="Tapion"
      />
    );
  }
}