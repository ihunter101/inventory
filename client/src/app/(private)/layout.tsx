// client/src/app/(private)/layout.tsx
import DashboardWrapper from "./DashboardWrapper"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }
    
  const token = await getToken()
  const apiURL = process.env.NEXT_PUBLIC_API_BASE_URL

  if (!apiURL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined")
  }

  const res = await fetch(`${apiURL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-cache",
  });

  if (!res.ok) redirect("/sign-in");

  const payload = await res.json();
  const me = payload.user ?? payload;

  if (!me?.onboardedAt) redirect("/onboarding");

  // ✅ Read the cookie correctly
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")
  
  // If cookie exists and is "true", open. If "false", close. If doesn't exist, open by default.
  const defaultOpen = sidebarCookie ? sidebarCookie.value === "true" : true
  

  return <DashboardWrapper>{children}</DashboardWrapper>
}