import DashboardWrapper from "./DashboardWrapper"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    cache: "no-store",
  })

  if (!res.ok) {
    redirect("/sign-in")
  }

  const payload = await res.json()
  const me = payload.user ?? payload

  if (!me?.onboardedAt) {
    redirect("/onboarding")
  }

  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")
  const defaultSidebarOpen = sidebarCookie
    ? sidebarCookie.value === "true"
    : true

  return (
    <DashboardWrapper defaultSidebarOpen={defaultSidebarOpen}>
      {children}
    </DashboardWrapper>
  )
}