// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

// app/dashboard/page.tsx

export default async function DashboardPage() {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const token = await getToken();

  if (!token) { redirect("/sign-in");}
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  if (res.status === 401 || res.status === 403) {
    redirect("/sign-in");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch /me: ${res.status}`);
  }

  const data = await res.json();

  if (!data?.user) {
    redirect("/sign-in");
  }

  if (!data.user.onboardedAt) {
    redirect("/onboarding");
  }


  // // Fetch from DB instead of trusting sesionClaims
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
  //   headers: { Authorization: `Bearer ${await (await auth()).getToken()}` },
  //   cache: "no-store"
  // });

  // const data = await res.json();
  // const dbUser = data?.user;

  
  return <DashboardClient />;
}