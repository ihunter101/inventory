// client/app/(private)/DashboardWrapper.tsx
"use client"
import React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/app/(components)/Navbar/Sidebar/index"
import Navbar from "@/app/(components)/Navbar"

interface DashboardWrapperProps {
  children: React.ReactNode
}

function SidebarContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { setOpenMobile, isMobile, state, open, setOpen } = useSidebar()
  
  // Force sidebar open on mount for desktop
  React.useEffect(() => {
    if (!isMobile && !open) {
      console.log("🔧 Force opening sidebar on desktop")
      setOpen(true)
    }
  }, [isMobile, open, setOpen])
  
  // Debug logging
  React.useEffect(() => {
    console.log("🔍 Sidebar state:", { 
      isMobile, 
      state, 
      open,
      pathname 
    })
  }, [isMobile, state, open, pathname])
  
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

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  // Use controlled state to override cookie behavior
  const [open, setOpen] = React.useState(true)
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    console.log("📝 Sidebar open changed to:", newOpen)
    setOpen(newOpen)
    
    // Manually set cookie since we're controlling state
    document.cookie = `sidebar_state=${newOpen}; path=/; max-age=${60 * 60 * 24 * 7}`
  }, [])
  
  return (
    <SidebarProvider open={open} onOpenChange={handleOpenChange}>
      <SidebarContent>
        {children}
      </SidebarContent>
    </SidebarProvider>
  )
}