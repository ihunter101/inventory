"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  Settings,
  Moon,
  Sun,
  ChevronDown,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useClerk, useUser } from "@clerk/nextjs"
import { useAppSelector } from "@/app/redux"
import { selectStockSheetCount } from "@/app/state/stockSheetSlice"
import { useGetMeQuery } from "@/app/state/api"

type NavbarProps = {
  sidebarOpen: boolean
  isMobile: boolean
  onToggleSidebar: () => void
}

function StockSheetNavbarButton() {
  const count = useAppSelector(selectStockSheetCount)

  return (
    <Link
      href="/stock-sheet"
      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
    >
      <div className="relative">
        <ClipboardList className="h-5 w-5 text-emerald-600" />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </div>

      <span className="hidden lg:inline">Stock Sheet</span>
    </Link>
  )
}

function getPageTitle(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return "Dashboard"

  const last = segments[segments.length - 1]
  return last
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getInitials(name?: string | null) {
  if (!name) return "U"
  const parts = name.trim().split(" ")
  const first = parts[0]?.[0] ?? ""
  const second = parts[1]?.[0] ?? ""
  return `${first}${second}`.toUpperCase() || "U"
}

function formatRole(role?: string | null) {
  if (!role) return "User"

  return role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function Navbar({
  sidebarOpen,
  isMobile,
  onToggleSidebar,
}: NavbarProps) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  const { signOut } = useClerk()
  const { user } = useUser()
  const { data } = useGetMeQuery()

  const fullName = user?.fullName || data?.user?.name || "User"
  const email =
    user?.primaryEmailAddress?.emailAddress || data?.user?.email || "No email"
  const roleLabel = formatRole(data?.user?.role)
  const imageUrl =
    user?.imageUrl || data?.user?.imageUrl || "/placeholder-avatar.jpg"

  const [theme, setTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/sign-in" })
  }

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9 shrink-0"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>

        <h1 className="truncate text-lg font-semibold">{pageTitle}</h1>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <div className="hidden 2xl:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[220px] pl-8"
            />
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="shrink-0">
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        <StockSheetNavbarButton />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex min-w-0 shrink-0 items-center gap-3 rounded-xl border border-border/60 bg-background px-2 sm:px-3 py-1.5 transition hover:bg-accent hover:text-accent-foreground"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={imageUrl} alt={fullName} />
                <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
              </Avatar>

              <div className="hidden min-w-0 text-left leading-tight sm:block">
                <p className="max-w-[120px] truncate text-sm font-semibold xl:max-w-[160px]">
                  {fullName}
                </p>
                <p className="max-w-[120px] truncate text-xs text-muted-foreground xl:max-w-[160px]">
                  {roleLabel}
                </p>
              </div>

              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 rounded-xl">
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={imageUrl} alt={fullName} />
                  <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate font-semibold">{fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {roleLabel}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}