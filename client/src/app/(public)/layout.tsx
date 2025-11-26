// src/app/(public)/layout.tsx
"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">LCS Inventory</Link>
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="redirect">
                <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">Sign in</button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button className="rounded-lg border px-3 py-2 text-sm">Sign up</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
