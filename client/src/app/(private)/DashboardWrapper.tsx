"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/app/(components)/Navbar/Sidebar"
import Navbar from "@/app/(components)/Navbar"

interface DashboardWrapperProps {
  children: React.ReactNode
  defaultSidebarOpen?: boolean
}

const DESKTOP_BREAKPOINT = 1024

export default function DashboardWrapper({
  children,
  defaultSidebarOpen = true,
}: DashboardWrapperProps) {
  const pathname = usePathname()

  const [isMobile, setIsMobile] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(defaultSidebarOpen)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)

    const media = window.matchMedia(`(max-width: ${DESKTOP_BREAKPOINT - 1}px)`)

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = e.matches
      setIsMobile(mobile)

      if (mobile) {
        setSidebarOpen(false)
      } else {
        const stored =
          localStorage.getItem("sidebar_state") ??
          String(defaultSidebarOpen)
        setSidebarOpen(stored === "true")
      }
    }

    handleChange(media)

    const listener = (e: MediaQueryListEvent) => handleChange(e)
    media.addEventListener("change", listener)

    return () => media.removeEventListener("change", listener)
  }, [defaultSidebarOpen])

  React.useEffect(() => {
    if (!mounted || isMobile) return
    document.cookie = `sidebar_state=${sidebarOpen}; path=/; max-age=${60 * 60 * 24 * 30}`
    localStorage.setItem("sidebar_state", String(sidebarOpen))
  }, [sidebarOpen, mounted, isMobile])

  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  const toggleSidebar = React.useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const closeMobileSidebar = React.useCallback(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AppSidebar
          open={sidebarOpen}
          isMobile={isMobile}
          onCloseMobile={closeMobileSidebar}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-4 md:px-6">
              <Navbar
                sidebarOpen={sidebarOpen}
                isMobile={isMobile}
                onToggleSidebar={toggleSidebar}
              />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}