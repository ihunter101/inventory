"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BellDotIcon, ChevronsUpDown, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"

type Props = {
  user: {
    name: string
    email: string
    imageUrl?: string
    role?: string
  }
  onLogout?: () => void
}

export default function SidebarUserFooter({ user, onLogout }: Props) {

  const router = useRouter()
  const { signOut } = useClerk()

  const handleLogout = async () => {
    // Optional: redirect after sign out
    await signOut({ redirectUrl: "/sign-in" })
  } 
  
  const initials = React.useMemo(() => {
    const parts = user.name.trim().split(" ")
    const a = parts[0]?.[0] ?? "U"
    const b = parts[1]?.[0] ?? ""
    return (a + b).toUpperCase()
  }, [user.name])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* This button becomes icon-only when collapsed (shadcn sidebar handles it) */}
            <SidebarMenuButton size="lg" className="w-full">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.imageUrl} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>

              {/* Hide text when collapsed to icon */}
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side="right"
            sideOffset={8}
            className="w-64 rounded-xl bg-popover text-popover-foreground border border-border shadow-lg"
          >
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 rounded-lg">
                  <AvatarImage src={user.imageUrl} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid leading-tight">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BellDotIcon className="mr-2 size-4" />
                Notification
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 size-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
                Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

