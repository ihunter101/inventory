"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/app/(components)/Navbar/Sidebar/index"
import Navbar from "@/app/(components)/Navbar"

interface DashboardWrapperProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

// Separate component to handle mobile sidebar closing on navigation
function SidebarContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()

  // Close mobile sidebar on navigation
  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [pathname, isMobile, setOpenMobile])

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <Navbar />
          </div>
        </header>

        <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </>
  )
}

export default function DashboardWrapper({ children, defaultOpen = true }: DashboardWrapperProps) {
  // Add key to force re-mount on defaultOpen change
  const [key, setKey] = React.useState(0)
  
  React.useEffect(() => {
    setKey(prev => prev + 1)
  }, [defaultOpen])

  return (
    <SidebarProvider key={key} defaultOpen={defaultOpen}>
      <SidebarContent>
        {children}
      </SidebarContent>
    </SidebarProvider>
  )
}