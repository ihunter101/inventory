// src/app/(private)/layout.tsx   (server component)
import DashboardWrapper from "./DashboardWrapper"; // note: .. not ./
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {

  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
    
  const token = await getToken();

  const apiURL = process.env.NEXT_PUBLIC_API_BASE_URL

  if (!apiURL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined")
  }

  const res = await fetch(`${apiURL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-cache"
  })

  if (!res.ok) {
    redirect("/sign-in");
  }

  const me = await res.json();
  if (!me?.onboardedAt) {
    redirect("/onboarding");
  }

  return <DashboardWrapper>{children}</DashboardWrapper>;
}
