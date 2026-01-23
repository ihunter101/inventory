//client/src/app/(components)/auth/RouteGaurd.tsx

"use client";

import { Perm } from "@lab/shared";
import { useAuth } from "@/app/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPerm: Perm;
  fallback?: "not-found" | "unauthorized"; // Choose your strategy
}

export const RouteGuard = ({ 
  children, 
  requiredPerm,
  fallback = "not-found" 
}: RouteGuardProps) => {
  const { can, isLoading, isAuthenticated, isError } = useAuth();

  // 1. Still loading user data
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  // 2. API error (network issue, server down, etc.)
  if (isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">
            Unable to verify permissions
          </p>
          <p className="text-sm text-gray-600">
            Please refresh the page or contact support
          </p>
        </div>
      </div>
    );
  }

  // 3. Not authenticated (shouldn't happen if Clerk middleware works, but defense in depth)
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  // 4. Authenticated but lacks permission
  if (!can(requiredPerm)) {
    console.warn(`[RouteGuard] Access denied: Missing permission '${requiredPerm}'`);
    
    if (fallback === "not-found") {
      // ✅ RECOMMENDED: Triggers Next.js 404 page - gives no indication the route exists
      notFound();
    }
    
    // Alternative: Show unauthorized message (less secure, reveals route exists)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  // 5. All checks passed - render the protected content
  return <>{children}</>;
};