"use client"

import React, { useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/app/(components)/Navbar/Sidebar/index"
import Navbar from "@/app/(components)/Navbar"
import { useUser } from "@clerk/nextjs"

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, user } = useUser()

  // Reset sidebar state when user signs in/out
  useEffect(() => {
    if (isSignedIn) {
      // When user signs in, ensure sidebar is open by default
      const sidebarState = localStorage.getItem("sidebar:state")
      if (!sidebarState) {
        localStorage.setItem("sidebar:state", "true")
      }
    }
  }, [isSignedIn, user?.id])

  return (
    <SidebarProvider 
      defaultOpen={true}
      // Force re-render when user changes to reset sidebar state
      key={user?.id || "no-user"}
    >
      <AppSidebar />
      <SidebarInset>
        {/* Header with Custom Navbar */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <div className="flex-1">
            <Navbar />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return <DashboardLayout>{children}</DashboardLayout>
}

export default DashboardWrapper