"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/app/state";
import { Bell, Menu, Moon, Settings, Sun, Search } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const isSideBarCollapsed = useAppSelector((s) => s.global.isSideBarCollapsed);
  const { setTheme, theme } = useTheme();

  const toggleSidebar = () => dispatch(setIsSidebarCollapsed(!isSideBarCollapsed));
  const toggleDarkMode = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header className="flex w-full items-center justify-between mb-7">
      {/* LEFT: menu + search */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="
            inline-flex items-center justify-center
            rounded-full p-3
            bg-ink-100 hover:bg-ink-200
            dark:bg-ink-900 dark:hover:bg-ink-800
            shadow-sm
          "
        >
          <Menu className="h-4 w-4 text-foreground" />
        </button>

        <div className="relative">
          <input
            type="search"
            placeholder="Start typing to search groups and products"
            className="
              w-52 md:w-72
              rounded-lg
              border border-border
              bg-background
              pl-10 pr-4 py-2.5
              text-sm text-foreground
              placeholder:text-foreground/40
              focus:outline-none
              focus:ring-3 focus:ring-primary/20
              focus:border-primary
              transition
            "
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-foreground/50" />
          </div>
        </div>
      </div>

      {/* RIGHT: theme toggle + notifications + user */}
      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center gap-5">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-ink-50 dark:hover:bg-ink-900"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-foreground/80" />
            ) : (
              <Moon className="h-4 w-4 text-foreground/80" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-ink-50 dark:hover:bg-ink-900"
            >
              <Bell className="h-4 w-4 text-foreground/80" />
            </button>
            <span
              className="
                absolute -top-1 -right-1
                inline-flex h-4 min-w-[1rem] items-center justify-center
                rounded-full bg-primary px-[0.3rem]
                text-[10px] font-semibold text-primary-foreground
              "
            >
              3
            </span>
          </div>

          {/* Divider */}
          <span className="mx-2 h-6 w-px bg-border" />

          {/* Auth (Clerk) */}
          <SignedIn>
            <UserButton afterSignOutUrl="/sign-in" />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="
                  rounded-md border border-border
                  bg-background px-3 py-2
                  text-sm font-medium text-foreground
                  hover:bg-ink-50 dark:hover:bg-ink-900
                "
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>

          {/* Settings link */}
          <Link href="/settings" aria-label="Settings" className="ml-1">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-ink-50 dark:hover:bg-ink-900"
            >
              <Settings className="h-4 w-4 text-foreground/80" />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
