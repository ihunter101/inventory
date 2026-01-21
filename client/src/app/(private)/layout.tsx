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
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-cache"
  })

  if (!res.ok) {
    redirect("/sign-in")
  }

  const me = await res.json()
  
  if (!me?.onboardedAt) {
    redirect("/onboarding")
  }

  // Read the sidebar state cookie - fix the comparison
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")?.value
  // If cookie is "true" or doesn't exist, sidebar should be open
  const defaultOpen = sidebarState !== "false"

  return <DashboardWrapper defaultOpen={defaultOpen}>{children}</DashboardWrapper>
}