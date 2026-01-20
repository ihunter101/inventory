"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Search, Settings, User, Moon, Sun, ChevronDown, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import { useAppSelector } from "@/app/redux"
import { selectStockSheetCount } from "@/app/state/stockSheetSlice"

// Hamburger Menu Icon Component
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="flex h-5 w-5 flex-col items-center justify-center gap-1">
      <span 
        className={`h-0.5 w-5 bg-current transition-all duration-150 ${
          isOpen ? 'translate-y-1.5 rotate-45' : ''
        }`}
      />
      <span 
        className={`h-0.5 w-5 bg-current transition-all duration-150 ${
          isOpen ? 'opacity-0' : ''
        }`}
      />
      <span 
        className={`h-0.5 w-5 bg-current transition-all duration-150 ${
          isOpen ? '-translate-y-1.5 -rotate-45' : ''
        }`}
      />
    </div> 
  )
}

function StockSheetNavbarButton() {
  const count = useAppSelector(selectStockSheetCount);

  return (
    <Link
      href="/stock-sheet"
      className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:shadow-sm group"
    >
      <div className="relative">
        <ClipboardList className="h-5 w-5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/30 animate-pulse">
            {count}
          </span>
        )}
      </div>
      <span className="text-gray-700 group-hover:text-emerald-700 transition-colors">
        Stock Sheet
      </span>
    </Link>
  );
}

// Generate page title from pathname
function getPageTitle(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return "Dashboard"
  const lastSegment = segments[segments.length - 1]
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
}

export default function Navbar() {
  const router = useRouter()
  const { signOut } = useClerk()

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/sign-in" })
  }
  
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const { toggleSidebar, state } = useSidebar()

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark")
  }

  const isOpen = state === "expanded"

  return (
    <div className="flex flex-1 items-center justify-between gap-4">
      {/* Left Side - Hamburger + Title */}
      <div className="flex items-center gap-3">
        {/* Custom Hamburger Menu */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9 transition-colors"
        >
          <HamburgerIcon isOpen={isOpen} />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        {/* Page Title */}
        <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Search - Hidden on mobile */}
        <div className="hidden md:flex">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] pl-8 lg:w-[300px]"
            />
          </div>
        </div>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        {/* Stock Sheet Button - Fixed */}
        <StockSheetNavbarButton />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start py-3">
                <div className="font-medium">Low stock alert</div>
                <div className="text-xs text-muted-foreground">
                  5 products are running low on stock
                </div>
                <div className="text-xs text-muted-foreground">2 hours ago</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3">
                <div className="font-medium">New purchase order</div>
                <div className="text-xs text-muted-foreground">
                  PO-2025-001 has been approved
                </div>
                <div className="text-xs text-muted-foreground">5 hours ago</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3">
                <div className="font-medium">Invoice received</div>
                <div className="text-xs text-muted-foreground">
                  New invoice from Fisher Scientific
                </div>
                <div className="text-xs text-muted-foreground">1 day ago</div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="w-full justify-center text-center">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left lg:flex">
                <span className="text-sm font-medium">John Doe</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
              <ChevronDown className="hidden h-4 w-4 opacity-50 lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">John Doe</span>
                <span className="text-xs text-muted-foreground">john@example.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onSelect={handleLogout}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}