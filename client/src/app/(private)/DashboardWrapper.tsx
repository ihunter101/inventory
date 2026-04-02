"use client"

import * as React from "react"
import Navbar from "@/app/(components)/Navbar"
import { AppSidebar } from "@/app/(components)/Navbar/Sidebar"

type Props = {
  children: React.ReactNode
  defaultSidebarOpen?: boolean
}

const MOBILE_BREAKPOINT = 768

export default function DashboardWrapper({
  children,
  defaultSidebarOpen = true,
}: Props) {
  const [isMobile, setIsMobile] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(defaultSidebarOpen)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)

    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const apply = (mobile: boolean) => {
      setIsMobile(mobile)

      if (mobile) {
        setSidebarOpen(false)
      } else {
        const saved = localStorage.getItem("sidebar_state")
        setSidebarOpen(saved ? saved === "true" : defaultSidebarOpen)
      }
    }

    apply(media.matches)

    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    media.addEventListener("change", handler)

    return () => media.removeEventListener("change", handler)
  }, [defaultSidebarOpen])

  React.useEffect(() => {
    if (!mounted || isMobile) return
    localStorage.setItem("sidebar_state", String(sidebarOpen))
    document.cookie = `sidebar_state=${sidebarOpen}; path=/; max-age=${60 * 60 * 24 * 30}`
  }, [sidebarOpen, isMobile, mounted])

  const toggleSidebar = React.useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const closeMobileSidebar = React.useCallback(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const desktopOffset = sidebarOpen ? "md:pl-[260px]" : "md:pl-[72px]"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar
        open={sidebarOpen}
        isMobile={isMobile}
        onCloseMobile={closeMobileSidebar}
      />

      <div
        className={[
          "min-h-screen w-full transition-[padding] duration-300 ease-out",
          "pl-0",
          desktopOffset,
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 min-w-0 items-center px-3 sm:px-4 md:px-6">
            <Navbar
              sidebarOpen={sidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
            />
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}