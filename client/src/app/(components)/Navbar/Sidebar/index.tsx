"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  FileText,
  DollarSign,
  TrendingUp,
  ClipboardList,
  Sparkles,
  Building2,
  X,
  HandCoins,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PERMS, type Perm } from "@lab/shared"
import { useAuth } from "@/app/hooks/useAuth"
import SidebarUserFooter from "./SideBaruserFooter"

type NavItem = {
  title: string
  href: string
  icon: React.ElementType
  permission: Perm
}

type Props = {
  open: boolean
  isMobile: boolean
  onCloseMobile: () => void
}

const navigation = {
  home: [
    { title: "Home", href: "/", icon: Home, permission: PERMS.ACCESS_HOME },
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      permission: PERMS.VIEW_DASHBOARD,
    },
  ] satisfies NavItem[],

  operations: [
    {
      title: "Inventory",
      href: "/inventory",
      icon: Package,
      permission: PERMS.READ_INVENTORY,
    },
    {
      title: "Products",
      href: "/products",
      icon: ShoppingCart,
      permission: PERMS.READ_PRODUCTS,
    },
    {
      title: "Stock Requests",
      href: "/stock-requests",
      icon: ClipboardList,
      permission: PERMS.READ_STOCK_SHEET,
    },
    {
      title: "Pending Products",
      href: "/pending-promotions",
      icon: Sparkles,
      permission: PERMS.READ_PRODUCT_DRAFT,
    },
  ] satisfies NavItem[],

  finance: [
    {
      title: "Purchases",
      href: "/purchases",
      icon: FileText,
      permission: PERMS.READ_PURCHASE_ORDERS,
    }, 
    {
      title: "Payments",
      href:"/payments",
      icon: HandCoins,
      permission: PERMS.READ_PURCHASE_ORDERS,
    },
    {
      title: "Expenses",
      href: "/expenses",
      icon: DollarSign,
      permission: PERMS.READ_EXPENSES,
    },
    {
      title: "Sales",
      href: "/sales",
      icon: TrendingUp,
      permission: PERMS.READ_SALES,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: ClipboardList,
      permission: PERMS.READ_PURCHASE_ORDERS,
    },
  ] satisfies NavItem[],

  settings: [
    // {
    //   title: "Suppliers",
    //   href: "/suppliers",
    //   icon: Building2,
    //   permission: PERMS.READ_SUPPLIERS,
    // },
    {
      title: "Users",
      href: "/users",
      icon: Users,
      permission: PERMS.READ_USERS,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      permission: PERMS.VIEW_SETTINGS,
    },
  ] satisfies NavItem[],
}

function LoadingSection({
  label,
  collapsed,
  rows = 3,
}: {
  label: string
  collapsed: boolean
  rows?: number
}) {
  return (
    <section className="space-y-2">
      {!collapsed && (
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      )}

      <div className="space-y-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`${label}-${i}`}
            className={`flex items-center rounded-xl px-3 py-2 ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <Skeleton className="h-5 w-5 rounded-md" />
            {!collapsed && <Skeleton className="h-4 flex-1" />}
          </div>
        ))}
      </div>
    </section>
  )
}

function NavSection({
  label,
  items,
  collapsed,
  isActive,
  onNavigate,
}: {
  label: string
  items: NavItem[]
  collapsed: boolean
  isActive: (href: string) => boolean
  onNavigate: () => void
}) {
  if (!items.length) return null

  return (
    <section className="space-y-2">
      {!collapsed && (
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      )}

      <div className="space-y-1">
        {items.map((item) => {
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.title : undefined}
              className={`group flex items-center rounded-xl px-3 py-2 text-sm transition-all ${
                collapsed ? "justify-center" : "gap-3"
              } ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function AppSidebar({ open, isMobile, onCloseMobile }: Props) {
  const pathname = usePathname()
  const { user, isLoading, can } = useAuth()

  const collapsed = !isMobile && !open

  const isActive = React.useCallback(
    (href: string) => {
      if (href === "/dashboard") return pathname === href || pathname === "/"
      return pathname === href || pathname.startsWith(`${href}/`)
    },
    [pathname]
  )

  const visible = React.useMemo(() => {
    const filter = (items: NavItem[]) => items.filter((item) => can(item.permission))
    return {
      home: filter(navigation.home),
      operations: filter(navigation.operations),
      finance: filter(navigation.finance),
      settings: filter(navigation.settings),
    }
  }, [can])

  return (
    <>
      {isMobile && open && (
        <button
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50"
        />
      )}

        <aside
    className={[
      "sidebar-shine relative z-50 flex h-screen shrink-0 flex-col overflow-hidden border-r bg-background transition-all duration-300",
      isMobile
        ? `fixed left-0 top-0 w-72 ${open ? "translate-x-0" : "-translate-x-full"}`
        : collapsed
        ? "relative w-20"
        : "relative w-72",
    ].join(" ")}
>
        <div className="flex h-16 items-center border-b px-3">
          <Link
            href="/dashboard"
            className={`flex w-full items-center ${collapsed ? "justify-center" : "gap-3"}`}
          >
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm">
              <Image
                src="/logo.png"
                alt="LSCL Logo"
                width={44}
                height={44}
                priority
                className="h-10 w-10 object-contain"
              />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate font-semibold">LCS Stock</p>
                <p className="truncate text-xs text-muted-foreground">
                  Inventory System
                </p>
              </div>
            )}
          </Link>

          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {isLoading ? (
              <>
                <LoadingSection label="Home" collapsed={collapsed} rows={2} />
                <div className="border-t" />
                <LoadingSection label="Operations" collapsed={collapsed} rows={4} />
                <div className="border-t" />
                <LoadingSection label="Finance" collapsed={collapsed} rows={4} />
                <div className="border-t" />
                <LoadingSection label="People & Settings" collapsed={collapsed} rows={3} />
              </>
            ) : (
              <>
                <NavSection
                  label="Home"
                  items={visible.home}
                  collapsed={collapsed}
                  isActive={isActive}
                  onNavigate={onCloseMobile}
                />

                {!!visible.home.length && !!visible.operations.length && <div className="border-t" />}

                <NavSection
                  label="Operations"
                  items={visible.operations}
                  collapsed={collapsed}
                  isActive={isActive}
                  onNavigate={onCloseMobile}
                />

                {!!visible.operations.length && !!visible.finance.length && <div className="border-t" />}

                <NavSection
                  label="Finance"
                  items={visible.finance}
                  collapsed={collapsed}
                  isActive={isActive}
                  onNavigate={onCloseMobile}
                />

                {!!visible.settings.length && <div className="border-t" />}

                <NavSection
                  label="People & Settings"
                  items={visible.settings}
                  collapsed={collapsed}
                  isActive={isActive}
                  onNavigate={onCloseMobile}
                />
              </>
            )}
          </div>
        </div>

        <div className="border-t p-3">
          <SidebarUserFooter
            collapsed={collapsed}
            user={{
              name: user?.name || "User",
              email: (user as any)?.email || "user@example.com",
              imageUrl: (user as any)?.imageUrl || "/placeholder-avatar.jpg",
              role: (user as any)?.role,
            }}
          />
        </div>
      </aside>
    </>
  )
}