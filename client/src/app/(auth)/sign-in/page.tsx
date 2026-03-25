import { SignInForm } from "@/app/features/auth/sign-in-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
 const { userId, getToken } = await auth();

  if (userId) {
    // Check Prisma via your internal fetch
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
      cache: "no-store"
    });

    if (res.ok) {
      const { user } = await res.json();
      
      // If Prisma says they are fully onboarded, get them out of the login page!
      if (user?.onboardedAt) {
        redirect("/products");
      } else {
        redirect("/onboarding");
      }
    }
  }
      
  return <SignInForm />;
}
