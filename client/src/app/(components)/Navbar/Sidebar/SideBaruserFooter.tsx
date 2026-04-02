"use client"

import * as React from "react"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BellDotIcon, ChevronsUpDown, LogOut, Settings, User } from "lucide-react"

type Props = {
  user: {
    name: string
    email: string
    imageUrl?: string
    role?: string
  }
  collapsed?: boolean
}

export default function SidebarUserFooter({
  user,
  collapsed = false,
}: Props) {
  const { signOut } = useClerk()

  const initials = React.useMemo(() => {
    const parts = user.name.trim().split(" ")
    const first = parts[0]?.[0] ?? "U"
    const second = parts[1]?.[0] ?? ""
    return (first + second).toUpperCase()
  }, [user.name])

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/sign-in" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex w-full items-center rounded-xl border border-border/60 bg-background px-2.5 py-2 text-left transition hover:bg-accent hover:text-accent-foreground ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <Avatar className="h-9 w-9 rounded-lg">
            <AvatarImage src={user.imageUrl} alt={user.name} />
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        className="w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
      >
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarImage src={user.imageUrl} alt={user.name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {/* <DropdownMenuItem>
            <BellDotIcon className="mr-2 h-4 w-4" />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Account
          </DropdownMenuItem> */}
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
  )
}