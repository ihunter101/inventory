"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Layout,
  Archive,
  Clipboard,
  ClipboardList,
  CircleDollarSign,
  BarChart3,
  User,
  SlidersHorizontal,
  PackageOpen,
  Sparkles,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import SidebarUserFooter from "./SideBaruserFooter"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useClerk, useUser } from "@clerk/nextjs"

// Navigation items structure
const navigation = {
  home: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Layout,
    },
  ],
  operations: [
    {
      title: "Inventory",
      href: "/inventory",
      icon: Archive,
    },
    {
      title: "Products",
      href: "/products",
      icon: Clipboard,
    },
    {
      title: "Stock Requests",
      href: "/stock-requests",
      icon: PackageOpen,
    },
    {
      title: "Pending Products",
      href: "/pending-promotions",
      icon: Sparkles,
    }
  ],
  finance: [
    {
      title: "Purchases",
      href: "/purchases",
      icon: ClipboardList,
    },
    {
      title: "Expenses",
      href: "/expenses",
      icon: CircleDollarSign,
    },
    {
      title: "Sales",
      href: "/sales",
      icon: BarChart3,
    },
  ],
  settings: [
    {
      title: "Users",
      href: "/users",
      icon: User,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: SlidersHorizontal,
    },
  ],
}

export function AppSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { user } = useUser()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href || pathname === "/"
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = async () => {
    try {
      await signOut({ redirectUrl: "/sign-in" })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header with Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-3">
                {/* EXPANDED logo */}
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm group-data-[collapsible=icon]:hidden">
                  <Image
                    src="/logo.png"
                    alt="LSCL Logo"
                    width={48}
                    height={48}
                    priority
                    className="h-11 w-11 object-contain"
                  />
                </div>

                {/* COLLAPSED logo */}
                <div className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm group-data-[collapsible=icon]:flex">
                  <Image
                    src="/logo.png"
                    alt="LSCL Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </div>

                {/* Text only when expanded */}
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold">LCS Stock</span>
                  <span className="text-xs text-muted-foreground">
                    Inventory System
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Home Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Home</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.home.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.href)} 
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Operations Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.operations.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.href)} 
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Finance Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Finance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.finance.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.href)} 
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Development Notice - Only shows when expanded */}
        <SidebarGroup className="mt-auto">
          <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20 group-data-[collapsible=icon]:hidden">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              • In development
            </span>
            <p className="mt-2 text-xs text-muted-foreground">
              Some features are still being built. You'll see them light up here soon.
            </p>
          </div>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel>People & Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.settings.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.href)} 
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarSeparator />

      <SidebarFooter>
        <SidebarUserFooter
          user={{
            name: user?.fullName || user?.username || "User",
            email: user?.primaryEmailAddress?.emailAddress || "user@example.com",
            imageUrl: user?.imageUrl || "/placeholder-avatar.jpg",
          }}
          onLogout={handleLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}