"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/app/state";
import { Bell, Menu, Moon, Settings, Sun } from "lucide-react";
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
    <div className="flex justify-between items-center w-full mb-7">
      {/* LEFT */}
      <div className="flex items-center gap-5">
        <button
          className="px-3 py-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="relative">
          <input
            type="search"
            placeholder="Start typing to search groups and Products"
            className="pl-10 pr-4 py-2 w-50 md:w-60 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Bell className="text-gray-500 dark:text-gray-300" size={20} />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center gap-5">
          <button onClick={toggleDarkMode}>
            {theme === "dark" ? (
              <Sun className="cursor-pointer text-gray-500 dark:text-gray-100" size={24} />
            ) : (
              <Moon className="cursor-pointer text-gray-500" size={24} />
            )}
          </button>

          <div className="relative">
            <Bell className="cursor-pointer text-gray-500 dark:text-gray-300" size={24} />
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-[0.4rem] py-1 text-xs font-semibold leading-none text-red-100 bg-red-400 rounded-full">
              3
            </span>
          </div>

          {/* separator */}
          <hr className="w-0 h-7 border-l border-gray-300 dark:border-gray-700 mx-3" />

          {/* Clerk auth controls */}
          <SignedIn>
            {/* Avatar menu includes Profile & Sign out by default */}
            <UserButton afterSignOutUrl="/sign-in" />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-3 py-2 rounded-md border dark:border-gray-700">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>

          <Link href="/settings" className="ml-2">
            <Settings className="cursor-pointer text-gray-500 dark:text-gray-300" size={24} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
